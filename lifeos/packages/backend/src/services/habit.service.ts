import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { achievementService } from './achievement.service.js';

export class HabitService {
  /**
   * Get all habits for a user
   */
  async getAll(userId: string, includeInactive = false) {
    return prisma.habit.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get habit by ID
   */
  async getById(id: string, userId: string) {
    return prisma.habit.findFirst({
      where: { id, userId },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  /**
   * Create a new habit
   */
  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      frequency?: 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';
      targetCount?: number;
      isQuantity?: boolean;
      quantityTarget?: number;
      quantityUnit?: string;
    }
  ) {
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        frequency: data.frequency || 'DAILY',
        targetCount: data.targetCount || 1,
        isQuantity: data.isQuantity || false,
        quantityTarget: data.quantityTarget,
        quantityUnit: data.quantityUnit,
      },
    });

    logger.info({ userId, habitId: habit.id }, 'Habit created');
    
    // Check and unlock any achievements
    achievementService.checkAndUnlock(userId).catch(err => 
      logger.error({ err, userId }, 'Failed to check achievements')
    );
    
    return habit;
  }

  /**
   * Log habit completion (check-in)
   */
  async logCompletion(
    habitId: string,
    userId: string,
    data: {
      date?: Date;
      completed?: boolean;
      quantity?: number;
      notes?: string;
      skipped?: boolean;
    }
  ) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    const date = data.date || new Date();
    date.setHours(0, 0, 0, 0);

    // Upsert the check-in
    const checkIn = await prisma.habitCheckIn.upsert({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
      update: {
        completed: data.completed ?? true,
        quantity: data.quantity,
        notes: data.notes,
        skipped: data.skipped ?? false,
      },
      create: {
        habitId,
        date,
        completed: data.completed ?? true,
        quantity: data.quantity,
        notes: data.notes,
        skipped: data.skipped ?? false,
      },
    });

    // Update streak
    await this.updateStreak(habitId);

    // Check and unlock any achievements (for streak milestones)
    achievementService.checkAndUnlock(userId).catch(err => 
      logger.error({ err, userId }, 'Failed to check achievements')
    );

    logger.info({ habitId, date, completed: checkIn.completed }, 'Habit logged');
    return checkIn;
  }

  /**
   * Update streak for a habit
   */
  async updateStreak(habitId: string) {
    const checkIns = await prisma.habitCheckIn.findMany({
      where: { habitId, completed: true },
      orderBy: { date: 'desc' },
    });

    if (checkIns.length === 0) {
      await prisma.habit.update({
        where: { id: habitId },
        data: { currentStreak: 0 },
      });
      return 0;
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    
    for (const checkIn of checkIns) {
      const logDate = new Date(checkIn.date);
      logDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        currentStreak++;
        checkDate = logDate;
      } else {
        break;
      }
    }

    // Update habit with new streak
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    const longestStreak = Math.max(habit?.longestStreak || 0, currentStreak);

    await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak,
        longestStreak,
      },
    });

    return currentStreak;
  }

  /**
   * Use a streak freeze
   */
  async useStreakFreeze(habitId: string, userId: string, date?: Date) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    // Check user preferences for available streak freezes
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences || preferences.streakFreezeCount <= 0) {
      throw new Error('No streak freezes available');
    }

    const freezeDate = date || new Date();
    freezeDate.setHours(0, 0, 0, 0);

    // Check if already logged for this date
    const existingCheckIn = await prisma.habitCheckIn.findUnique({
      where: {
        habitId_date: { habitId, date: freezeDate },
      },
    });

    if (existingCheckIn) {
      throw new Error('Already logged for this date');
    }

    // Create a "frozen" check-in and decrement freezes in transaction
    const [checkIn] = await prisma.$transaction([
      prisma.habitCheckIn.create({
        data: {
          habitId,
          date: freezeDate,
          completed: true,
          notes: '❄️ Streak Freeze Used',
          skipped: false,
        },
      }),
      prisma.userPreferences.update({
        where: { userId },
        data: {
          streakFreezeCount: { decrement: 1 },
        },
      }),
      prisma.habit.update({
        where: { id: habitId },
        data: {
          streakFreezeUsed: freezeDate,
        },
      }),
    ]);

    // Recalculate streak
    await this.updateStreak(habitId);

    logger.info({ habitId, date: freezeDate }, 'Streak freeze used');
    return checkIn;
  }

  /**
   * Update habit quantity
   */
  async logQuantity(
    habitId: string,
    userId: string,
    quantity: number,
    date?: Date
  ) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit || !habit.isQuantity) {
      throw new Error('Habit not found or not a quantity habit');
    }

    const logDate = date || new Date();
    logDate.setHours(0, 0, 0, 0);

    // Check if target met
    const completed = habit.quantityTarget 
      ? quantity >= habit.quantityTarget 
      : quantity > 0;

    const checkIn = await prisma.habitCheckIn.upsert({
      where: {
        habitId_date: { habitId, date: logDate },
      },
      update: { quantity, completed },
      create: {
        habitId,
        date: logDate,
        quantity,
        completed,
      },
    });

    // Update streak if completed
    if (completed) {
      await this.updateStreak(habitId);
    }

    return checkIn;
  }

  /**
   * Get habit statistics
   */
  async getStats(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    const completedCheckIns = habit.checkIns.filter(c => c.completed);
    const totalDays = habit.checkIns.length;
    const completedDays = completedCheckIns.length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    // Weekly breakdown
    const weeklyStats: Record<string, { completed: number; total: number }> = {};
    habit.checkIns.forEach(checkIn => {
      const weekStart = new Date(checkIn.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { completed: 0, total: 0 };
      }
      weeklyStats[weekKey].total++;
      if (checkIn.completed) weeklyStats[weekKey].completed++;
    });

    // Quantity stats for quantity habits
    let quantityStats = null;
    if (habit.isQuantity) {
      const quantities = habit.checkIns.map(c => c.quantity || 0);
      quantityStats = {
        total: quantities.reduce((a, b) => a + b, 0),
        average: quantities.length > 0 
          ? quantities.reduce((a, b) => a + b, 0) / quantities.length 
          : 0,
        max: Math.max(...quantities, 0),
        min: quantities.length > 0 ? Math.min(...quantities) : 0,
      };
    }

    return {
      habit: {
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        isQuantity: habit.isQuantity,
        quantityTarget: habit.quantityTarget,
        quantityUnit: habit.quantityUnit,
      },
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalDays,
      completedDays,
      completionRate,
      weeklyStats: Object.entries(weeklyStats).slice(0, 8).map(([week, stats]) => ({
        week,
        ...stats,
        rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      })),
      quantityStats,
    };
  }

  /**
   * Deactivate a habit
   */
  async deactivate(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    await prisma.habit.update({
      where: { id: habitId },
      data: { isActive: false },
    });

    logger.info({ habitId }, 'Habit deactivated');
  }

  /**
   * Reactivate a habit
   */
  async reactivate(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new Error('Habit not found');
    }

    await prisma.habit.update({
      where: { id: habitId },
      data: { isActive: true },
    });

    logger.info({ habitId }, 'Habit reactivated');
  }
}

export const habitService = new HabitService();
