import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

export class JournalService {
  /**
   * Calculate word count
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Create a journal entry
   */
  async create(
    userId: string,
    data: {
      content: string;
      date?: Date;
      title?: string;
      mood?: number; // 1-5 scale
      energy?: number; // 1-5 scale
      gratitude?: string;
      tags?: string[];
    }
  ) {
    const entryDate = data.date || new Date();
    entryDate.setHours(0, 0, 0, 0);

    const wordCount = this.countWords(data.content) + 
      (data.gratitude ? this.countWords(data.gratitude) : 0);

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        date: entryDate,
        title: data.title,
        content: data.content,
        gratitude: data.gratitude,
        mood: data.mood,
        energy: data.energy,
        tags: data.tags || [],
        wordCount,
      },
    });

    logger.info({ userId, entryId: entry.id }, 'Journal entry created');
    return entry;
  }

  /**
   * Get all journal entries for a user
   */
  async getAll(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      search?: string;
      mood?: number;
      tags?: string[];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    const where: any = { userId };

    if (options?.search) {
      where.content = { contains: options.search, mode: 'insensitive' };
    }

    if (options?.mood) {
      where.mood = options.mood;
    }

    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    if (options?.dateFrom || options?.dateTo) {
      where.date = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      };
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return { entries, total };
  }

  /**
   * Get entry by ID
   */
  async getById(id: string, userId: string) {
    return prisma.journalEntry.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Get entry by date
   */
  async getByDate(userId: string, date: Date) {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    
    return prisma.journalEntry.findFirst({
      where: { userId, date: searchDate },
    });
  }

  /**
   * Update an entry
   */
  async update(
    id: string,
    userId: string,
    data: {
      content?: string;
      title?: string;
      mood?: number;
      energy?: number;
      gratitude?: string;
      tags?: string[];
    }
  ) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    const wordCount = data.content 
      ? this.countWords(data.content) + (data.gratitude ? this.countWords(data.gratitude) : 0)
      : undefined;

    return prisma.journalEntry.update({
      where: { id },
      data: {
        ...data,
        ...(wordCount !== undefined && { wordCount }),
      },
    });
  }

  /**
   * Delete an entry
   */
  async delete(id: string, userId: string) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    await prisma.journalEntry.delete({ where: { id } });
    logger.info({ entryId: id }, 'Journal entry deleted');
  }

  /**
   * Get mood analytics
   */
  async getMoodAnalytics(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        date: { gte: startDate },
        mood: { not: null },
      },
      orderBy: { date: 'asc' },
    });

    if (entries.length === 0) {
      return {
        averageMood: 0,
        moodTrend: [],
        moodDistribution: {},
        entriesWithMood: 0,
      };
    }

    // Calculate average mood
    const moods = entries.map(e => e.mood!);
    const averageMood = moods.reduce((a, b) => a + b, 0) / moods.length;

    // Mood distribution
    const moodDistribution: Record<number, number> = {};
    moods.forEach(mood => {
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });

    // Mood trend (by week)
    const weeklyMoods: Record<string, number[]> = {};
    entries.forEach(entry => {
      const weekStart = new Date(entry.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMoods[weekKey]) {
        weeklyMoods[weekKey] = [];
      }
      if (entry.mood) {
        weeklyMoods[weekKey].push(entry.mood);
      }
    });

    const moodTrend = Object.entries(weeklyMoods).map(([week, moods]) => ({
      week,
      averageMood: moods.reduce((a, b) => a + b, 0) / moods.length,
      entryCount: moods.length,
    }));

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      moodTrend,
      moodDistribution,
      entriesWithMood: entries.length,
    };
  }

  /**
   * Get tag analytics
   */
  async getTagAnalytics(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      select: { tags: true, mood: true },
    });

    const tagCounts: Record<string, number> = {};
    const tagMoods: Record<string, number[]> = {};

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        if (entry.mood) {
          if (!tagMoods[tag]) tagMoods[tag] = [];
          tagMoods[tag].push(entry.mood);
        }
      });
    });

    const tagStats = Object.entries(tagCounts).map(([tag, count]) => ({
      tag,
      count,
      averageMood: tagMoods[tag]?.length 
        ? Math.round((tagMoods[tag].reduce((a, b) => a + b, 0) / tagMoods[tag].length) * 10) / 10
        : null,
    }));

    return {
      totalEntries: entries.length,
      uniqueTags: Object.keys(tagCounts).length,
      tags: tagStats.sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Search journal entries
   */
  async search(userId: string, query: string, limit = 20) {
    return prisma.journalEntry.findMany({
      where: {
        userId,
        content: { contains: query, mode: 'insensitive' },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  /**
   * Get writing streak
   */
  async getWritingStreak(userId: string) {
    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalEntries: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date(today);

    const uniqueDates = new Set(entries.map(e => e.date.toISOString().split('T')[0]));
    const sortedDates = Array.from(uniqueDates).sort().reverse();

    for (const dateStr of sortedDates) {
      const entryDate = new Date(dateStr);
      const daysDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        tempStreak++;
        checkDate = entryDate;
        if (currentStreak === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        checkDate = entryDate;
        if (currentStreak === 0 && daysDiff > 1) {
          // Streak is broken
          currentStreak = 0;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalEntries: entries.length,
    };
  }
}

export const journalService = new JournalService();
