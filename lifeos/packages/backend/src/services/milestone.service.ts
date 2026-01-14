import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

export class MilestoneService {
  /**
   * Create milestones for a goal
   */
  async createMilestones(
    goalId: string,
    goalType: 'FINANCIAL' | 'FITNESS',
    milestones: Array<{
      name: string;
      targetValue: number;
      order?: number;
    }>
  ) {
    const created = await prisma.goalMilestone.createMany({
      data: milestones.map((m, index) => ({
        goalId,
        goalType,
        name: m.name,
        targetValue: m.targetValue,
        order: m.order ?? index,
      })),
    });

    logger.info({ goalId, goalType, count: created.count }, 'Milestones created');
    return created;
  }

  /**
   * Auto-generate milestones for a financial goal
   */
  async autoGenerateFinancialMilestones(goalId: string, count = 4) {
    const goal = await prisma.financialGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const step = goal.targetAmount / count;
    const milestones = [];

    for (let i = 1; i <= count; i++) {
      const percentage = Math.round((i / count) * 100);
      milestones.push({
        goalId,
        goalType: 'FINANCIAL',
        name: `${percentage}% Complete`,
        targetValue: Math.round(step * i),
        order: i,
      });
    }

    await prisma.goalMilestone.createMany({ data: milestones });

    logger.info({ goalId, count }, 'Auto-generated milestones');
    return prisma.goalMilestone.findMany({ 
      where: { goalId, goalType: 'FINANCIAL' },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Auto-generate milestones for a fitness goal
   */
  async autoGenerateFitnessMilestones(goalId: string, count = 4) {
    const goal = await prisma.fitnessGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const range = goal.targetValue - goal.startValue;
    const step = range / count;
    const milestones = [];

    for (let i = 1; i <= count; i++) {
      const percentage = Math.round((i / count) * 100);
      milestones.push({
        goalId,
        goalType: 'FITNESS',
        name: `${percentage}% Complete`,
        targetValue: goal.startValue + Math.round(step * i),
        order: i,
      });
    }

    await prisma.goalMilestone.createMany({ data: milestones });

    logger.info({ goalId, count }, 'Auto-generated fitness milestones');
    return prisma.goalMilestone.findMany({ 
      where: { goalId, goalType: 'FITNESS' },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get milestones for a goal
   */
  async getForGoal(goalId: string, goalType: 'FINANCIAL' | 'FITNESS') {
    return prisma.goalMilestone.findMany({
      where: { goalId, goalType },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Check and update financial milestone completion
   */
  async checkFinancialMilestoneCompletion(goalId: string) {
    const goal = await prisma.financialGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const milestones = await prisma.goalMilestone.findMany({
      where: { goalId, goalType: 'FINANCIAL', isCompleted: false },
      orderBy: { targetValue: 'asc' },
    });

    const nowCompleted = [];

    for (const milestone of milestones) {
      if (goal.currentAmount >= milestone.targetValue) {
        await prisma.goalMilestone.update({
          where: { id: milestone.id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
          },
        });
        nowCompleted.push(milestone);
        logger.info({ goalId, milestoneId: milestone.id }, 'Milestone completed');
      }
    }

    return nowCompleted;
  }

  /**
   * Check and update fitness milestone completion
   */
  async checkFitnessMilestoneCompletion(goalId: string) {
    const goal = await prisma.fitnessGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const milestones = await prisma.goalMilestone.findMany({
      where: { goalId, goalType: 'FITNESS', isCompleted: false },
      orderBy: { targetValue: 'asc' },
    });

    const nowCompleted = [];

    for (const milestone of milestones) {
      // Check if progress reaches milestone (handle both increase and decrease goals)
      const isReached = goal.targetValue > goal.startValue
        ? goal.currentValue >= milestone.targetValue
        : goal.currentValue <= milestone.targetValue;

      if (isReached) {
        await prisma.goalMilestone.update({
          where: { id: milestone.id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
          },
        });
        nowCompleted.push(milestone);
        logger.info({ goalId, milestoneId: milestone.id }, 'Fitness milestone completed');
      }
    }

    return nowCompleted;
  }

  /**
   * Get next milestone for a goal
   */
  async getNextMilestone(goalId: string, goalType: 'FINANCIAL' | 'FITNESS') {
    return prisma.goalMilestone.findFirst({
      where: { goalId, goalType, isCompleted: false },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get milestone progress for financial goal
   */
  async getFinancialMilestoneProgress(goalId: string) {
    const [goal, milestones] = await Promise.all([
      prisma.financialGoal.findUnique({ where: { id: goalId } }),
      prisma.goalMilestone.findMany({
        where: { goalId, goalType: 'FINANCIAL' },
        orderBy: { order: 'asc' },
      }),
    ]);

    if (!goal) {
      throw new Error('Goal not found');
    }

    const completed = milestones.filter(m => m.isCompleted).length;
    const next = milestones.find(m => !m.isCompleted);

    return {
      total: milestones.length,
      completed,
      remaining: milestones.length - completed,
      nextMilestone: next ? {
        ...next,
        amountNeeded: next.targetValue - goal.currentAmount,
        progressToNext: (goal.currentAmount / next.targetValue) * 100,
      } : null,
      allMilestones: milestones.map(m => ({
        ...m,
        progress: Math.min(100, (goal.currentAmount / m.targetValue) * 100),
      })),
    };
  }

  /**
   * Update a milestone
   */
  async update(id: string, data: { name?: string; targetValue?: number; order?: number }) {
    return prisma.goalMilestone.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a milestone
   */
  async delete(id: string) {
    await prisma.goalMilestone.delete({ where: { id } });
    logger.info({ milestoneId: id }, 'Milestone deleted');
  }
}

export const milestoneService = new MilestoneService();
