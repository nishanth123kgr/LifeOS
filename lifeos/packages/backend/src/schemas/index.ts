import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    age: z.number().min(13).max(120).optional(),
    country: z.string().optional(),
    currency: z.enum(['USD', 'INR', 'EUR', 'GBP']).optional(),
    monthlyIncome: z.number().min(0).optional(),
    riskPreference: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  }),
});

export const financialGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum([
      'EMERGENCY_FUND',
      'MARRIAGE_FUND',
      'CAR_FUND',
      'HOME_DOWN_PAYMENT',
      'INVESTMENTS',
      'RETIREMENT',
      'EDUCATION',
      'VACATION',
      'CUSTOM',
    ]),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional(),
    monthlyContribution: z.number().min(0).optional(),
    startDate: z.string().datetime().or(z.string()),
    targetDate: z.string().datetime().or(z.string()),
    notes: z.string().optional(),
  }),
});

export const fitnessGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    metricType: z.enum([
      'WEIGHT',
      'BODY_FAT',
      'STEPS',
      'STRENGTH',
      'CARDIO',
      'FLEXIBILITY',
      'CUSTOM',
    ]),
    startValue: z.number(),
    currentValue: z.number(),
    targetValue: z.number(),
    unit: z.string(),
    startDate: z.string(),
    targetDate: z.string(),
    notes: z.string().optional(),
  }),
});

export const habitSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS', 'CUSTOM']),
    targetCount: z.number().min(1).optional(),
  }),
});

export const budgetSchema = z.object({
  body: z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    income: z.number().min(0),
    items: z.array(z.object({
      category: z.enum([
        'RENT',
        'FOOD',
        'TRANSPORT',
        'SUBSCRIPTIONS',
        'UTILITIES',
        'HEALTHCARE',
        'ENTERTAINMENT',
        'SHOPPING',
        'MISCELLANEOUS',
        'FINANCIAL_GOAL',
      ]),
      planned: z.number().min(0),
      actual: z.number().min(0).optional(),
      notes: z.string().optional(),
      linkedGoalId: z.string().uuid().optional(),
    })).optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type FinancialGoalInput = z.infer<typeof financialGoalSchema>['body'];
export type FitnessGoalInput = z.infer<typeof fitnessGoalSchema>['body'];
export type HabitInput = z.infer<typeof habitSchema>['body'];
export type BudgetInput = z.infer<typeof budgetSchema>['body'];
