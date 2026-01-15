import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { journalService } from '../services/journal.service.js';

const router = Router();

// Get all journal entries
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, search, mood, tags, dateFrom, dateTo } = req.query;
    
    const result = await journalService.getAll(req.userId!, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      search: search as string,
      mood: mood ? parseInt(mood as string) : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get mood analytics
router.get('/analytics/mood', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await journalService.getMoodAnalytics(req.userId!, days);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

// Get tag analytics
router.get('/analytics/tags', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await journalService.getTagAnalytics(req.userId!, days);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

// Get writing streak
router.get('/streak', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const streak = await journalService.getWritingStreak(req.userId!);
    res.json({ streak });
  } catch (error) {
    next(error);
  }
});

// Search journal entries
router.get('/search', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, limit } = req.query;
    const entries = await journalService.search(req.userId!, q as string, limit ? parseInt(limit as string) : 20);
    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

// Get entry by date
router.get('/date/:date', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalService.getByDate(req.userId!, new Date(req.params.date));
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

// Get entry by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entry = await journalService.getById(req.params.id, req.userId!);
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

// Create entry
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, title, date, mood, energy, gratitude, tags } = req.body;
    
    const entry = await journalService.create(req.userId!, {
      content,
      title,
      date: date ? new Date(date) : undefined,
      mood,
      energy,
      gratitude,
      tags,
    });

    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

// Update entry
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, title, mood, energy, gratitude, tags } = req.body;
    
    const entry = await journalService.update(req.params.id, req.userId!, {
      content,
      title,
      mood,
      energy,
      gratitude,
      tags,
    });

    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

// Delete entry
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await journalService.delete(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
