import { Response, NextFunction } from 'express';
import { TransactionType, GoalStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

// Calculate goal status based on progress
const calculateGoalStatus = (currentAmount: number, targetAmount: number): GoalStatus => {
  const progress = (currentAmount / targetAmount) * 100;
  if (progress >= 100) return 'COMPLETED';
  if (progress >= 75) return 'ON_TRACK';
  if (progress >= 40) return 'NEEDS_FOCUS';
  return 'BEHIND';
};

// Get transactions
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, budgetItemId, financialGoalId, startDate, endDate, limit = 50, offset = 0 } = req.query;

    const where: any = {
      userId: req.userId,
    };

    if (type) where.type = type as TransactionType;
    if (budgetItemId) where.budgetItemId = budgetItemId;
    if (financialGoalId) where.financialGoalId = financialGoalId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          budgetItem: {
            select: {
              id: true,
              category: true,
              name: true,
              budget: {
                select: {
                  month: true,
                  year: true,
                },
              },
            },
          },
          financialGoal: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          fromAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: { 
        transactions,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a transaction (expense or goal contribution)
export const createTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      amount, 
      type, 
      description, 
      source, 
      destination, 
      budgetItemId, 
      financialGoalId,
      fromAccountId,
      toAccountId,
      date 
    } = req.body;

    if (!amount || amount <= 0) {
      throw new AppError('Amount must be a positive number', 400);
    }

    if (!type) {
      throw new AppError('Transaction type is required', 400);
    }

    // Validate budget item if provided
    let budgetItem = null;
    if (budgetItemId) {
      budgetItem = await prisma.budgetItem.findFirst({
        where: {
          id: budgetItemId,
          budget: { userId: req.userId },
        },
        include: {
          budget: true,
        },
      });

      if (!budgetItem) {
        throw new AppError('Budget item not found', 404);
      }
    }

    // Validate financial goal if provided
    let financialGoal = null;
    if (financialGoalId) {
      financialGoal = await prisma.financialGoal.findFirst({
        where: {
          id: financialGoalId,
          userId: req.userId,
        },
      });

      if (!financialGoal) {
        throw new AppError('Financial goal not found', 404);
      }
    }

    // Validate accounts if provided
    let fromAccount = null;
    let toAccount = null;
    
    if (fromAccountId) {
      fromAccount = await prisma.account.findFirst({
        where: { id: fromAccountId, userId: req.userId },
      });
      if (!fromAccount) {
        throw new AppError('Source account not found', 404);
      }
    }
    
    if (toAccountId) {
      toAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: req.userId },
      });
      if (!toAccount) {
        throw new AppError('Destination account not found', 404);
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        amount,
        type: type as TransactionType,
        description,
        source,
        destination,
        budgetItemId,
        financialGoalId,
        fromAccountId,
        toAccountId,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        budgetItem: {
          select: {
            id: true,
            category: true,
            name: true,
          },
        },
        financialGoal: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        fromAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Update budget item actual amount if linked
    if (budgetItemId && budgetItem) {
      await prisma.budgetItem.update({
        where: { id: budgetItemId },
        data: {
          actual: { increment: amount },
        },
      });
    }

    // Update financial goal current amount if linked
    if (financialGoalId && financialGoal && type === 'GOAL_CONTRIBUTION') {
      const newAmount = financialGoal.currentAmount + amount;
      const newStatus = calculateGoalStatus(newAmount, financialGoal.targetAmount);
      
      await prisma.financialGoal.update({
        where: { id: financialGoalId },
        data: {
          currentAmount: newAmount,
          status: newStatus,
        },
      });
    }

    // Update account balances
    if (fromAccountId && fromAccount) {
      await prisma.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: amount },
        },
      });
    }

    if (toAccountId && toAccount) {
      await prisma.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: amount },
        },
      });
    }

    res.status(201).json({
      status: 'success',
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a transaction and reverse its effects
export const deleteTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Reverse budget item update
    if (transaction.budgetItemId) {
      await prisma.budgetItem.update({
        where: { id: transaction.budgetItemId },
        data: {
          actual: { decrement: transaction.amount },
        },
      });
    }

    // Reverse financial goal update
    if (transaction.financialGoalId && transaction.type === 'GOAL_CONTRIBUTION') {
      const goal = await prisma.financialGoal.findUnique({
        where: { id: transaction.financialGoalId },
      });

      if (goal) {
        const newAmount = Math.max(0, goal.currentAmount - transaction.amount);
        const newStatus = calculateGoalStatus(newAmount, goal.targetAmount);

        await prisma.financialGoal.update({
          where: { id: transaction.financialGoalId },
          data: {
            currentAmount: newAmount,
            status: newStatus,
          },
        });
      }
    }

    // Reverse account balance updates
    if (transaction.fromAccountId) {
      await prisma.account.update({
        where: { id: transaction.fromAccountId },
        data: {
          balance: { increment: transaction.amount },
        },
      });
    }

    if (transaction.toAccountId) {
      await prisma.account.update({
        where: { id: transaction.toAccountId },
        data: {
          balance: { decrement: transaction.amount },
        },
      });
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction summary for a budget
export const getBudgetTransactionSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, month } = req.params;

    const budget = await prisma.budget.findFirst({
      where: {
        userId: req.userId,
        year: parseInt(year),
        month: parseInt(month),
      },
      include: {
        items: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
            },
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

    res.json({
      status: 'success',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};
