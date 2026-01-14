import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { goalTemplateService } from '../services/goalTemplate.service.js';
import { TemplateCategory } from '@prisma/client';

const router = Router();

// Get all templates
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as TemplateCategory | undefined;
    const templates = await goalTemplateService.getAll(req.userId, category);
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Get predefined templates
router.get('/predefined', async (req, res, next) => {
  try {
    const templates = goalTemplateService.getPredefinedTemplates();
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Get popular templates
router.get('/popular', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const popular = await goalTemplateService.getPopular(limit);
    res.json(popular);
  } catch (error) {
    next(error);
  }
});

// Get templates by category
router.get('/category/:category', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const category = req.params.category as TemplateCategory;
    const templates = await goalTemplateService.getByCategory(category, req.userId);
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Get user's custom templates
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await goalTemplateService.getUserTemplates(req.userId!);
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Search templates
router.get('/search', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const results = await goalTemplateService.search(
      q as string,
      category as TemplateCategory | undefined
    );
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get('/:id', async (req, res, next) => {
  try {
    const template = await goalTemplateService.getById(req.params.id);
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Create custom template
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await goalTemplateService.create(req.userId!, req.body);
    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
});

// Use a template (returns goal data to create)
router.post('/:id/use', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, target, targetDate } = req.body;
    
    const goalData = await goalTemplateService.useTemplate(
      req.userId!,
      req.params.id,
      {
        name,
        target,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      }
    );

    res.json({ goalData });
  } catch (error) {
    next(error);
  }
});

// Use a predefined template
router.post('/predefined/use', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateName, name, target, targetDate } = req.body;
    
    const goalData = goalTemplateService.usePredefinedTemplate(
      templateName,
      {
        name,
        target,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      }
    );

    res.json({ goalData });
  } catch (error) {
    next(error);
  }
});

// Update custom template
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await goalTemplateService.update(req.params.id, req.userId!, req.body);
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Delete custom template
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await goalTemplateService.delete(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
