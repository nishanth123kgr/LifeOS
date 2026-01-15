import { Response, NextFunction } from 'express';
import { BudgetCategory } from '@prisma/client';
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
        items: {
          include: {
            linkedGoal: {
              select: {
                id: true,
                name: true,
                type: true,
                targetAmount: true,
                currentAmount: true,
              },
            },
          },
        },
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

    let budget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        month: parseInt(month),
        year: parseInt(year),
      },
      include: {
        items: {
          include: {
            linkedGoal: {
              select: {
                id: true,
                name: true,
                type: true,
                targetAmount: true,
                currentAmount: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    // Check for new financial goals that don't have budget items yet
    const financialGoals = await prisma.financialGoal.findMany({
      where: {
        userId: req.userId,
        isArchived: false,
        isPaused: false,
      },
      select: {
        id: true,
        name: true,
        monthlyContribution: true,
      },
    });

    // Get existing linked goal IDs
    const existingGoalIds = budget.items
      .filter(item => item.linkedGoalId)
      .map(item => item.linkedGoalId);

    // Find goals that need to be added
    const newGoals = financialGoals.filter(goal => !existingGoalIds.includes(goal.id));

    // Add new financial goals as budget items
    if (newGoals.length > 0) {
      await prisma.budgetItem.createMany({
        data: newGoals.map(goal => ({
          budgetId: budget!.id,
          category: 'FINANCIAL_GOAL' as BudgetCategory,
          name: goal.name,
          planned: goal.monthlyContribution,
          actual: 0,
          linkedGoalId: goal.id,
        })),
      });

      // Refetch budget with new items
      budget = await prisma.budget.findFirst({
        where: {
          userId: req.userId,
          month: parseInt(month),
          year: parseInt(year),
        },
        include: {
          items: {
            include: {
              linkedGoal: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  targetAmount: true,
                  currentAmount: true,
                },
              },
            },
          },
        },
      });
    }

    const totalPlanned = budget!.items.reduce((sum, item) => sum + item.planned, 0);
    const totalActual = budget!.items.reduce((sum, item) => sum + item.actual, 0);

    res.json({
      status: 'success',
      data: {
        budget: {
          ...budget,
          totalPlanned,
          totalActual,
          surplus: budget!.income - totalActual,
          plannedSurplus: budget!.income - totalPlanned,
          isOverBudget: totalActual > budget!.income,
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

    // Get user's budget template
    const template = await prisma.budgetTemplate.findUnique({
      where: { userId: req.userId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Get all active financial goals for this user
    const financialGoals = await prisma.financialGoal.findMany({
      where: {
        userId: req.userId,
        isArchived: false,
        isPaused: false,
      },
      select: {
        id: true,
        name: true,
        monthlyContribution: true,
      },
    });

    // Create budget with items from template or provided items
    let budgetItemsData: any[] = [];
    
    if (data.items && data.items.length > 0) {
      // Use provided items
      budgetItemsData = data.items.map(item => ({
        category: item.category,
        planned: item.planned,
        actual: item.actual || 0,
        notes: item.notes,
        linkedGoalId: item.linkedGoalId,
      }));
    } else if (template && template.items.length > 0) {
      // Use template items
      budgetItemsData = template.items.map(item => ({
        category: item.category,
        name: item.category === 'FINANCIAL_GOAL' ? undefined : undefined, // Will be set from goal
        planned: item.plannedAmount,
        actual: 0,
        notes: item.notes,
        linkedGoalId: item.linkedGoalId,
      }));
    } else {
      // Use default categories
      budgetItemsData = defaultCategories.map(category => ({
        category,
        planned: 0,
        actual: 0,
      }));

      // Add financial goals as FINANCIAL_GOAL category items
      const goalItems = financialGoals.map(goal => ({
        category: 'FINANCIAL_GOAL' as BudgetCategory,
        name: goal.name,
        planned: goal.monthlyContribution,
        actual: 0,
        linkedGoalId: goal.id,
      }));

      budgetItemsData = [...budgetItemsData, ...goalItems];
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.userId!,
        month: data.month,
        year: data.year,
        income: data.income,
        items: {
          create: budgetItemsData,
        },
      },
      include: {
        items: {
          include: {
            linkedGoal: {
              select: {
                id: true,
                name: true,
                type: true,
                targetAmount: true,
                currentAmount: true,
              },
            },
          },
        },
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
        // Find existing item by id or by category+linkedGoalId
        const existingItem = await prisma.budgetItem.findFirst({
          where: {
            budgetId: budget.id,
            category: item.category,
            linkedGoalId: item.linkedGoalId || null,
          },
        });

        if (existingItem) {
          await prisma.budgetItem.update({
            where: { id: existingItem.id },
            data: {
              planned: item.planned,
              actual: item.actual ?? existingItem.actual,
              notes: item.notes,
            },
          });
        } else {
          await prisma.budgetItem.create({
            data: {
              budgetId: budget.id,
              category: item.category,
              planned: item.planned,
              actual: item.actual || 0,
              notes: item.notes,
              linkedGoalId: item.linkedGoalId,
            },
          });
        }
      }
    }

    // Fetch updated budget
    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        items: {
          include: {
            linkedGoal: {
              select: {
                id: true,
                name: true,
                type: true,
                targetAmount: true,
                currentAmount: true,
              },
            },
          },
        },
      },
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

// Default categories - SAVINGS and INVESTMENTS removed, financial goals are added dynamically
const defaultCategories: BudgetCategory[] = [
  'RENT', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'MISCELLANEOUS'
];

export const initializeBudgetCategories = async (
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
      include: { items: true },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    // Only initialize if there are no items
    if (budget.items.length === 0) {
      // Try to get user's budget template
      const template = await prisma.budgetTemplate.findUnique({
        where: { userId: req.userId },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Get all active financial goals for this user
      const financialGoals = await prisma.financialGoal.findMany({
        where: {
          userId: req.userId,
          isArchived: false,
          isPaused: false,
        },
        select: {
          id: true,
          name: true,
          monthlyContribution: true,
        },
      });

      if (template && template.items.length > 0) {
        // Use template items
        await prisma.budgetItem.createMany({
          data: template.items.map(item => ({
            budgetId: budget.id,
            category: item.category,
            planned: item.plannedAmount,
            actual: 0,
            notes: item.notes,
            linkedGoalId: item.linkedGoalId,
          })),
        });
      } else {
        // Create default category items
        const defaultItems = defaultCategories.map(category => ({
          budgetId: budget.id,
          category,
          planned: 0,
          actual: 0,
        }));

        // Add financial goals as FINANCIAL_GOAL category items
        const goalItems = financialGoals.map(goal => ({
          budgetId: budget.id,
          category: 'FINANCIAL_GOAL' as BudgetCategory,
          name: goal.name,
          planned: goal.monthlyContribution,
          actual: 0,
          linkedGoalId: goal.id,
        }));

        await prisma.budgetItem.createMany({
          data: [...defaultItems, ...goalItems],
        });
      }
    }

    // Fetch updated budget
    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        items: {
          include: {
            linkedGoal: {
              select: {
                id: true,
                name: true,
                type: true,
                targetAmount: true,
                currentAmount: true,
              },
            },
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: { budget: updatedBudget },
    });
  } catch (error) {
    next(error);
  }
};

export const linkBudgetItemToGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const { goalId } = req.body;

    // Verify budget item exists and belongs to user
    const budgetItem = await prisma.budgetItem.findFirst({
      where: {
        id: itemId,
        budget: { userId: req.userId },
      },
      include: { budget: true },
    });

    if (!budgetItem) {
      throw new AppError('Budget item not found', 404);
    }

    // If goalId provided, verify it belongs to user
    if (goalId) {
      const goal = await prisma.financialGoal.findFirst({
        where: { id: goalId, userId: req.userId },
      });

      if (!goal) {
        throw new AppError('Financial goal not found', 404);
      }
    }

    // Update the budget item
    const updatedItem = await prisma.budgetItem.update({
      where: { id: itemId },
      data: { linkedGoalId: goalId || null },
      include: {
        linkedGoal: {
          select: {
            id: true,
            name: true,
            type: true,
            targetAmount: true,
            currentAmount: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: { item: updatedItem },
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
