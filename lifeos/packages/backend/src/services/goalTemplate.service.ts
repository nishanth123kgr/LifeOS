import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';
import { TemplateCategory } from '@prisma/client';

// Predefined goal templates
const PREDEFINED_TEMPLATES = [
  // Finance Templates
  {
    name: 'Emergency Fund',
    description: 'Build an emergency fund covering 6 months of expenses',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'EMERGENCY_FUND',
    defaultTarget: 200000,
    defaultDuration: 365,
    icon: '🛡️',
  },
  {
    name: 'Vacation Fund',
    description: 'Save for your dream vacation',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'VACATION',
    defaultTarget: 100000,
    defaultDuration: 180,
    icon: '✈️',
  },
  {
    name: 'Home Down Payment',
    description: 'Save for your first home down payment',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'HOME_DOWN_PAYMENT',
    defaultTarget: 1000000,
    defaultDuration: 730,
    icon: '🏠',
  },
  {
    name: 'Car Purchase',
    description: 'Save for a new or used car purchase',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'CAR_FUND',
    defaultTarget: 500000,
    defaultDuration: 365,
    icon: '🚗',
  },
  {
    name: 'Investment Portfolio',
    description: 'Build your investment portfolio',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'INVESTMENTS',
    defaultTarget: 100000,
    defaultDuration: 365,
    icon: '📈',
  },
  {
    name: 'Marriage Fund',
    description: 'Save for your wedding expenses',
    category: 'FINANCIAL' as TemplateCategory,
    type: 'MARRIAGE_FUND',
    defaultTarget: 500000,
    defaultDuration: 730,
    icon: '💒',
  },

  // Fitness Templates
  {
    name: 'Lose 10 kg',
    description: 'Healthy weight loss of 10 kg',
    category: 'FITNESS' as TemplateCategory,
    type: 'WEIGHT',
    defaultTarget: 10,
    defaultDuration: 120,
    icon: '⚖️',
  },
  {
    name: 'Run 5K',
    description: 'Train to run a 5K race',
    category: 'FITNESS' as TemplateCategory,
    type: 'CARDIO',
    defaultTarget: 5,
    defaultDuration: 60,
    icon: '🏃',
  },
  {
    name: 'Build Muscle',
    description: 'Gain muscle mass through strength training',
    category: 'FITNESS' as TemplateCategory,
    type: 'STRENGTH',
    defaultTarget: 5,
    defaultDuration: 180,
    icon: '💪',
  },
  {
    name: 'Improve Flexibility',
    description: 'Increase flexibility through daily stretching',
    category: 'FITNESS' as TemplateCategory,
    type: 'FLEXIBILITY',
    defaultTarget: 30,
    defaultDuration: 90,
    icon: '🧘',
  },
  {
    name: '10,000 Steps Daily',
    description: 'Walk 10,000 steps every day',
    category: 'FITNESS' as TemplateCategory,
    type: 'STEPS',
    defaultTarget: 10000,
    defaultDuration: 30,
    icon: '👟',
  },

  // Habit Templates
  {
    name: 'Morning Routine',
    description: 'Establish a productive morning routine',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 1,
    defaultDuration: 30,
    icon: '🌅',
  },
  {
    name: 'Daily Meditation',
    description: 'Build a daily meditation practice',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 1,
    defaultDuration: 30,
    icon: '🧘',
  },
  {
    name: 'Read 30 Minutes Daily',
    description: 'Develop a daily reading habit',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 30,
    defaultDuration: 30,
    icon: '📚',
  },
  {
    name: 'Drink 8 Glasses Water',
    description: 'Stay hydrated throughout the day',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 8,
    defaultDuration: 14,
    icon: '💧',
  },
  {
    name: 'No Social Media',
    description: 'Take a break from social media',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 1,
    defaultDuration: 30,
    icon: '📵',
  },
  {
    name: 'Sleep by 11 PM',
    description: 'Improve sleep schedule',
    category: 'HABIT' as TemplateCategory,
    type: 'DAILY',
    defaultTarget: 1,
    defaultDuration: 21,
    icon: '😴',
  },
];

export class GoalTemplateService {
  /**
   * Get all templates (predefined + user-created + public)
   */
  async getAll(userId?: string, category?: TemplateCategory) {
    const dbTemplates = await prisma.goalTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(userId ? [{ createdBy: userId }] : []),
        ],
        ...(category && { category }),
      },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });

    // Combine with predefined templates
    const predefined = category 
      ? PREDEFINED_TEMPLATES.filter(t => t.category === category)
      : PREDEFINED_TEMPLATES;

    // Merge, avoiding duplicates
    const dbNames = new Set(dbTemplates.map(t => t.name.toLowerCase()));
    const uniquePredefined = predefined.filter(t => !dbNames.has(t.name.toLowerCase()));

    return {
      predefined: uniquePredefined,
      custom: dbTemplates,
    };
  }

  /**
   * Get templates by category
   */
  async getByCategory(category: TemplateCategory, userId?: string) {
    return this.getAll(userId, category);
  }

  /**
   * Get a specific template by ID
   */
  async getById(id: string) {
    return prisma.goalTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * Create a custom template
   */
  async create(
    userId: string,
    data: {
      name: string;
      description: string;
      category: TemplateCategory;
      type: string;
      defaultTarget?: number;
      defaultDuration?: number;
      icon?: string;
      isPublic?: boolean;
    }
  ) {
    const template = await prisma.goalTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        defaultTarget: data.defaultTarget,
        defaultDuration: data.defaultDuration,
        icon: data.icon,
        isPublic: data.isPublic ?? false,
        createdBy: userId,
      },
    });

    logger.info({ userId, templateId: template.id }, 'Custom template created');
    return template;
  }

  /**
   * Use a template to create a goal
   */
  async useTemplate(
    userId: string,
    templateId: string,
    customizations?: {
      name?: string;
      target?: number;
      targetDate?: Date;
    }
  ) {
    const template = await prisma.goalTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    await prisma.goalTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    // Calculate target date if duration provided
    const targetDate = customizations?.targetDate || 
      (template.defaultDuration 
        ? new Date(Date.now() + template.defaultDuration * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    // Return the data to create the goal
    return {
      name: customizations?.name || template.name,
      target: customizations?.target || template.defaultTarget || 0,
      targetDate,
      category: template.category,
      type: template.type,
      templateUsed: template.id,
    };
  }

  /**
   * Use a predefined template
   */
  usePredefinedTemplate(
    templateName: string,
    customizations?: {
      name?: string;
      target?: number;
      targetDate?: Date;
    }
  ) {
    const template = PREDEFINED_TEMPLATES.find(
      t => t.name.toLowerCase() === templateName.toLowerCase()
    );

    if (!template) {
      throw new Error('Predefined template not found');
    }

    const targetDate = customizations?.targetDate || 
      new Date(Date.now() + (template.defaultDuration || 365) * 24 * 60 * 60 * 1000);

    return {
      name: customizations?.name || template.name,
      target: customizations?.target || template.defaultTarget || 0,
      targetDate,
      category: template.category,
      type: template.type,
    };
  }

  /**
   * Get popular templates
   */
  async getPopular(limit = 10) {
    const popular = await prisma.goalTemplate.findMany({
      where: { isPublic: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
    });

    // Also include top predefined templates
    const topPredefined = PREDEFINED_TEMPLATES.slice(0, 5);

    return {
      fromDatabase: popular,
      predefined: topPredefined,
    };
  }

  /**
   * Get templates created by user
   */
  async getUserTemplates(userId: string) {
    return prisma.goalTemplate.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a custom template
   */
  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      defaultTarget?: number;
      defaultDuration?: number;
      icon?: string;
      isPublic?: boolean;
    }
  ) {
    const template = await prisma.goalTemplate.findFirst({
      where: { id, createdBy: userId },
    });

    if (!template) {
      throw new Error('Template not found or not owned by user');
    }

    return prisma.goalTemplate.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a custom template
   */
  async delete(id: string, userId: string) {
    const template = await prisma.goalTemplate.findFirst({
      where: { id, createdBy: userId },
    });

    if (!template) {
      throw new Error('Template not found or not owned by user');
    }

    await prisma.goalTemplate.delete({ where: { id } });
    logger.info({ templateId: id }, 'Template deleted');
  }

  /**
   * Get all predefined templates
   */
  getPredefinedTemplates() {
    return PREDEFINED_TEMPLATES;
  }

  /**
   * Search templates
   */
  async search(query: string, category?: TemplateCategory) {
    const dbResults = await prisma.goalTemplate.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        ...(category && { category }),
      },
      orderBy: { usageCount: 'desc' },
    });

    const predefinedResults = PREDEFINED_TEMPLATES.filter(t => {
      const matchesQuery = 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || t.category === category;
      return matchesQuery && matchesCategory;
    });

    return {
      custom: dbResults,
      predefined: predefinedResults,
    };
  }
}

export const goalTemplateService = new GoalTemplateService();
