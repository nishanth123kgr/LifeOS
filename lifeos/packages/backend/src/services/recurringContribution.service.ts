import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { ContributionFrequency } from '@prisma/client';

export class RecurringContributionService {
  /**
   * Create a recurring contribution
   */
  async create(
    userId: string,
    goalId: string,
    data: {
      amount: number;
      frequency: ContributionFrequency;
    }
  ) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Calculate next run date based on frequency
    const nextRunDate = this.calculateNextRunDate(data.frequency, new Date());

    const contribution = await prisma.recurringContribution.create({
      data: {
        userId,
        goalId,
        goalType: 'FINANCIAL',
        amount: data.amount,
        frequency: data.frequency,
        nextRunDate,
      },
    });

    logger.info({ userId, goalId, contributionId: contribution.id }, 'Recurring contribution created');
    return contribution;
  }

  /**
   * Calculate next run date based on frequency
   */
  private calculateNextRunDate(frequency: ContributionFrequency, fromDate: Date): Date {
    const next = new Date(fromDate);
    next.setHours(0, 0, 0, 0);

    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  /**
   * Get recurring contributions for a user
   */
  async getForUser(userId: string, activeOnly = true) {
    return prisma.recurringContribution.findMany({
      where: { 
        userId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { nextRunDate: 'asc' },
    });
  }

  /**
   * Get recurring contributions for a goal
   */
  async getForGoal(goalId: string, userId: string) {
    return prisma.recurringContribution.findMany({
      where: { goalId, userId, isActive: true },
      orderBy: { nextRunDate: 'asc' },
    });
  }

  /**
   * Get all due recurring contributions
   */
  async getDueContributions() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return prisma.recurringContribution.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: today },
      },
    });
  }

  /**
   * Process a recurring contribution (add to goal)
   */
  async processContribution(contributionId: string) {
    const contribution = await prisma.recurringContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      throw new Error('Recurring contribution not found');
    }

    // Update goal amount
    await prisma.financialGoal.update({
      where: { id: contribution.goalId },
      data: {
        currentAmount: { increment: contribution.amount },
      },
    });

    // Update recurring contribution with next run date
    const nextRunDate = this.calculateNextRunDate(contribution.frequency, new Date());
    
    await prisma.recurringContribution.update({
      where: { id: contributionId },
      data: {
        lastRunDate: new Date(),
        nextRunDate,
      },
    });

    logger.info(
      { contributionId, goalId: contribution.goalId, amount: contribution.amount },
      'Recurring contribution processed'
    );

    return contribution;
  }

  /**
   * Process all due contributions
   */
  async processAllDue() {
    const dueContributions = await this.getDueContributions();
    const results = [];

    for (const contribution of dueContributions) {
      try {
        await this.processContribution(contribution.id);
        results.push({ id: contribution.id, status: 'processed' });
      } catch (error: any) {
        logger.error({ contributionId: contribution.id, error: error.message }, 'Failed to process contribution');
        results.push({ id: contribution.id, status: 'failed', error: error.message });
      }
    }

    logger.info({ processed: results.filter(r => r.status === 'processed').length }, 'Processed due contributions');
    return results;
  }

  /**
   * Update a recurring contribution
   */
  async update(
    contributionId: string,
    userId: string,
    data: {
      amount?: number;
      frequency?: ContributionFrequency;
      isActive?: boolean;
    }
  ) {
    const contribution = await prisma.recurringContribution.findFirst({
      where: { id: contributionId, userId },
    });

    if (!contribution) {
      throw new Error('Contribution not found');
    }

    const updateData: any = { ...data };

    // Recalculate next run date if frequency changed
    if (data.frequency && data.frequency !== contribution.frequency) {
      updateData.nextRunDate = this.calculateNextRunDate(data.frequency, new Date());
    }

    return prisma.recurringContribution.update({
      where: { id: contributionId },
      data: updateData,
    });
  }

  /**
   * Pause a recurring contribution
   */
  async pause(contributionId: string, userId: string) {
    const contribution = await prisma.recurringContribution.findFirst({
      where: { id: contributionId, userId },
    });

    if (!contribution) {
      throw new Error('Contribution not found');
    }

    await prisma.recurringContribution.update({
      where: { id: contributionId },
      data: { isActive: false },
    });
    
    logger.info({ contributionId }, 'Recurring contribution paused');
  }

  /**
   * Resume a recurring contribution
   */
  async resume(contributionId: string, userId: string) {
    const contribution = await prisma.recurringContribution.findFirst({
      where: { id: contributionId, userId },
    });

    if (!contribution) {
      throw new Error('Contribution not found');
    }

    // Recalculate next run date from today
    const nextRunDate = this.calculateNextRunDate(contribution.frequency, new Date());

    await prisma.recurringContribution.update({
      where: { id: contributionId },
      data: { isActive: true, nextRunDate },
    });

    logger.info({ contributionId }, 'Recurring contribution resumed');
  }

  /**
   * Delete a recurring contribution
   */
  async delete(contributionId: string, userId: string) {
    const contribution = await prisma.recurringContribution.findFirst({
      where: { id: contributionId, userId },
    });

    if (!contribution) {
      throw new Error('Contribution not found');
    }

    await prisma.recurringContribution.delete({ where: { id: contributionId } });
    logger.info({ contributionId }, 'Recurring contribution deleted');
  }

  /**
   * Get upcoming contributions forecast
   */
  async getForecast(userId: string, months = 3) {
    const contributions = await prisma.recurringContribution.findMany({
      where: { userId, isActive: true },
    });

    const forecast: Array<{ date: Date; amount: number; goalId: string; contributionId: string }> = [];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    for (const contribution of contributions) {
      let nextDate = new Date(contribution.nextRunDate);

      while (nextDate <= endDate) {
        forecast.push({
          date: new Date(nextDate),
          amount: contribution.amount,
          goalId: contribution.goalId,
          contributionId: contribution.id,
        });

        // Calculate next occurrence
        nextDate = this.calculateNextRunDate(contribution.frequency, nextDate);
      }
    }

    // Sort by date
    forecast.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate cumulative by goal
    const byGoal: Record<string, number> = {};
    forecast.forEach(f => {
      byGoal[f.goalId] = (byGoal[f.goalId] || 0) + f.amount;
    });

    const totalExpected = forecast.reduce((sum, f) => sum + f.amount, 0);

    return {
      items: forecast,
      byGoal,
      totalExpected,
      monthlyAverage: months > 0 ? totalExpected / months : 0,
    };
  }

  /**
   * Get summary of recurring contributions
   */
  async getSummary(userId: string) {
    const contributions = await prisma.recurringContribution.findMany({
      where: { userId, isActive: true },
    });

    const monthlyTotal = contributions.reduce((sum, c) => {
      switch (c.frequency) {
        case 'DAILY': return sum + c.amount * 30;
        case 'WEEKLY': return sum + c.amount * 4;
        case 'BIWEEKLY': return sum + c.amount * 2;
        case 'MONTHLY': return sum + c.amount;
        default: return sum;
      }
    }, 0);

    return {
      activeCount: contributions.length,
      monthlyTotal,
      byFrequency: {
        daily: contributions.filter(c => c.frequency === 'DAILY').length,
        weekly: contributions.filter(c => c.frequency === 'WEEKLY').length,
        biweekly: contributions.filter(c => c.frequency === 'BIWEEKLY').length,
        monthly: contributions.filter(c => c.frequency === 'MONTHLY').length,
      },
    };
  }
}

export const recurringContributionService = new RecurringContributionService();
