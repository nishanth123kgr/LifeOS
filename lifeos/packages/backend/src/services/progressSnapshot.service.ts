import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

// Score calculation weights
const SCORE_WEIGHTS = {
  finance: 0.40,
  fitness: 0.30,
  habits: 0.20,
  systems: 0.10,
};

export class ProgressSnapshotService {
  /**
   * Calculate financial score from goals
   */
  private calculateFinanceScore(goals: any[]): number {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      return sum + progress;
    }, 0);
    return Math.round(totalProgress / goals.length);
  }

  /**
   * Calculate fitness score from goals
   */
  private calculateFitnessScore(goals: any[]): number {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => {
      const totalChange = goal.targetValue - goal.startValue;
      if (totalChange === 0) return sum + 100;
      const currentChange = goal.currentValue - goal.startValue;
      const progress = Math.min(Math.max((currentChange / totalChange) * 100, 0), 100);
      return sum + progress;
    }, 0);
    return Math.round(totalProgress / goals.length);
  }

  /**
   * Calculate habits score
   */
  private calculateHabitsScore(habits: any[]): number {
    if (habits.length === 0) return 0;
    const maxExpectedStreak = 30;
    const totalScore = habits.reduce((sum, habit) => {
      const streakScore = Math.min((habit.currentStreak / maxExpectedStreak) * 100, 100);
      return sum + streakScore;
    }, 0);
    return Math.round(totalScore / habits.length);
  }

  /**
   * Calculate systems score
   */
  private calculateSystemsScore(systems: any[]): number {
    if (systems.length === 0) return 0;
    const totalAdherence = systems.reduce((sum, system) => {
      const adheredCount = system.adherenceLogs?.filter((l: any) => l.adhered).length || 0;
      const totalLogs = system.adherenceLogs?.length || 0;
      const adherence = totalLogs > 0 ? (adheredCount / totalLogs) * 100 : 0;
      return sum + adherence;
    }, 0);
    return Math.round(totalAdherence / systems.length);
  }

  /**
   * Create a progress snapshot for today
   */
  async createSnapshot(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    logger.info({ userId }, 'Creating progress snapshot');

    // Check if snapshot already exists for today
    const existing = await prisma.progressSnapshot.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      logger.debug({ userId }, 'Snapshot already exists for today, updating');
    }

    // Fetch all data in parallel
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
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        },
      }),
    ]);

    // Calculate scores
    const financeScore = this.calculateFinanceScore(financialGoals);
    const fitnessScore = this.calculateFitnessScore(fitnessGoals);
    const habitsScore = this.calculateHabitsScore(habits);
    const systemsScore = this.calculateSystemsScore(systems);

    const lifeScore = Math.round(
      financeScore * SCORE_WEIGHTS.finance +
      fitnessScore * SCORE_WEIGHTS.fitness +
      habitsScore * SCORE_WEIGHTS.habits +
      systemsScore * SCORE_WEIGHTS.systems
    );

    const totalSaved = financialGoals.reduce((sum, g) => sum + g.currentAmount, 0);

    const snapshot = await prisma.progressSnapshot.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        lifeScore,
        financeScore,
        fitnessScore,
        habitsScore,
        systemsScore,
        totalSaved,
        activeHabits: habits.length,
        activeGoals: financialGoals.length + fitnessGoals.length,
      },
      create: {
        userId,
        date: today,
        lifeScore,
        financeScore,
        fitnessScore,
        habitsScore,
        systemsScore,
        totalSaved,
        activeHabits: habits.length,
        activeGoals: financialGoals.length + fitnessGoals.length,
      },
    });

    logger.info({ userId, lifeScore }, 'Progress snapshot created');
    return snapshot;
  }

  /**
   * Get historical snapshots for a user
   */
  async getHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const snapshots = await prisma.progressSnapshot.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    return snapshots;
  }

  /**
   * Get today's snapshot
   */
  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.progressSnapshot.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    return snapshot;
  }

  /**
   * Get trend analysis
   */
  async getTrends(userId: string, days: number = 30) {
    const snapshots = await this.getHistory(userId, days);
    const last7Days = snapshots.slice(-7);

    if (snapshots.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const currentScore = snapshots[snapshots.length - 1]?.lifeScore || 0;
    const previousScore = snapshots[0]?.lifeScore || 0;
    const change = currentScore - previousScore;

    const weeklyAvg = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, s) => sum + s.lifeScore, 0) / last7Days.length)
      : 0;

    const monthlyAvg = snapshots.length > 0
      ? Math.round(snapshots.reduce((sum, s) => sum + s.lifeScore, 0) / snapshots.length)
      : 0;

    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      change,
      currentScore,
      weeklyAverage: weeklyAvg,
      monthlyAverage: monthlyAvg,
      dataPoints: snapshots.length,
    };
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    userId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) {
    const [period1Snapshots, period2Snapshots] = await Promise.all([
      prisma.progressSnapshot.findMany({
        where: {
          userId,
          date: { gte: period1Start, lte: period1End },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.progressSnapshot.findMany({
        where: {
          userId,
          date: { gte: period2Start, lte: period2End },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const calculateAverages = (snapshots: any[]) => {
      if (snapshots.length === 0) {
        return { lifeScore: 0, financeScore: 0, fitnessScore: 0, habitsScore: 0, systemsScore: 0 };
      }
      return {
        lifeScore: Math.round(snapshots.reduce((s, snap) => s + snap.lifeScore, 0) / snapshots.length),
        financeScore: Math.round(snapshots.reduce((s, snap) => s + snap.financeScore, 0) / snapshots.length),
        fitnessScore: Math.round(snapshots.reduce((s, snap) => s + snap.fitnessScore, 0) / snapshots.length),
        habitsScore: Math.round(snapshots.reduce((s, snap) => s + snap.habitsScore, 0) / snapshots.length),
        systemsScore: Math.round(snapshots.reduce((s, snap) => s + snap.systemsScore, 0) / snapshots.length),
      };
    };

    const period1Avg = calculateAverages(period1Snapshots);
    const period2Avg = calculateAverages(period2Snapshots);

    return {
      period1: {
        start: period1Start,
        end: period1End,
        dataPoints: period1Snapshots.length,
        averages: period1Avg,
      },
      period2: {
        start: period2Start,
        end: period2End,
        dataPoints: period2Snapshots.length,
        averages: period2Avg,
      },
      comparison: {
        lifeScore: period2Avg.lifeScore - period1Avg.lifeScore,
        financeScore: period2Avg.financeScore - period1Avg.financeScore,
        fitnessScore: period2Avg.fitnessScore - period1Avg.fitnessScore,
        habitsScore: period2Avg.habitsScore - period1Avg.habitsScore,
        systemsScore: period2Avg.systemsScore - period1Avg.systemsScore,
      },
    };
  }
}

export const progressSnapshotService = new ProgressSnapshotService();
