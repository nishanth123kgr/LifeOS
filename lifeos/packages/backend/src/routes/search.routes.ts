import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { searchService } from '../services/search.service.js';

const router = Router();

// Global search
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      q, 
      entities, 
      status, 
      dateFrom, 
      dateTo, 
      tags,
      limit, 
      offset,
      sortOrder,
    } = req.query;

    const results = await searchService.search(req.userId!, {
      query: q as string,
      entities: entities ? (entities as string).split(',') as any : undefined,
      status: status as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Quick search (for autocomplete)
router.get('/quick', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query;
    const results = await searchService.quickSearch(
      req.userId!,
      q as string,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Get recent items
router.get('/recent', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const results = await searchService.getRecent(req.userId!, limit);
    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// Filter financial goals
router.post('/filter/financial-goals', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, type, minAmount, maxAmount, dateFrom, dateTo } = req.body;
    
    const goals = await searchService.filterFinancialGoals(req.userId!, {
      status,
      type,
      minAmount,
      maxAmount,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

// Filter habits
router.post('/filter/habits', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { frequency, isActive, minStreak, isQuantity } = req.body;
    
    const habits = await searchService.filterHabits(req.userId!, {
      frequency,
      isActive,
      minStreak,
      isQuantity,
    });

    res.json({ habits });
  } catch (error) {
    next(error);
  }
});

export default router;
