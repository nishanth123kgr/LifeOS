import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { HabitInput } from '../schemas/index.js';

// Calculate streak based on check-in history
const calculateStreak = (
  checkIns: { date: Date; completed: boolean }[],
  frequency: string
): number => {
  if (checkIns.length === 0) return 0;

  const sortedCheckIns = checkIns
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCheckIns.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (frequency === 'DAILY') {
    let expectedDate = new Date(today);
    
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);
      
      // Allow for today or yesterday as the start
      if (streak === 0) {
        const diffDays = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) break; // Streak broken
        expectedDate = checkInDate;
        streak = 1;
        expectedDate.setDate(expectedDate.getDate() - 1);
        continue;
      }

      if (checkInDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (frequency === 'WEEKLY') {
    // For weekly habits, count consecutive weeks
    const weeksSeen = new Set<string>();
    
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      const weekKey = `${checkInDate.getFullYear()}-${getWeekNumber(checkInDate)}`;
      weeksSeen.add(weekKey);
    }

    // Count consecutive weeks from current week
    const currentWeek = getWeekNumber(today);
    let checkWeek = currentWeek;
    let checkYear = today.getFullYear();

    while (weeksSeen.has(`${checkYear}-${checkWeek}`)) {
      streak++;
      checkWeek--;
      if (checkWeek < 1) {
        checkYear--;
        checkWeek = 52;
      }
    }
  }

  return streak;
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getHabits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { frequency, active } = req.query;

    const habits = await prisma.habit.findMany({
      where: {
        userId: req.userId,
        ...(frequency && { frequency: frequency as any }),
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'success',
      data: { habits },
    });
  } catch (error) {
    next(error);
  }
};

export const getHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    res.json({
      status: 'success',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

export const createHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as HabitInput;

    const habit = await prisma.habit.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        targetCount: data.targetCount || 1,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

export const updateHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingHabit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existingHabit) {
      throw new AppError('Habit not found', 404);
    }

    const habit = await prisma.habit.update({
      where: { id },
      data,
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    res.json({
      status: 'success',
      data: { habit },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    await prisma.habit.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const checkInHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date, notes } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    const checkInDate = date ? new Date(date) : new Date();
    checkInDate.setHours(0, 0, 0, 0);

    // Create or update check-in
    const checkIn = await prisma.habitCheckIn.upsert({
      where: {
        habitId_date: {
          habitId: id,
          date: checkInDate,
        },
      },
      update: {
        completed: true,
        notes,
      },
      create: {
        habitId: id,
        date: checkInDate,
        completed: true,
        notes,
      },
    });

    // Recalculate streak
    const allCheckIns = await prisma.habitCheckIn.findMany({
      where: { habitId: id },
      orderBy: { date: 'desc' },
    });

    const newStreak = calculateStreak(allCheckIns, habit.frequency);
    const longestStreak = Math.max(habit.longestStreak, newStreak);

    await prisma.habit.update({
      where: { id },
      data: {
        currentStreak: newStreak,
        longestStreak,
      },
    });

    res.json({
      status: 'success',
      data: {
        checkIn,
        currentStreak: newStreak,
        longestStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uncheckHabit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    const checkInDate = date ? new Date(date) : new Date();
    checkInDate.setHours(0, 0, 0, 0);

    await prisma.habitCheckIn.deleteMany({
      where: {
        habitId: id,
        date: checkInDate,
      },
    });

    // Recalculate streak
    const allCheckIns = await prisma.habitCheckIn.findMany({
      where: { habitId: id },
      orderBy: { date: 'desc' },
    });

    const newStreak = calculateStreak(allCheckIns, habit.frequency);

    await prisma.habit.update({
      where: { id },
      data: { currentStreak: newStreak },
    });

    res.json({
      status: 'success',
      data: { currentStreak: newStreak },
    });
  } catch (error) {
    next(error);
  }
};
