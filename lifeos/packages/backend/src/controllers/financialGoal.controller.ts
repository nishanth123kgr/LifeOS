import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { FinancialGoalInput } from '../schemas/index.js';
import { GoalStatus } from '@prisma/client';

// Calculate goal status based on progress
const calculateStatus = (currentAmount: number, targetAmount: number): GoalStatus => {
  const progress = (currentAmount / targetAmount) * 100;
  if (progress >= 100) return 'COMPLETED';
  if (progress >= 75) return 'ON_TRACK';
  if (progress >= 40) return 'NEEDS_FOCUS';
  return 'BEHIND';
};

export const getFinancialGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, archived } = req.query;

    const goals = await prisma.financialGoal.findMany({
      where: {
        userId: req.userId,
        ...(status && { status: status as GoalStatus }),
        isArchived: archived === 'true',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
    }));

    res.json({
      status: 'success',
      data: { goals: goalsWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    res.json({
      status: 'success',
      data: {
        goal: {
          ...goal,
          progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as FinancialGoalInput;

    const goal = await prisma.financialGoal.create({
      data: {
        userId: req.userId!,
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        monthlyContribution: data.monthlyContribution || 0,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        notes: data.notes,
        status: calculateStatus(data.currentAmount || 0, data.targetAmount),
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        goal: {
          ...goal,
          progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check ownership
    const existingGoal = await prisma.financialGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingGoal) {
      throw new AppError('Goal not found', 404);
    }

    const newCurrentAmount = data.currentAmount ?? existingGoal.currentAmount;
    const newTargetAmount = data.targetAmount ?? existingGoal.targetAmount;

    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: calculateStatus(newCurrentAmount, newTargetAmount),
      },
    });

    res.json({
      status: 'success',
      data: {
        goal: {
          ...goal,
          progress: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    await prisma.financialGoal.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const pauseFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: {
        isPaused: !goal.isPaused,
        status: !goal.isPaused ? 'PAUSED' : calculateStatus(goal.currentAmount, goal.targetAmount),
      },
    });

    res.json({
      status: 'success',
      data: { goal: updatedGoal },
    });
  } catch (error) {
    next(error);
  }
};

export const archiveFinancialGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: {
        isArchived: !goal.isArchived,
        status: !goal.isArchived ? 'ARCHIVED' : calculateStatus(goal.currentAmount, goal.targetAmount),
      },
    });

    res.json({
      status: 'success',
      data: { goal: updatedGoal },
    });
  } catch (error) {
    next(error);
  }
};
