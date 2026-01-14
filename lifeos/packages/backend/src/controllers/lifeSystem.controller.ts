import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { LifeSystemInput } from '../schemas/index.js';

// Calculate adherence percentage for the last 30 days
const calculateAdherence = (logs: { adhered: boolean }[]): number => {
  if (logs.length === 0) return 0;
  const adheredCount = logs.filter(l => l.adhered).length;
  return Math.round((adheredCount / logs.length) * 100);
};

export const getLifeSystems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, active } = req.query;

    const systems = await prisma.lifeSystem.findMany({
      where: {
        userId: req.userId,
        ...(category && { category: category as any }),
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      include: {
        adherenceLogs: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        linkedFinancialGoals: {
          select: { id: true, name: true, status: true },
        },
        linkedFitnessGoals: {
          select: { id: true, name: true, status: true },
        },
        linkedHabits: {
          select: { id: true, name: true, currentStreak: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const systemsWithAdherence = systems.map(system => ({
      ...system,
      currentAdherence: calculateAdherence(system.adherenceLogs),
    }));

    res.json({
      status: 'success',
      data: { systems: systemsWithAdherence },
    });
  } catch (error) {
    next(error);
  }
};

export const getLifeSystem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const system = await prisma.lifeSystem.findFirst({
      where: { id, userId: req.userId },
      include: {
        adherenceLogs: {
          orderBy: { date: 'desc' },
        },
        linkedFinancialGoals: true,
        linkedFitnessGoals: true,
        linkedHabits: true,
      },
    });

    if (!system) {
      throw new AppError('System not found', 404);
    }

    res.json({
      status: 'success',
      data: {
        system: {
          ...system,
          currentAdherence: calculateAdherence(system.adherenceLogs),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLifeSystem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as LifeSystemInput;

    const system = await prisma.lifeSystem.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description,
        category: data.category,
        adherenceTarget: data.adherenceTarget || 80,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { system: { ...system, currentAdherence: 0 } },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLifeSystem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingSystem = await prisma.lifeSystem.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingSystem) {
      throw new AppError('System not found', 404);
    }

    const system = await prisma.lifeSystem.update({
      where: { id },
      data,
      include: {
        adherenceLogs: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    res.json({
      status: 'success',
      data: {
        system: {
          ...system,
          currentAdherence: calculateAdherence(system.adherenceLogs),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLifeSystem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const system = await prisma.lifeSystem.findFirst({
      where: { id, userId: req.userId },
    });

    if (!system) {
      throw new AppError('System not found', 404);
    }

    await prisma.lifeSystem.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'System deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logAdherence = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date, adhered, notes } = req.body;

    const system = await prisma.lifeSystem.findFirst({
      where: { id, userId: req.userId },
    });

    if (!system) {
      throw new AppError('System not found', 404);
    }

    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    const adherenceLog = await prisma.systemAdherence.upsert({
      where: {
        systemId_date: {
          systemId: id,
          date: logDate,
        },
      },
      update: { adhered, notes },
      create: {
        systemId: id,
        date: logDate,
        adhered,
        notes,
      },
    });

    // Get updated adherence
    const allLogs = await prisma.systemAdherence.findMany({
      where: { systemId: id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    res.json({
      status: 'success',
      data: {
        adherenceLog,
        currentAdherence: calculateAdherence(allLogs),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const linkGoals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { financialGoalIds, fitnessGoalIds, habitIds } = req.body;

    const system = await prisma.lifeSystem.findFirst({
      where: { id, userId: req.userId },
    });

    if (!system) {
      throw new AppError('System not found', 404);
    }

    const updatedSystem = await prisma.lifeSystem.update({
      where: { id },
      data: {
        linkedFinancialGoals: financialGoalIds ? {
          set: financialGoalIds.map((goalId: string) => ({ id: goalId })),
        } : undefined,
        linkedFitnessGoals: fitnessGoalIds ? {
          set: fitnessGoalIds.map((goalId: string) => ({ id: goalId })),
        } : undefined,
        linkedHabits: habitIds ? {
          set: habitIds.map((habitId: string) => ({ id: habitId })),
        } : undefined,
      },
      include: {
        linkedFinancialGoals: true,
        linkedFitnessGoals: true,
        linkedHabits: true,
      },
    });

    res.json({
      status: 'success',
      data: { system: updatedSystem },
    });
  } catch (error) {
    next(error);
  }
};
