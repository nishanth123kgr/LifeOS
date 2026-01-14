import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

type SearchableEntity = 'financialGoals' | 'fitnessGoals' | 'habits' | 'systems' | 'budgets' | 'journals' | 'all';

interface SearchOptions {
  query?: string;
  entities?: SearchableEntity[];
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult {
  type: string;
  id: string;
  title: string;
  description?: string;
  status?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export class SearchService {
  /**
   * Global search across all entities
   */
  async search(userId: string, options: SearchOptions): Promise<{ results: SearchResult[]; total: number }> {
    const { 
      query = '', 
      entities = ['all'], 
      status,
      dateFrom,
      dateTo,
      limit = 20, 
      offset = 0,
      sortOrder = 'desc',
    } = options;

    const searchEntities = entities.includes('all') 
      ? ['financialGoals', 'fitnessGoals', 'habits', 'systems', 'budgets', 'journals']
      : entities;

    const results: SearchResult[] = [];
    const dateFilter = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
    const hasDateFilter = dateFrom || dateTo;

    // Search Financial Goals
    if (searchEntities.includes('financialGoals')) {
      const goals = await prisma.financialGoal.findMany({
        where: {
          userId,
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { notes: { contains: query, mode: 'insensitive' } },
            ],
          }),
          ...(status && { status: status as any }),
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: sortOrder },
      });

      results.push(...goals.map(g => ({
        type: 'financial_goal',
        id: g.id,
        title: g.name,
        description: g.notes || undefined,
        status: g.status,
        createdAt: g.createdAt,
        metadata: {
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          progress: (g.currentAmount / g.targetAmount) * 100,
          type: g.type,
        },
      })));
    }

    // Search Fitness Goals
    if (searchEntities.includes('fitnessGoals')) {
      const goals = await prisma.fitnessGoal.findMany({
        where: {
          userId,
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { notes: { contains: query, mode: 'insensitive' } },
            ],
          }),
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: sortOrder },
      });

      results.push(...goals.map(g => ({
        type: 'fitness_goal',
        id: g.id,
        title: g.name,
        description: g.notes || undefined,
        status: g.isAchieved ? 'COMPLETED' : g.status,
        createdAt: g.createdAt,
        metadata: {
          metricType: g.metricType,
          targetValue: g.targetValue,
          currentValue: g.currentValue,
          unit: g.unit,
        },
      })));
    }

    // Search Habits
    if (searchEntities.includes('habits')) {
      const habits = await prisma.habit.findMany({
        where: {
          userId,
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }),
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: sortOrder },
      });

      results.push(...habits.map(h => ({
        type: 'habit',
        id: h.id,
        title: h.name,
        description: h.description || undefined,
        status: h.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: h.createdAt,
        metadata: {
          frequency: h.frequency,
          currentStreak: h.currentStreak,
          longestStreak: h.longestStreak,
        },
      })));
    }

    // Search Life Systems
    if (searchEntities.includes('systems')) {
      const systems = await prisma.lifeSystem.findMany({
        where: {
          userId,
          ...(query && {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }),
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: sortOrder },
      });

      results.push(...systems.map(s => ({
        type: 'life_system',
        id: s.id,
        title: s.name,
        description: s.description || undefined,
        status: s.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: s.createdAt,
        metadata: {
          category: s.category,
          adherenceTarget: s.adherenceTarget,
        },
      })));
    }

    // Search Budgets
    if (searchEntities.includes('budgets')) {
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          items: true,
        },
        orderBy: { createdAt: sortOrder },
      });

      results.push(...budgets.map(b => ({
        type: 'budget',
        id: b.id,
        title: `Budget ${b.month}/${b.year}`,
        description: `Income: ₹${b.income.toLocaleString()}`,
        status: 'ACTIVE',
        createdAt: b.createdAt,
        metadata: {
          month: b.month,
          year: b.year,
          income: b.income,
          itemCount: b.items.length,
        },
      })));
    }

    // Search Journal Entries
    if (searchEntities.includes('journals')) {
      const entries = await prisma.journalEntry.findMany({
        where: {
          userId,
          ...(query && {
            content: { contains: query, mode: 'insensitive' },
          }),
          ...(options.tags?.length && { tags: { hasSome: options.tags } }),
          ...(hasDateFilter && { date: dateFilter }),
        },
        orderBy: { date: sortOrder },
      });

      results.push(...entries.map(e => ({
        type: 'journal_entry',
        id: e.id,
        title: e.content.substring(0, 50) + (e.content.length > 50 ? '...' : ''),
        description: e.tags.length > 0 ? `Tags: ${e.tags.join(', ')}` : undefined,
        status: e.mood ? `Mood: ${e.mood}/5` : undefined,
        createdAt: e.createdAt,
        metadata: {
          date: e.date,
          mood: e.mood,
          tags: e.tags,
        },
      })));
    }

    // Sort all results by date
    results.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    logger.info({ userId, query, resultCount: results.length }, 'Search performed');

    return {
      results: paginatedResults,
      total: results.length,
    };
  }

  /**
   * Quick search (returns fewer fields for autocomplete)
   */
  async quickSearch(userId: string, query: string, limit = 10): Promise<Array<{ type: string; id: string; title: string }>> {
    if (!query || query.length < 2) {
      return [];
    }

    const results = await this.search(userId, { query, limit });
    
    return results.results.map(r => ({
      type: r.type,
      id: r.id,
      title: r.title,
    }));
  }

  /**
   * Get recent items across all entities
   */
  async getRecent(userId: string, limit = 10): Promise<SearchResult[]> {
    const results = await this.search(userId, { limit, sortOrder: 'desc' });
    return results.results;
  }

  /**
   * Filter financial goals
   */
  async filterFinancialGoals(
    userId: string,
    filters: {
      status?: string[];
      type?: string[];
      minAmount?: number;
      maxAmount?: number;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    const where: any = { userId };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }
    if (filters.type?.length) {
      where.type = { in: filters.type };
    }
    if (filters.minAmount !== undefined) {
      where.targetAmount = { ...where.targetAmount, gte: filters.minAmount };
    }
    if (filters.maxAmount !== undefined) {
      where.targetAmount = { ...where.targetAmount, lte: filters.maxAmount };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    return prisma.financialGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Filter habits
   */
  async filterHabits(
    userId: string,
    filters: {
      frequency?: string[];
      isActive?: boolean;
      minStreak?: number;
      isQuantity?: boolean;
    }
  ) {
    const where: any = { userId };

    if (filters.frequency?.length) {
      where.frequency = { in: filters.frequency };
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.minStreak !== undefined) {
      where.currentStreak = { gte: filters.minStreak };
    }
    if (filters.isQuantity !== undefined) {
      where.isQuantity = filters.isQuantity;
    }

    return prisma.habit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const searchService = new SearchService();
