import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { goalTemplateService } from '../services/goalTemplate.service.js';
import { financialGoalService } from '../services/financialGoal.service.js';
import { habitService } from '../services/habit.service.js';
import prisma from '../lib/prisma.js';
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

// Use a template (creates goal based on template category)
router.post('/:id/use', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, target, targetDate } = req.body;
    const templateId = req.params.id;
    const userId = req.userId!;
    
    let template: {
      name: string;
      category: string;
      type: string;
      defaultTarget?: number | null;
      defaultDuration?: number | null;
      description?: string | null;
    };
    
    // Check if it's a predefined template (id starts with "predefined-")
    if (templateId.startsWith('predefined-')) {
      const index = parseInt(templateId.replace('predefined-', ''), 10);
      const predefinedTemplates = goalTemplateService.getPredefinedTemplates();
      
      if (index < 0 || index >= predefinedTemplates.length) {
        return res.status(404).json({ status: 'error', message: 'Template not found' });
      }
      
      template = predefinedTemplates[index];
    } else {
      const dbTemplate = await goalTemplateService.getById(templateId);
      if (!dbTemplate) {
        return res.status(404).json({ status: 'error', message: 'Template not found' });
      }
      template = {
        name: dbTemplate.name,
        category: dbTemplate.category,
        type: dbTemplate.type,
        defaultTarget: dbTemplate.defaultTarget,
        defaultDuration: dbTemplate.defaultDuration,
        description: dbTemplate.description,
      };
    }

    // Calculate dates
    const startDate = new Date();
    const durationDays = template.defaultDuration || 365;
    const calculatedTargetDate = targetDate 
      ? new Date(targetDate) 
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    
    const targetAmount = target || template.defaultTarget || 100000;
    
    let createdGoal;
    
    // Create goal based on category
    if (template.category === 'FINANCIAL') {
      createdGoal = await financialGoalService.create({
        userId,
        name: name || template.name,
        type: template.type || 'SAVINGS',
        targetAmount,
        currentAmount: 0,
        monthlyContribution: Math.round(targetAmount / 12),
        startDate: startDate.toISOString(),
        targetDate: calculatedTargetDate.toISOString(),
        notes: template.description || `Created from ${template.name} template`,
      });
    } else if (template.category === 'FITNESS') {
      const targetValue = target || template.defaultTarget || 10;
      createdGoal = await prisma.fitnessGoal.create({
        data: {
          userId,
          name: name || template.name,
          metricType: (template.type as any) || 'WEIGHT',
          targetValue,
          currentValue: 0,
          startValue: 0,
          unit: template.type === 'WEIGHT' ? 'kg' : template.type === 'CARDIO' ? 'km' : 'reps',
          startDate,
          targetDate: calculatedTargetDate,
          notes: template.description || `Created from ${template.name} template`,
        },
      });
    } else if (template.category === 'HABIT') {
      createdGoal = await habitService.create(
        userId,
        {
          name: name || template.name,
          description: template.description || `Created from ${template.name} template`,
          frequency: 'DAILY',
          targetCount: target || template.defaultTarget || 1,
        }
      );
    } else {
      return res.status(400).json({ status: 'error', message: 'Unknown template category' });
    }

    res.json({ 
      status: 'success',
      message: `Created ${template.category.toLowerCase()} goal from template`,
      goal: createdGoal 
    });
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
