import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { BudgetInput } from '../schemas/index.js';

export const getBudgets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year } = req.query;

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        ...(year && { year: parseInt(year as string) }),
      },
      include: {
        items: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const budgetsWithSummary = budgets.map(budget => {
      const totalPlanned = budget.items.reduce((sum, item) => sum + item.planned, 0);
      const totalActual = budget.items.reduce((sum, item) => sum + item.actual, 0);
      const surplus = budget.income - totalActual;
      const plannedSurplus = budget.income - totalPlanned;

      return {
        ...budget,
        totalPlanned,
        totalActual,
        surplus,
        plannedSurplus,
        isOverBudget: totalActual > budget.income,
      };
    });

    res.json({
      status: 'success',
      data: { budgets: budgetsWithSummary },
    });
  } catch (error) {
    next(error);
  }
};

export const getBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { month, year } = req.params;

    const budget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        items: true,
      },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    const totalPlanned = budget.items.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = budget.items.reduce((sum, item) => sum + item.actual, 0);

    res.json({
      status: 'success',
      data: {
        budget: {
          ...budget,
          totalPlanned,
          totalActual,
          surplus: budget.income - totalActual,
          plannedSurplus: budget.income - totalPlanned,
          isOverBudget: totalActual > budget.income,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as BudgetInput;

    // Check if budget already exists
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        month: data.month,
        year: data.year,
      },
    });

    if (existingBudget) {
      throw new AppError('Budget already exists for this month', 400);
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.userId!,
        month: data.month,
        year: data.year,
        income: data.income,
        items: data.items ? {
          create: data.items.map(item => ({
            category: item.category,
            planned: item.planned,
            actual: item.actual || 0,
            notes: item.notes,
          })),
        } : undefined,
      },
      include: {
        items: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { month, year } = req.params;
    const { income, items } = req.body;

    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    if (!existingBudget) {
      throw new AppError('Budget not found', 404);
    }

    const budget = await prisma.budget.update({
      where: { id: existingBudget.id },
      data: {
        income: income ?? existingBudget.income,
      },
      include: {
        items: true,
      },
    });

    // Update items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await prisma.budgetItem.upsert({
          where: {
            budgetId_category: {
              budgetId: budget.id,
              category: item.category,
            },
          },
          update: {
            planned: item.planned,
            actual: item.actual ?? 0,
            notes: item.notes,
          },
          create: {
            budgetId: budget.id,
            category: item.category,
            planned: item.planned,
            actual: item.actual || 0,
            notes: item.notes,
          },
        });
      }
    }

    // Fetch updated budget
    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: { items: true },
    });

    const totalPlanned = updatedBudget!.items.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = updatedBudget!.items.reduce((sum, item) => sum + item.actual, 0);

    res.json({
      status: 'success',
      data: {
        budget: {
          ...updatedBudget,
          totalPlanned,
          totalActual,
          surplus: updatedBudget!.income - totalActual,
          isOverBudget: totalActual > updatedBudget!.income,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { month, year } = req.params;

    const budget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        month: parseInt(month),
        year: parseInt(year),
      },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    await prisma.budget.delete({
      where: { id: budget.id },
    });

    res.json({
      status: 'success',
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const compareBudgets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { month1, year1, month2, year2 } = req.query;

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        OR: [
          { month: parseInt(month1 as string), year: parseInt(year1 as string) },
          { month: parseInt(month2 as string), year: parseInt(year2 as string) },
        ],
      },
      include: { items: true },
    });

    if (budgets.length < 2) {
      throw new AppError('Both budgets must exist for comparison', 400);
    }

    const [budget1, budget2] = budgets.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const comparison = {
      period1: { month: budget1.month, year: budget1.year },
      period2: { month: budget2.month, year: budget2.year },
      incomeChange: budget2.income - budget1.income,
      categoryComparison: {} as Record<string, { period1: number; period2: number; change: number }>,
    };

    // Build category comparison
    const allCategories = new Set([
      ...budget1.items.map(i => i.category),
      ...budget2.items.map(i => i.category),
    ]);

    for (const category of allCategories) {
      const item1 = budget1.items.find(i => i.category === category);
      const item2 = budget2.items.find(i => i.category === category);
      
      comparison.categoryComparison[category] = {
        period1: item1?.actual || 0,
        period2: item2?.actual || 0,
        change: (item2?.actual || 0) - (item1?.actual || 0),
      };
    }

    res.json({
      status: 'success',
      data: { comparison },
    });
  } catch (error) {
    next(error);
  }
};
