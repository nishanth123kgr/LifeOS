import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { AchievementCategory } from '@prisma/client';

// Achievement definitions with proper enum typing
const ACHIEVEMENTS: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  criteria: { type: string; value: number };
  points: number;
}> = [
  // General
  { code: 'FIRST_GOAL', name: 'First Step', description: 'Create your first goal', icon: 'target', category: AchievementCategory.GENERAL, criteria: { type: 'goal_count', value: 1 }, points: 10 },
  { code: 'GOAL_MASTER', name: 'Goal Master', description: 'Create 10 goals', icon: 'trophy', category: AchievementCategory.GENERAL, criteria: { type: 'goal_count', value: 10 }, points: 50 },
  
  // Habits
  { code: 'STREAK_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame', category: AchievementCategory.HABITS, criteria: { type: 'streak', value: 7 }, points: 20 },
  { code: 'STREAK_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'dumbbell', category: AchievementCategory.HABITS, criteria: { type: 'streak', value: 30 }, points: 50 },
  { code: 'STREAK_100', name: 'Century Club', description: 'Maintain a 100-day streak', icon: 'award', category: AchievementCategory.HABITS, criteria: { type: 'streak', value: 100 }, points: 100 },
  { code: 'HABIT_STARTER', name: 'Habit Starter', description: 'Create your first habit', icon: 'check-circle', category: AchievementCategory.HABITS, criteria: { type: 'habit_count', value: 1 }, points: 10 },
  { code: 'HABIT_COLLECTOR', name: 'Habit Collector', description: 'Track 5 habits', icon: 'clipboard-list', category: AchievementCategory.HABITS, criteria: { type: 'habit_count', value: 5 }, points: 30 },

  // Finance
  { code: 'FIRST_SAVE', name: 'First Savings', description: 'Save your first amount', icon: 'piggy-bank', category: AchievementCategory.FINANCE, criteria: { type: 'savings', value: 1 }, points: 10 },
  { code: 'SAVER_10K', name: 'Smart Saver', description: 'Save ₹10,000 total', icon: 'landmark', category: AchievementCategory.FINANCE, criteria: { type: 'total_saved', value: 10000 }, points: 30 },
  { code: 'SAVER_100K', name: 'Wealth Builder', description: 'Save ₹1,00,000 total', icon: 'gem', category: AchievementCategory.FINANCE, criteria: { type: 'total_saved', value: 100000 }, points: 100 },
  { code: 'GOAL_COMPLETE', name: 'Goal Crusher', description: 'Complete your first financial goal', icon: 'party-popper', category: AchievementCategory.FINANCE, criteria: { type: 'goal_completed', value: 1 }, points: 50 },
  { code: 'BUDGET_MASTER', name: 'Budget Master', description: 'Stay under budget for a month', icon: 'bar-chart-3', category: AchievementCategory.FINANCE, criteria: { type: 'under_budget', value: 1 }, points: 40 },

  // Fitness
  { code: 'FITNESS_START', name: 'Fitness Journey', description: 'Create your first fitness goal', icon: 'footprints', category: AchievementCategory.FITNESS, criteria: { type: 'fitness_goal', value: 1 }, points: 10 },
  { code: 'FITNESS_COMPLETE', name: 'Fit Achiever', description: 'Complete a fitness goal', icon: 'medal', category: AchievementCategory.FITNESS, criteria: { type: 'fitness_completed', value: 1 }, points: 50 },

  // Systems
  { code: 'SYSTEM_START', name: 'Systems Thinker', description: 'Create your first life system', icon: 'settings', category: AchievementCategory.SYSTEMS, criteria: { type: 'system_count', value: 1 }, points: 10 },
  { code: 'SYSTEM_ADHERENCE', name: 'System Follower', description: 'Maintain 80% adherence for 30 days', icon: 'trending-up', category: AchievementCategory.SYSTEMS, criteria: { type: 'system_adherence', value: 80 }, points: 50 },

  // Life Score
  { code: 'SCORE_50', name: 'Balanced Life', description: 'Reach a Life Score of 50', icon: 'star', category: AchievementCategory.GENERAL, criteria: { type: 'life_score', value: 50 }, points: 30 },
  { code: 'SCORE_75', name: 'Life Optimizer', description: 'Reach a Life Score of 75', icon: 'sparkles', category: AchievementCategory.GENERAL, criteria: { type: 'life_score', value: 75 }, points: 50 },
  { code: 'SCORE_90', name: 'Life Master', description: 'Reach a Life Score of 90', icon: 'crown', category: AchievementCategory.GENERAL, criteria: { type: 'life_score', value: 90 }, points: 100 },
];

export class AchievementService {
  /**
   * Seed default achievements into database
   */
  async seedAchievements() {
    logger.info('Seeding achievements');
    
    for (const achievement of ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { code: achievement.code },
        update: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          criteria: achievement.criteria,
          points: achievement.points,
        },
        create: {
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          criteria: achievement.criteria,
          points: achievement.points,
        },
      });
    }

    logger.info({ count: ACHIEVEMENTS.length }, 'Achievements seeded');
  }

  /**
   * Get all achievements with user unlock status
   */
  async getAllForUser(userId: string) {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { points: 'asc' }],
    });

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    return achievements.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt,
    }));
  }

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements(userId: string) {
    return prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  /**
   * Get total points for a user
   */
  async getTotalPoints(userId: string) {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    return achievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
  }

  /**
   * Check and unlock achievements for a user
   */
  async checkAndUnlock(userId: string) {
    const newlyUnlocked: any[] = [];

    // Fetch user data for checking
    const [
      financialGoals,
      fitnessGoals,
      habits,
      userAchievements,
      allAchievements,
    ] = await Promise.all([
      prisma.financialGoal.findMany({ where: { userId } }),
      prisma.fitnessGoal.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.userAchievement.findMany({ where: { userId } }),
      prisma.achievement.findMany(),
    ]);

    const unlockedCodes = new Set(
      userAchievements.map(ua => 
        allAchievements.find(a => a.id === ua.achievementId)?.code
      )
    );

    const totalSaved = financialGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
    const completedFinancialGoals = financialGoals.filter(g => g.status === 'COMPLETED').length;
    const completedFitnessGoals = fitnessGoals.filter(g => g.isAchieved).length;

    // Check each achievement
    for (const achievement of allAchievements) {
      if (unlockedCodes.has(achievement.code)) continue;

      const criteria = achievement.criteria as { type: string; value: number };
      let shouldUnlock = false;

      switch (criteria.type) {
        case 'goal_count':
          shouldUnlock = financialGoals.length + fitnessGoals.length >= criteria.value;
          break;
        case 'streak':
          shouldUnlock = maxStreak >= criteria.value;
          break;
        case 'habit_count':
          shouldUnlock = habits.length >= criteria.value;
          break;
        case 'total_saved':
          shouldUnlock = totalSaved >= criteria.value;
          break;
        case 'savings':
          shouldUnlock = totalSaved > 0;
          break;
        case 'goal_completed':
          shouldUnlock = completedFinancialGoals >= criteria.value;
          break;
        case 'fitness_goal':
          shouldUnlock = fitnessGoals.length >= criteria.value;
          break;
        case 'fitness_completed':
          shouldUnlock = completedFitnessGoals >= criteria.value;
          break;
      }

      if (shouldUnlock) {
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
          include: { achievement: true },
        });
        newlyUnlocked.push(userAchievement);
        logger.info({ userId, achievement: achievement.code }, 'Achievement unlocked');
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get recent unlocks (for notifications)
   */
  async getUnnotified(userId: string) {
    return prisma.userAchievement.findMany({
      where: { userId, notified: false },
      include: { achievement: true },
    });
  }

  /**
   * Mark achievements as notified
   */
  async markNotified(ids: string[]) {
    await prisma.userAchievement.updateMany({
      where: { id: { in: ids } },
      data: { notified: true },
    });
  }
}

export const achievementService = new AchievementService();
