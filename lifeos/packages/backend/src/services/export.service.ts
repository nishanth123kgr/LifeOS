import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

interface ExportOptions {
  format: 'json' | 'csv';
  includeFinancialGoals?: boolean;
  includeFitnessGoals?: boolean;
  includeHabits?: boolean;
  includeSystems?: boolean;
  includeBudgets?: boolean;
  includeSnapshots?: boolean;
  includeAchievements?: boolean;
  includeJournals?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ExportService {
  /**
   * Export all user data
   */
  async exportUserData(userId: string, options: ExportOptions) {
    logger.info({ userId, options }, 'Exporting user data');

    const data: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    data.profile = user;

    // Fetch data based on options
    const dateFilter = {
      ...(options.dateFrom && { gte: options.dateFrom }),
      ...(options.dateTo && { lte: options.dateTo }),
    };
    const hasDateFilter = options.dateFrom || options.dateTo;

    if (options.includeFinancialGoals !== false) {
      data.financialGoals = await prisma.financialGoal.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeFitnessGoals !== false) {
      data.fitnessGoals = await prisma.fitnessGoal.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          progressHistory: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeHabits !== false) {
      data.habits = await prisma.habit.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          checkIns: {
            where: hasDateFilter ? { date: dateFilter } : {},
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeBudgets !== false) {
      data.budgets = await prisma.budget.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeSnapshots !== false) {
      data.progressSnapshots = await prisma.progressSnapshot.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      });
    }

    if (options.includeAchievements !== false) {
      data.achievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      });
    }

    if (options.includeJournals !== false) {
      data.journalEntries = await prisma.journalEntry.findMany({
        where: { 
          userId,
          ...(hasDateFilter && { date: dateFilter }),
        },
        orderBy: { date: 'desc' },
      });
    }

    // Format based on requested format
    if (options.format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: Record<string, any>): Record<string, string> {
    const csvFiles: Record<string, string> = {};

    // Financial Goals
    if (data.financialGoals?.length) {
      const headers = ['id', 'name', 'type', 'targetAmount', 'currentAmount', 'status', 'targetDate', 'createdAt'];
      const rows = data.financialGoals.map((g: any) => 
        headers.map(h => this.escapeCSV(g[h])).join(',')
      );
      csvFiles['financial_goals.csv'] = [headers.join(','), ...rows].join('\n');
    }

    // Fitness Goals
    if (data.fitnessGoals?.length) {
      const headers = ['id', 'name', 'metricType', 'startValue', 'currentValue', 'targetValue', 'unit', 'status', 'targetDate', 'createdAt'];
      const rows = data.fitnessGoals.map((g: any) => 
        headers.map(h => this.escapeCSV(g[h])).join(',')
      );
      csvFiles['fitness_goals.csv'] = [headers.join(','), ...rows].join('\n');

      // Progress history
      const allProgress = data.fitnessGoals.flatMap((g: any) => 
        (g.progressHistory || []).map((p: any) => ({ ...p, goalName: g.name }))
      );
      if (allProgress.length) {
        const progHeaders = ['id', 'goalName', 'value', 'recordedAt', 'notes'];
        const progRows = allProgress.map((p: any) => 
          progHeaders.map(h => this.escapeCSV(p[h])).join(',')
        );
        csvFiles['fitness_progress.csv'] = [progHeaders.join(','), ...progRows].join('\n');
      }
    }

    // Habits
    if (data.habits?.length) {
      const headers = ['id', 'name', 'description', 'frequency', 'currentStreak', 'longestStreak', 'isActive', 'createdAt'];
      const rows = data.habits.map((h: any) => 
        headers.map(hdr => this.escapeCSV(h[hdr])).join(',')
      );
      csvFiles['habits.csv'] = [headers.join(','), ...rows].join('\n');

      // Check-ins
      const allCheckIns = data.habits.flatMap((h: any) => 
        (h.checkIns || []).map((c: any) => ({ ...c, habitName: h.name }))
      );
      if (allCheckIns.length) {
        const ciHeaders = ['id', 'habitName', 'date', 'completed', 'quantity', 'notes'];
        const ciRows = allCheckIns.map((c: any) => 
          ciHeaders.map(h => this.escapeCSV(c[h])).join(',')
        );
        csvFiles['habit_check_ins.csv'] = [ciHeaders.join(','), ...ciRows].join('\n');
      }
    }

    // Budgets
    if (data.budgets?.length) {
      const headers = ['id', 'month', 'year', 'income', 'rolloverAmount', 'createdAt'];
      const rows = data.budgets.map((b: any) => 
        headers.map(h => this.escapeCSV(b[h])).join(',')
      );
      csvFiles['budgets.csv'] = [headers.join(','), ...rows].join('\n');

      // Budget items
      const allItems = data.budgets.flatMap((b: any) => 
        (b.items || []).map((i: any) => ({ ...i, budgetPeriod: `${b.month}/${b.year}` }))
      );
      if (allItems.length) {
        const itemHeaders = ['id', 'budgetPeriod', 'category', 'planned', 'actual', 'rollover', 'notes'];
        const itemRows = allItems.map((i: any) => 
          itemHeaders.map(h => this.escapeCSV(i[h])).join(',')
        );
        csvFiles['budget_items.csv'] = [itemHeaders.join(','), ...itemRows].join('\n');
      }
    }

    // Progress Snapshots
    if (data.progressSnapshots?.length) {
      const headers = ['id', 'date', 'lifeScore', 'financeScore', 'fitnessScore', 'habitsScore', 'systemsScore', 'totalSaved', 'activeHabits', 'activeGoals'];
      const rows = data.progressSnapshots.map((s: any) => 
        headers.map(h => this.escapeCSV(s[h])).join(',')
      );
      csvFiles['progress_snapshots.csv'] = [headers.join(','), ...rows].join('\n');
    }

    // Achievements
    if (data.achievements?.length) {
      const headers = ['achievementCode', 'achievementName', 'category', 'points', 'unlockedAt'];
      const rows = data.achievements.map((a: any) => [
        this.escapeCSV(a.achievement?.code),
        this.escapeCSV(a.achievement?.name),
        this.escapeCSV(a.achievement?.category),
        this.escapeCSV(a.achievement?.points),
        this.escapeCSV(a.unlockedAt),
      ].join(','));
      csvFiles['achievements.csv'] = [headers.join(','), ...rows].join('\n');
    }

    // Journal Entries
    if (data.journalEntries?.length) {
      const headers = ['id', 'date', 'mood', 'tags', 'content', 'createdAt'];
      const rows = data.journalEntries.map((j: any) => 
        headers.map(h => {
          if (h === 'tags') return this.escapeCSV(j.tags?.join('; '));
          return this.escapeCSV(j[h]);
        }).join(',')
      );
      csvFiles['journal_entries.csv'] = [headers.join(','), ...rows].join('\n');
    }

    return csvFiles;
  }

  /**
   * Escape value for CSV
   */
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Export financial goals only
   */
  async exportFinancialGoals(userId: string, format: 'json' | 'csv' = 'json') {
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = ['id', 'name', 'type', 'targetAmount', 'currentAmount', 'monthlyContribution', 'status', 'startDate', 'targetDate', 'createdAt'];
      const rows = goals.map(g => 
        headers.map(h => this.escapeCSV((g as any)[h])).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return goals;
  }

  /**
   * Export habits with check-ins
   */
  async exportHabits(userId: string, format: 'json' | 'csv' = 'json', days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        checkIns: {
          where: { date: { gte: since } },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Return two CSV files as JSON object
      const habitsCSV = [
        'id,name,description,frequency,targetCount,currentStreak,longestStreak,isActive',
        ...habits.map(h => [
          h.id, h.name, h.description || '', h.frequency, h.targetCount,
          h.currentStreak, h.longestStreak, h.isActive
        ].map(v => this.escapeCSV(v)).join(','))
      ].join('\n');

      const checkInsCSV = [
        'habitId,habitName,date,completed,quantity,notes',
        ...habits.flatMap(h => 
          h.checkIns.map(c => [
            c.habitId, h.name, c.date.toISOString().split('T')[0],
            c.completed, c.quantity || '', c.notes || ''
          ].map(v => this.escapeCSV(v)).join(','))
        )
      ].join('\n');

      return { habits: habitsCSV, checkIns: checkInsCSV };
    }

    return habits;
  }

  /**
   * Export budgets
   */
  async exportBudgets(userId: string, year: number, format: 'json' | 'csv' = 'json') {
    const budgets = await prisma.budget.findMany({
      where: { userId, year },
      include: { items: true },
      orderBy: [{ month: 'asc' }],
    });

    if (format === 'csv') {
      const rows = ['month,category,planned,actual,remaining'];
      budgets.forEach(b => {
        b.items.forEach(i => {
          rows.push([b.month, i.category, i.planned, i.actual, i.planned - i.actual].join(','));
        });
      });
      return rows.join('\n');
    }

    return budgets;
  }

  /**
   * Get export summary (file sizes, record counts)
   */
  async getExportSummary(userId: string) {
    const [
      financialGoals,
      fitnessGoals,
      habits,
      checkIns,
      budgets,
      snapshots,
      achievements,
      journals,
    ] = await Promise.all([
      prisma.financialGoal.count({ where: { userId } }),
      prisma.fitnessGoal.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.habitCheckIn.count({ where: { habit: { userId } } }),
      prisma.budget.count({ where: { userId } }),
      prisma.progressSnapshot.count({ where: { userId } }),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId } }),
    ]);

    return {
      financialGoals,
      fitnessGoals,
      habits,
      habitCheckIns: checkIns,
      budgets,
      progressSnapshots: snapshots,
      achievements,
      journalEntries: journals,
      totalRecords: financialGoals + fitnessGoals + habits + checkIns + budgets + snapshots + achievements + journals,
    };
  }
}

export const exportService = new ExportService();
