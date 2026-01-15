import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { GoalStatus } from '@prisma/client';
import { achievementService } from './achievement.service.js';

export interface CreateFinancialGoalDTO {
  userId: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution?: number;
  startDate: string;
  targetDate: string;
  notes?: string;
}

export interface UpdateFinancialGoalDTO {
  name?: string;
  type?: string;
  targetAmount?: number;
  currentAmount?: number;
  monthlyContribution?: number;
  startDate?: string;
  targetDate?: string;
  notes?: string;
  isPaused?: boolean;
  isArchived?: boolean;
}

export class FinancialGoalService {
  /**
   * Calculate goal status based on progress percentage
   */
  private calculateStatus(currentAmount: number, targetAmount: number): GoalStatus {
    const progress = (currentAmount / targetAmount) * 100;
    if (progress >= 100) return 'COMPLETED';
    if (progress >= 75) return 'ON_TRACK';
    if (progress >= 40) return 'NEEDS_FOCUS';
    return 'BEHIND';
  }

  /**
   * Add progress calculation to goal object
   */
  private withProgress<T extends { currentAmount: number; targetAmount: number }>(goal: T) {
    return {
      ...goal,
      progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
    };
  }

  /**
   * Get all financial goals for a user
   */
  async getAll(userId: string, options?: { status?: GoalStatus; archived?: boolean }) {
    logger.debug({ userId, options }, 'Fetching financial goals');

    const goals = await prisma.financialGoal.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
        isArchived: options?.archived ?? false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => this.withProgress(goal));
  }

  /**
   * Get a single financial goal by ID
   */
  async getById(id: string, userId: string) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return null;
    }

    return this.withProgress(goal);
  }

  /**
   * Create a new financial goal
   */
  async create(data: CreateFinancialGoalDTO) {
    const currentAmount = data.currentAmount ?? 0;

    logger.info({ userId: data.userId, name: data.name }, 'Creating financial goal');

    const goal = await prisma.financialGoal.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type as any,
        targetAmount: data.targetAmount,
        currentAmount,
        monthlyContribution: data.monthlyContribution ?? 0,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        notes: data.notes,
        status: this.calculateStatus(currentAmount, data.targetAmount),
      },
    });

    logger.info({ goalId: goal.id }, 'Financial goal created');
    
    // Check and unlock any achievements
    achievementService.checkAndUnlock(data.userId).catch(err => 
      logger.error({ err, userId: data.userId }, 'Failed to check achievements')
    );
    
    return this.withProgress(goal);
  }

  /**
   * Update a financial goal
   */
  async update(id: string, userId: string, data: UpdateFinancialGoalDTO) {
    // Check ownership
    const existingGoal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return null;
    }

    const newCurrentAmount = data.currentAmount ?? existingGoal.currentAmount;
    const newTargetAmount = data.targetAmount ?? existingGoal.targetAmount;

    logger.info({ goalId: id, updates: Object.keys(data) }, 'Updating financial goal');

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        ...data,
        type: data.type as any,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: this.calculateStatus(newCurrentAmount, newTargetAmount),
      },
    });

    // Check and unlock any achievements
    achievementService.checkAndUnlock(userId).catch(err => 
      logger.error({ err, userId }, 'Failed to check achievements')
    );

    return this.withProgress(goal);
  }

  /**
   * Delete a financial goal
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return false;
    }

    logger.info({ goalId: id }, 'Deleting financial goal');

    await prisma.financialGoal.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Update the saved amount for a goal
   */
  async updateAmount(id: string, userId: string, amount: number) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      return null;
    }

    const newAmount = goal.currentAmount + amount;

    logger.info({ goalId: id, previousAmount: goal.currentAmount, newAmount }, 'Updating goal amount');

    const updated = await prisma.financialGoal.update({
      where: { id },
      data: {
        currentAmount: newAmount,
        status: this.calculateStatus(newAmount, goal.targetAmount),
      },
    });

    // Check and unlock any achievements (for savings milestones)
    achievementService.checkAndUnlock(userId).catch(err => 
      logger.error({ err, userId }, 'Failed to check achievements')
    );

    return this.withProgress(updated);
  }

  /**
   * Get financial summary for dashboard
   */
  async getSummary(userId: string) {
    const goals = await prisma.financialGoal.findMany({
      where: { userId, isArchived: false, isPaused: false },
    });

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    return {
      totalGoals: goals.length,
      totalTarget,
      totalSaved,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      goalsByStatus: {
        onTrack: goals.filter((g) => g.status === 'ON_TRACK').length,
        needsFocus: goals.filter((g) => g.status === 'NEEDS_FOCUS').length,
        behind: goals.filter((g) => g.status === 'BEHIND').length,
        completed: goals.filter((g) => g.status === 'COMPLETED').length,
      },
      goals: goals.map((g) => this.withProgress(g)),
    };
  }
}

export const financialGoalService = new FinancialGoalService();
