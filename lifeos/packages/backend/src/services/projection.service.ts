import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

interface ProjectionParams {
  currentAmount: number;
  targetAmount: number;
  targetDate: Date;
  monthlyContribution?: number;
  annualReturnRate?: number;
}

interface ProjectionResult {
  monthlyRequired: number;
  weeklyRequired: number;
  dailyRequired: number;
  projectedCompletion: Date | null;
  isOnTrack: boolean;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  projectedFinalAmount?: number;
  scenarios: ProjectionScenario[];
}

interface ProjectionScenario {
  name: string;
  monthlyAmount: number;
  completionDate: Date;
  finalAmount: number;
}

export class ProjectionService {
  /**
   * Calculate financial projections for a goal
   */
  calculateProjection(params: ProjectionParams): ProjectionResult {
    const { currentAmount, targetAmount, targetDate, monthlyContribution, annualReturnRate } = params;

    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const monthsRemaining = daysRemaining / 30;
    const weeksRemaining = daysRemaining / 7;

    const progressPercentage = targetAmount > 0 
      ? Math.min(100, (currentAmount / targetAmount) * 100) 
      : 0;

    // Calculate required contributions
    const dailyRequired = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
    const weeklyRequired = weeksRemaining > 0 ? remainingAmount / weeksRemaining : 0;
    const monthlyRequired = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;

    // Calculate if on track (with current monthly contribution)
    let isOnTrack = false;
    let projectedCompletion: Date | null = null;
    let projectedFinalAmount: number | undefined;

    if (monthlyContribution && monthlyContribution > 0) {
      // Simple projection without compound interest
      const monthsToComplete = remainingAmount / monthlyContribution;
      projectedCompletion = new Date(now.getTime() + monthsToComplete * 30 * 24 * 60 * 60 * 1000);
      isOnTrack = monthlyContribution >= monthlyRequired;
      projectedFinalAmount = currentAmount + (monthlyContribution * monthsRemaining);

      // If there's a return rate, use compound interest formula
      if (annualReturnRate && annualReturnRate > 0) {
        const monthlyRate = annualReturnRate / 12 / 100;
        projectedFinalAmount = 
          currentAmount * Math.pow(1 + monthlyRate, monthsRemaining) +
          monthlyContribution * ((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate);
      }
    } else {
      isOnTrack = remainingAmount <= 0;
    }

    // Generate scenarios
    const scenarios = this.generateScenarios(currentAmount, targetAmount, daysRemaining, annualReturnRate);

    return {
      monthlyRequired,
      weeklyRequired,
      dailyRequired,
      projectedCompletion,
      isOnTrack,
      progressPercentage,
      remainingAmount,
      daysRemaining,
      projectedFinalAmount,
      scenarios,
    };
  }

  /**
   * Generate different contribution scenarios
   */
  private generateScenarios(
    currentAmount: number,
    targetAmount: number,
    daysRemaining: number,
    annualReturnRate?: number
  ): ProjectionScenario[] {
    const remainingAmount = targetAmount - currentAmount;
    const monthsRemaining = daysRemaining / 30;
    const scenarios: ProjectionScenario[] = [];

    if (monthsRemaining <= 0) return scenarios;

    // Conservative scenario (extends time by 50%)
    const conservativeMonths = monthsRemaining * 1.5;
    const conservativeMonthly = remainingAmount / conservativeMonths;
    scenarios.push({
      name: 'Conservative',
      monthlyAmount: Math.round(conservativeMonthly),
      completionDate: new Date(Date.now() + conservativeMonths * 30 * 24 * 60 * 60 * 1000),
      finalAmount: targetAmount,
    });

    // On-track scenario (exact)
    const exactMonthly = remainingAmount / monthsRemaining;
    scenarios.push({
      name: 'On Track',
      monthlyAmount: Math.round(exactMonthly),
      completionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000),
      finalAmount: targetAmount,
    });

    // Aggressive scenario (reaches goal 20% faster)
    const aggressiveMonths = monthsRemaining * 0.8;
    const aggressiveMonthly = remainingAmount / aggressiveMonths;
    scenarios.push({
      name: 'Aggressive',
      monthlyAmount: Math.round(aggressiveMonthly),
      completionDate: new Date(Date.now() + aggressiveMonths * 30 * 24 * 60 * 60 * 1000),
      finalAmount: targetAmount,
    });

    return scenarios;
  }

  /**
   * Calculate Future Value with compound interest
   */
  private calculateFV(principal: number, monthlyPayment: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) {
      return principal + monthlyPayment * months;
    }
    const principalFV = principal * Math.pow(1 + monthlyRate, months);
    const paymentFV = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return principalFV + paymentFV;
  }

  /**
   * Calculate required monthly payment (PMT)
   */
  private calculatePMT(futureValue: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) {
      return futureValue / months;
    }
    return futureValue * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }

  /**
   * Get projection for a specific financial goal
   */
  async getGoalProjection(goalId: string, userId: string) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Estimate monthly contribution from goal's monthlyContribution field
    const monthlyContribution = goal.monthlyContribution || 0;

    const projection = this.calculateProjection({
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      monthlyContribution,
    });

    logger.info({ goalId, projection: { isOnTrack: projection.isOnTrack } }, 'Calculated goal projection');

    return {
      goal: {
        id: goal.id,
        name: goal.name,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        status: goal.status,
      },
      monthlyContribution,
      ...projection,
    };
  }

  /**
   * Get projections for all user goals
   */
  async getAllGoalProjections(userId: string) {
    const goals = await prisma.financialGoal.findMany({
      where: { 
        userId,
        status: { in: ['ON_TRACK', 'NEEDS_FOCUS', 'BEHIND'] },
        isArchived: false,
      },
    });

    const projections = goals.map(goal => {
      const monthlyContribution = goal.monthlyContribution || 0;

      return {
        goalId: goal.id,
        goalName: goal.name,
        ...this.calculateProjection({
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          monthlyContribution,
        }),
      };
    });

    // Summary statistics
    const onTrackCount = projections.filter(p => p.isOnTrack).length;
    const totalRequired = projections.reduce((sum, p) => sum + p.monthlyRequired, 0);

    return {
      projections,
      summary: {
        totalGoals: projections.length,
        onTrack: onTrackCount,
        offTrack: projections.length - onTrackCount,
        totalMonthlyRequired: totalRequired,
        overallProgress: projections.length > 0
          ? projections.reduce((sum, p) => sum + p.progressPercentage, 0) / projections.length
          : 0,
      },
    };
  }

  /**
   * Calculate what-if scenarios
   */
  whatIf(
    currentAmount: number,
    targetAmount: number,
    options: {
      monthlyContribution?: number;
      targetMonths?: number;
      annualReturnRate?: number;
    }
  ) {
    const { monthlyContribution, targetMonths, annualReturnRate = 0 } = options;
    const monthlyRate = annualReturnRate / 12 / 100;

    if (monthlyContribution && targetMonths) {
      // Calculate final amount with given contribution and time
      const finalAmount = this.calculateFV(currentAmount, monthlyContribution, monthlyRate, targetMonths);
      return {
        question: `What if I save ₹${monthlyContribution}/month for ${targetMonths} months?`,
        finalAmount,
        goalReached: finalAmount >= targetAmount,
        surplus: finalAmount - targetAmount,
      };
    }

    if (monthlyContribution) {
      // Calculate time to reach target
      const remainingAmount = targetAmount - currentAmount;
      let months: number;
      
      if (monthlyRate === 0) {
        months = remainingAmount / monthlyContribution;
      } else {
        months = Math.log((monthlyContribution + monthlyRate * targetAmount) / 
                          (monthlyContribution + monthlyRate * currentAmount)) / 
                 Math.log(1 + monthlyRate);
      }
      
      return {
        question: `How long to reach ₹${targetAmount} saving ₹${monthlyContribution}/month?`,
        monthsRequired: Math.ceil(months),
        yearsRequired: +(months / 12).toFixed(1),
        completionDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
      };
    }

    if (targetMonths) {
      // Calculate required monthly contribution
      const remainingAmount = targetAmount - currentAmount;
      const monthlyRequired = this.calculatePMT(remainingAmount, monthlyRate, targetMonths);
      
      return {
        question: `What do I need to save monthly to reach ₹${targetAmount} in ${targetMonths} months?`,
        monthlyRequired: Math.ceil(monthlyRequired),
        weeklyRequired: Math.ceil(monthlyRequired / 4),
        dailyRequired: Math.ceil(monthlyRequired / 30),
      };
    }

    throw new Error('Provide either monthlyContribution, targetMonths, or both');
  }

  /**
   * Compare goal progress over time periods
   */
  async compareProgress(goalId: string, userId: string) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const progressThisMonth = goal.currentAmount; // Current state
    
    // Calculate expected vs actual progress
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);
    const totalDays = Math.max(1, (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = (daysElapsed / totalDays) * goal.targetAmount;

    return {
      goal: {
        id: goal.id,
        name: goal.name,
      },
      current: goal.currentAmount,
      expected: Math.round(expectedProgress),
      variance: goal.currentAmount - expectedProgress,
      variancePercent: expectedProgress > 0 
        ? ((goal.currentAmount - expectedProgress) / expectedProgress) * 100 
        : 0,
      daysElapsed: Math.floor(daysElapsed),
      daysRemaining: Math.ceil(totalDays - daysElapsed),
    };
  }
}

export const projectionService = new ProjectionService();
