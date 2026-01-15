import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { FitnessGoalInput } from '../schemas/index.js';
import { GoalStatus } from '@prisma/client';
import { achievementService } from '../services/achievement.service.js';
import logger from '../lib/logger.js';

// Calculate progress for fitness goals
const calculateProgress = (start: number, current: number, target: number): number => {
  const totalChange = target - start;
  if (totalChange === 0) return 100;
  const currentChange = current - start;
  return Math.min(Math.max((currentChange / totalChange) * 100, 0), 100);
};

// Calculate status based on progress
const calculateStatus = (progress: number): GoalStatus => {
  if (progress >= 100) return 'COMPLETED';
  if (progress >= 75) return 'ON_TRACK';
  if (progress >= 40) return 'NEEDS_FOCUS';
  return 'BEHIND';
};

export const getFitnessGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { metricType, status } = req.query;

    const goals = await prisma.fitnessGoal.findMany({
      where: {
        userId: req.userId,
        ...(metricType && { metricType: metricType as any }),
        ...(status && { status: status as GoalStatus }),
      },
      include: {
        progressHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithProgress = goals.map(goal => {
      const progress = calculateProgress(goal.startValue, goal.currentValue, goal.targetValue);
      return { ...goal, progress };
    });

    res.json({
      status: 'success',
      data: { goals: goalsWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

export const getFitnessGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.fitnessGoal.findFirst({
      where: { id, userId: req.userId },
      include: {
        progressHistory: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    const progress = calculateProgress(goal.startValue, goal.currentValue, goal.targetValue);

    res.json({
      status: 'success',
      data: { goal: { ...goal, progress } },
    });
  } catch (error) {
    next(error);
  }
};

export const createFitnessGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as FitnessGoalInput;
    const progress = calculateProgress(data.startValue, data.currentValue, data.targetValue);

    const goal = await prisma.fitnessGoal.create({
      data: {
        userId: req.userId!,
        name: data.name,
        metricType: data.metricType,
        startValue: data.startValue,
        currentValue: data.currentValue,
        targetValue: data.targetValue,
        unit: data.unit,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        notes: data.notes,
        status: calculateStatus(progress),
      },
    });

    // Check and unlock any achievements
    achievementService.checkAndUnlock(req.userId!).catch(err => 
      logger.error({ err, userId: req.userId }, 'Failed to check achievements')
    );

    res.status(201).json({
      status: 'success',
      data: { goal: { ...goal, progress } },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFitnessGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingGoal = await prisma.fitnessGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingGoal) {
      throw new AppError('Goal not found', 404);
    }

    const newCurrentValue = data.currentValue ?? existingGoal.currentValue;
    const newStartValue = data.startValue ?? existingGoal.startValue;
    const newTargetValue = data.targetValue ?? existingGoal.targetValue;
    const progress = calculateProgress(newStartValue, newCurrentValue, newTargetValue);

    // If current value changed, add to progress history
    if (data.currentValue !== undefined && data.currentValue !== existingGoal.currentValue) {
      await prisma.fitnessProgress.create({
        data: {
          fitnessGoalId: id,
          value: data.currentValue,
          notes: data.progressNotes,
        },
      });
    }

    const goal = await prisma.fitnessGoal.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: calculateStatus(progress),
        isAchieved: progress >= 100,
      },
      include: {
        progressHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });

    // Check and unlock any achievements
    achievementService.checkAndUnlock(req.userId!).catch(err => 
      logger.error({ err, userId: req.userId }, 'Failed to check achievements')
    );

    res.json({
      status: 'success',
      data: { goal: { ...goal, progress } },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFitnessGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const goal = await prisma.fitnessGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    await prisma.fitnessGoal.delete({
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

export const resetFitnessGoal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { newStartValue, newTargetDate } = req.body;

    const existingGoal = await prisma.fitnessGoal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingGoal) {
      throw new AppError('Goal not found', 404);
    }

    const goal = await prisma.fitnessGoal.update({
      where: { id },
      data: {
        startValue: newStartValue ?? existingGoal.currentValue,
        startDate: new Date(),
        targetDate: newTargetDate ? new Date(newTargetDate) : existingGoal.targetDate,
        status: 'ON_TRACK',
        isAchieved: false,
      },
    });

    res.json({
      status: 'success',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};
