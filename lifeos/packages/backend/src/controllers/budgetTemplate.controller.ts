import { Response, NextFunction } from 'express';
import { BudgetCategory } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Default categories - SAVINGS and INVESTMENTS removed, financial goals are added dynamically
const defaultCategories: BudgetCategory[] = [
  'RENT', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'MISCELLANEOUS'
];

// Get user's budget template
export const getBudgetTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let template = await prisma.budgetTemplate.findUnique({
      where: { userId: req.userId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Create default template if none exists
    if (!template) {
      template = await prisma.budgetTemplate.create({
        data: {
          userId: req.userId!,
          name: 'My Budget Template',
          items: {
            create: defaultCategories.map((category, index) => ({
              category,
              plannedAmount: 0,
              order: index,
            })),
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    // Get user's active financial goals to show linked goals
    const financialGoals = await prisma.financialGoal.findMany({
      where: {
        userId: req.userId,
        isArchived: false,
        status: { not: 'COMPLETED' },
      },
      select: {
        id: true,
        name: true,
        type: true,
        targetAmount: true,
        currentAmount: true,
        monthlyContribution: true,
      },
    });

    res.json({
      status: 'success',
      data: { 
        template,
        financialGoals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update budget template
export const updateBudgetTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, items } = req.body;

    let template = await prisma.budgetTemplate.findUnique({
      where: { userId: req.userId },
    });

    if (!template) {
      // Create if not exists
      template = await prisma.budgetTemplate.create({
        data: {
          userId: req.userId!,
          name: name || 'My Budget Template',
        },
      });
    } else if (name) {
      // Update name if provided
      template = await prisma.budgetTemplate.update({
        where: { id: template.id },
        data: { name },
      });
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.budgetTemplateItem.deleteMany({
        where: { templateId: template.id },
      });

      // Create new items
      await prisma.budgetTemplateItem.createMany({
        data: items.map((item: any, index: number) => ({
          templateId: template!.id,
          category: item.category,
          plannedAmount: item.plannedAmount || 0,
          linkedGoalId: item.linkedGoalId || null,
          notes: item.notes || null,
          order: index,
        })),
      });
    }

    // Fetch updated template
    const updatedTemplate = await prisma.budgetTemplate.findUnique({
      where: { id: template.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      status: 'success',
      data: { template: updatedTemplate },
    });
  } catch (error) {
    next(error);
  }
};

// Add a financial goal to the template
export const addGoalToTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goalId, plannedAmount } = req.body;

    // Verify goal belongs to user
    const goal = await prisma.financialGoal.findFirst({
      where: {
        id: goalId,
        userId: req.userId,
      },
    });

    if (!goal) {
      throw new AppError('Financial goal not found', 404);
    }

    let template = await prisma.budgetTemplate.findUnique({
      where: { userId: req.userId },
      include: { items: true },
    });

    if (!template) {
      throw new AppError('Budget template not found', 404);
    }

    // Check if goal is already in template
    const existingItem = template.items.find(item => item.linkedGoalId === goalId);
    if (existingItem) {
      throw new AppError('Goal is already in the budget template', 400);
    }

    // Add goal as FINANCIAL_GOAL category item
    await prisma.budgetTemplateItem.create({
      data: {
        templateId: template.id,
        category: 'FINANCIAL_GOAL',
        plannedAmount: plannedAmount || goal.monthlyContribution || 0,
        linkedGoalId: goalId,
        order: template.items.length,
      },
    });

    // Fetch updated template
    const updatedTemplate = await prisma.budgetTemplate.findUnique({
      where: { id: template.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      status: 'success',
      data: { template: updatedTemplate },
    });
  } catch (error) {
    next(error);
  }
};

// Remove a goal from the template
export const removeGoalFromTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { goalId } = req.params;

    const template = await prisma.budgetTemplate.findUnique({
      where: { userId: req.userId },
    });

    if (!template) {
      throw new AppError('Budget template not found', 404);
    }

    await prisma.budgetTemplateItem.deleteMany({
      where: {
        templateId: template.id,
        linkedGoalId: goalId,
      },
    });

    // Fetch updated template
    const updatedTemplate = await prisma.budgetTemplate.findUnique({
      where: { id: template.id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({
      status: 'success',
      data: { template: updatedTemplate },
    });
  } catch (error) {
    next(error);
  }
};
