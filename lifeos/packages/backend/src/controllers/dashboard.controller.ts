import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

// Life Score weights (configurable)
const SCORE_WEIGHTS = {
  finance: 0.40,
  fitness: 0.30,
  habits: 0.20,
  systems: 0.10,
};

// Calculate financial score
const calculateFinanceScore = (goals: any[]): number => {
  if (goals.length === 0) return 0;
  
  const totalProgress = goals.reduce((sum, goal) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    return sum + progress;
  }, 0);
  
  return Math.round(totalProgress / goals.length);
};

// Calculate fitness score
const calculateFitnessScore = (goals: any[]): number => {
  if (goals.length === 0) return 0;
  
  const totalProgress = goals.reduce((sum, goal) => {
    const totalChange = goal.targetValue - goal.startValue;
    if (totalChange === 0) return sum + 100;
    const currentChange = goal.currentValue - goal.startValue;
    const progress = Math.min(Math.max((currentChange / totalChange) * 100, 0), 100);
    return sum + progress;
  }, 0);
  
  return Math.round(totalProgress / goals.length);
};

// Calculate habits score
const calculateHabitsScore = (habits: any[]): number => {
  if (habits.length === 0) return 0;
  
  // Score based on streak consistency
  const maxExpectedStreak = 30; // Consider 30+ days as 100%
  const totalScore = habits.reduce((sum, habit) => {
    const streakScore = Math.min((habit.currentStreak / maxExpectedStreak) * 100, 100);
    return sum + streakScore;
  }, 0);
  
  return Math.round(totalScore / habits.length);
};

// Calculate systems score
const calculateSystemsScore = (systems: any[]): number => {
  if (systems.length === 0) return 0;
  
  const totalAdherence = systems.reduce((sum, system) => {
    const adheredCount = system.adherenceLogs.filter((l: any) => l.adhered).length;
    const adherence = system.adherenceLogs.length > 0 
      ? (adheredCount / system.adherenceLogs.length) * 100 
      : 0;
    return sum + adherence;
  }, 0);
  
  return Math.round(totalAdherence / systems.length);
};

export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // Fetch all data in parallel
    const [financialGoals, fitnessGoals, habits, systems, user] = await Promise.all([
      prisma.financialGoal.findMany({
        where: { userId, isArchived: false, isPaused: false },
      }),
      prisma.fitnessGoal.findMany({
        where: { userId, isAchieved: false },
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
        include: {
          checkIns: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
        },
      }),
      prisma.lifeSystem.findMany({
        where: { userId, isActive: true },
        include: {
          adherenceLogs: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, currency: true },
      }),
    ]);

    // Calculate individual scores
    const financeScore = calculateFinanceScore(financialGoals);
    const fitnessScore = calculateFitnessScore(fitnessGoals);
    const habitsScore = calculateHabitsScore(habits);
    const systemsScore = calculateSystemsScore(systems);

    // Calculate overall Life Score
    const lifeScore = Math.round(
      financeScore * SCORE_WEIGHTS.finance +
      fitnessScore * SCORE_WEIGHTS.fitness +
      habitsScore * SCORE_WEIGHTS.habits +
      systemsScore * SCORE_WEIGHTS.systems
    );

    // Prepare financial summary
    const financialSummary = {
      totalGoals: financialGoals.length,
      totalTarget: financialGoals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSaved: financialGoals.reduce((sum, g) => sum + g.currentAmount, 0),
      goalsByStatus: {
        onTrack: financialGoals.filter(g => g.status === 'ON_TRACK').length,
        needsFocus: financialGoals.filter(g => g.status === 'NEEDS_FOCUS').length,
        behind: financialGoals.filter(g => g.status === 'BEHIND').length,
      },
      goals: financialGoals.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        progress: Math.min((g.currentAmount / g.targetAmount) * 100, 100),
        status: g.status,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
      })),
    };

    // Prepare fitness summary
    const fitnessSummary = {
      totalGoals: fitnessGoals.length,
      goals: fitnessGoals.map(g => {
        const totalChange = g.targetValue - g.startValue;
        const currentChange = g.currentValue - g.startValue;
        const progress = totalChange !== 0 
          ? Math.min(Math.max((currentChange / totalChange) * 100, 0), 100)
          : 100;
        return {
          id: g.id,
          name: g.name,
          metricType: g.metricType,
          progress,
          status: g.status,
          currentValue: g.currentValue,
          targetValue: g.targetValue,
          unit: g.unit,
        };
      }),
    };

    // Prepare habits summary
    const habitsSummary = {
      totalHabits: habits.length,
      totalStreakDays: habits.reduce((sum, h) => sum + h.currentStreak, 0),
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        frequency: h.frequency,
        currentStreak: h.currentStreak,
        longestStreak: h.longestStreak,
        checkedInToday: h.checkIns.some(c => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkInDate = new Date(c.date);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate.getTime() === today.getTime();
        }),
      })),
    };

    // Prepare systems summary
    const systemsSummary = {
      totalSystems: systems.length,
      systems: systems.map(s => {
        const adheredCount = s.adherenceLogs.filter(l => l.adhered).length;
        const adherence = s.adherenceLogs.length > 0
          ? Math.round((adheredCount / s.adherenceLogs.length) * 100)
          : 0;
        return {
          id: s.id,
          name: s.name,
          category: s.category,
          adherence,
          adherenceTarget: s.adherenceTarget,
          isOnTrack: adherence >= s.adherenceTarget,
        };
      }),
    };

    res.json({
      status: 'success',
      data: {
        user: user,
        lifeScore,
        scores: {
          finance: financeScore,
          fitness: fitnessScore,
          habits: habitsScore,
          systems: systemsScore,
        },
        weights: SCORE_WEIGHTS,
        financial: financialSummary,
        fitness: fitnessSummary,
        habits: habitsSummary,
        systems: systemsSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLifeScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const [financialGoals, fitnessGoals, habits, systems] = await Promise.all([
      prisma.financialGoal.findMany({
        where: { userId, isArchived: false, isPaused: false },
      }),
      prisma.fitnessGoal.findMany({
        where: { userId, isAchieved: false },
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
      }),
      prisma.lifeSystem.findMany({
        where: { userId, isActive: true },
        include: {
          adherenceLogs: {
            where: {
              date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
        },
      }),
    ]);

    const financeScore = calculateFinanceScore(financialGoals);
    const fitnessScore = calculateFitnessScore(fitnessGoals);
    const habitsScore = calculateHabitsScore(habits);
    const systemsScore = calculateSystemsScore(systems);

    const lifeScore = Math.round(
      financeScore * SCORE_WEIGHTS.finance +
      fitnessScore * SCORE_WEIGHTS.fitness +
      habitsScore * SCORE_WEIGHTS.habits +
      systemsScore * SCORE_WEIGHTS.systems
    );

    res.json({
      status: 'success',
      data: {
        lifeScore,
        breakdown: {
          finance: { score: financeScore, weight: SCORE_WEIGHTS.finance },
          fitness: { score: fitnessScore, weight: SCORE_WEIGHTS.fitness },
          habits: { score: habitsScore, weight: SCORE_WEIGHTS.habits },
          systems: { score: systemsScore, weight: SCORE_WEIGHTS.systems },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
