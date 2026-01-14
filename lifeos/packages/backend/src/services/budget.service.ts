import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { BudgetCategory } from '@prisma/client';

export class BudgetService {
  /**
   * Get all budgets for a user
   */
  async getAll(userId: string, year?: number, month?: number) {
    const where: any = { userId };
    
    if (year) where.year = year;
    if (month) where.month = month;

    return prisma.budget.findMany({
      where,
      include: { items: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Get budget for current month
   */
  async getCurrentMonth(userId: string) {
    const now = new Date();
    return this.getByMonth(userId, now.getFullYear(), now.getMonth() + 1);
  }

  /**
   * Get budget by month
   */
  async getByMonth(userId: string, year: number, month: number) {
    return prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
      include: { items: true },
    });
  }

  /**
   * Create a monthly budget
   */
  async create(
    userId: string,
    data: {
      month: number;
      year: number;
      income: number;
      items?: Array<{
        category: BudgetCategory;
        planned: number;
      }>;
    }
  ) {
    // Check for existing budget
    const existing = await prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw new Error('Budget already exists for this month');
    }

    // Check for rollover from previous month
    let rolloverAmount = 0;
    const prevMonth = data.month === 1 ? 12 : data.month - 1;
    const prevYear = data.month === 1 ? data.year - 1 : data.year;
    
    const prevBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month: prevMonth, year: prevYear },
      },
      include: { items: true },
    });

    if (prevBudget) {
      // Calculate unspent amount from previous month
      const prevTotalPlanned = prevBudget.items.reduce((sum, item) => sum + item.planned, 0);
      const prevTotalActual = prevBudget.items.reduce((sum, item) => sum + item.actual, 0);
      rolloverAmount = Math.max(0, prevTotalPlanned - prevTotalActual);
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        month: data.month,
        year: data.year,
        income: data.income,
        rolloverAmount,
        items: data.items ? {
          create: data.items.map(item => ({
            category: item.category,
            planned: item.planned,
            actual: 0,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    logger.info({ userId, budgetId: budget.id, month: data.month, year: data.year }, 'Budget created');
    return budget;
  }

  /**
   * Add or update a budget item
   */
  async upsertItem(
    budgetId: string,
    userId: string,
    data: {
      category: BudgetCategory;
      planned: number;
      actual?: number;
      notes?: string;
    }
  ) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Check if item exists
    const existingItem = await prisma.budgetItem.findUnique({
      where: {
        budgetId_category: { budgetId, category: data.category },
      },
    });

    if (existingItem) {
      return prisma.budgetItem.update({
        where: { id: existingItem.id },
        data: {
          planned: data.planned,
          actual: data.actual ?? existingItem.actual,
          notes: data.notes,
        },
      });
    }

    return prisma.budgetItem.create({
      data: {
        budgetId,
        category: data.category,
        planned: data.planned,
        actual: data.actual ?? 0,
        notes: data.notes,
      },
    });
  }

  /**
   * Record an expense
   */
  async recordExpense(
    userId: string,
    data: {
      category: BudgetCategory;
      amount: number;
      month?: number;
      year?: number;
      notes?: string;
    }
  ) {
    const now = new Date();
    const month = data.month || now.getMonth() + 1;
    const year = data.year || now.getFullYear();

    // Find or create budget for the month
    let budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
      include: { items: true },
    });

    if (!budget) {
      // Create budget with no income set (user should update later)
      budget = await prisma.budget.create({
        data: {
          userId,
          month,
          year,
          income: 0,
          items: {
            create: {
              category: data.category,
              planned: 0,
              actual: data.amount,
              notes: data.notes,
            },
          },
        },
        include: { items: true },
      });
    } else {
      // Find or create budget item
      const existingItem = budget.items.find(i => i.category === data.category);

      if (existingItem) {
        await prisma.budgetItem.update({
          where: { id: existingItem.id },
          data: { 
            actual: { increment: data.amount },
            notes: data.notes ? `${existingItem.notes || ''}\n${data.notes}`.trim() : existingItem.notes,
          },
        });
      } else {
        await prisma.budgetItem.create({
          data: {
            budgetId: budget.id,
            category: data.category,
            planned: 0,
            actual: data.amount,
            notes: data.notes,
          },
        });
      }

      // Refetch budget with updated items
      budget = await prisma.budget.findUnique({
        where: { id: budget.id },
        include: { items: true },
      })!;
    }

    const item = budget!.items.find(i => i.category === data.category)!;
    const effectiveBudget = item.planned + item.rollover;
    const isOverBudget = item.planned > 0 && item.actual > effectiveBudget;

    return {
      budget,
      item,
      isOverBudget,
      remaining: effectiveBudget - item.actual,
      percentUsed: effectiveBudget > 0 ? (item.actual / effectiveBudget) * 100 : 0,
    };
  }

  /**
   * Get budget summary for a month
   */
  async getSummary(userId: string, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month: targetMonth, year: targetYear },
      },
      include: { items: true },
    });

    if (!budget) {
      return {
        exists: false,
        month: targetMonth,
        year: targetYear,
      };
    }

    const totalPlanned = budget.items.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = budget.items.reduce((sum, item) => sum + item.actual, 0);
    const totalRollover = budget.items.reduce((sum, item) => sum + item.rollover, 0);
    const effectiveTotal = totalPlanned + totalRollover + budget.rolloverAmount;
    const remaining = effectiveTotal - totalActual;

    const byCategory = budget.items.map(item => {
      const effectiveBudget = item.planned + item.rollover;
      return {
        category: item.category,
        planned: item.planned,
        actual: item.actual,
        rollover: item.rollover,
        remaining: effectiveBudget - item.actual,
        percentUsed: effectiveBudget > 0 ? (item.actual / effectiveBudget) * 100 : 0,
        isOverBudget: item.planned > 0 && item.actual > effectiveBudget,
      };
    });

    // Get previous month for comparison
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    
    const prevBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month: prevMonth, year: prevYear },
      },
      include: { items: true },
    });

    let comparison = null;
    if (prevBudget) {
      const prevTotalActual = prevBudget.items.reduce((sum, item) => sum + item.actual, 0);
      comparison = {
        previousMonth: prevMonth,
        previousYear: prevYear,
        previousSpending: prevTotalActual,
        difference: totalActual - prevTotalActual,
        percentChange: prevTotalActual > 0 ? ((totalActual - prevTotalActual) / prevTotalActual) * 100 : 0,
      };
    }

    return {
      exists: true,
      month: targetMonth,
      year: targetYear,
      income: budget.income,
      rolloverFromPrevious: budget.rolloverAmount,
      totalPlanned,
      totalActual,
      remaining,
      savingsRate: budget.income > 0 ? ((budget.income - totalActual) / budget.income) * 100 : 0,
      byCategory,
      comparison,
    };
  }

  /**
   * Calculate and apply rollover to next month
   */
  async applyRollover(userId: string, fromYear: number, fromMonth: number) {
    const fromBudget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month: fromMonth, year: fromYear },
      },
      include: { items: true },
    });

    if (!fromBudget) {
      throw new Error('Source budget not found');
    }

    const toMonth = fromMonth === 12 ? 1 : fromMonth + 1;
    const toYear = fromMonth === 12 ? fromYear + 1 : fromYear;

    // Calculate total unspent
    const unspent = fromBudget.items.reduce((sum, item) => {
      const remaining = item.planned - item.actual;
      return sum + Math.max(0, remaining);
    }, 0);

    // Update or create the target budget
    const toBudget = await prisma.budget.upsert({
      where: {
        userId_month_year: { userId, month: toMonth, year: toYear },
      },
      update: {
        rolloverAmount: unspent,
      },
      create: {
        userId,
        month: toMonth,
        year: toYear,
        income: 0,
        rolloverAmount: unspent,
      },
      include: { items: true },
    });

    logger.info({ userId, fromMonth, fromYear, toMonth, toYear, unspent }, 'Budget rollover applied');

    return {
      from: { month: fromMonth, year: fromYear },
      to: { month: toMonth, year: toYear },
      rolloverAmount: unspent,
    };
  }

  /**
   * Get spending trends
   */
  async getSpendingTrends(userId: string, months = 6) {
    const now = new Date();
    const budgets = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const budget = await prisma.budget.findUnique({
        where: {
          userId_month_year: { userId, month, year },
        },
        include: { items: true },
      });

      if (budget) {
        budgets.push({
          month,
          year,
          label: `${month}/${year}`,
          income: budget.income,
          totalPlanned: budget.items.reduce((sum, i) => sum + i.planned, 0),
          totalActual: budget.items.reduce((sum, i) => sum + i.actual, 0),
          byCategory: budget.items.map(i => ({
            category: i.category,
            actual: i.actual,
          })),
        });
      }
    }

    return budgets.reverse();
  }
}

export const budgetService = new BudgetService();
