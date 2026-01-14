import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { exportService } from '../services/export.service.js';

const router = Router();

// Get export summary (record counts)
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await exportService.getExportSummary(req.userId!);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

// Export all user data
router.post('/all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      format = 'json',
      includeFinancialGoals,
      includeFitnessGoals,
      includeHabits,
      includeSystems,
      includeBudgets,
      includeSnapshots,
      includeAchievements,
      includeJournals,
      dateFrom,
      dateTo,
    } = req.body;

    const data = await exportService.exportUserData(req.userId!, {
      format,
      includeFinancialGoals,
      includeFitnessGoals,
      includeHabits,
      includeSystems,
      includeBudgets,
      includeSnapshots,
      includeAchievements,
      includeJournals,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'application/json');
      res.json({ files: data });
    } else {
      res.json({ data });
    }
  } catch (error) {
    next(error);
  }
});

// Export financial goals
router.get('/financial-goals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const data = await exportService.exportFinancialGoals(req.userId!, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="financial_goals.csv"');
      res.send(data);
    } else {
      res.json({ goals: data });
    }
  } catch (error) {
    next(error);
  }
});

// Export habits
router.get('/habits', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const days = parseInt(req.query.days as string) || 30;
    const data = await exportService.exportHabits(req.userId!, format, days);
    
    if (format === 'csv') {
      res.json({ files: data });
    } else {
      res.json({ habits: data });
    }
  } catch (error) {
    next(error);
  }
});

// Export budgets for a year
router.get('/budgets/:year', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.params.year);
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const data = await exportService.exportBudgets(req.userId!, year, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="budgets_${year}.csv"`);
      res.send(data);
    } else {
      res.json({ budgets: data });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
