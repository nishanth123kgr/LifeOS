import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../src/lib/prisma', () => ({
  default: {
    financialGoal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from '../../src/lib/prisma';
import { FinancialGoalService } from '../../src/services/financialGoal.service';

describe('FinancialGoalService', () => {
  let service: FinancialGoalService;
  const userId = 'user-123';

  beforeEach(() => {
    service = new FinancialGoalService();
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all goals with progress calculated', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          userId,
          name: 'Emergency Fund',
          type: 'EMERGENCY_FUND',
          targetAmount: 100000,
          currentAmount: 50000,
          status: 'NEEDS_FOCUS',
          isArchived: false,
          createdAt: new Date(),
        },
        {
          id: 'goal-2',
          userId,
          name: 'Car Fund',
          type: 'CAR_FUND',
          targetAmount: 500000,
          currentAmount: 400000,
          status: 'ON_TRACK',
          isArchived: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue(mockGoals as any);

      const result = await service.getAll(userId);

      expect(result).toHaveLength(2);
      expect(result[0].progress).toBe(50);
      expect(result[1].progress).toBe(80);
    });

    it('should filter by status when provided', async () => {
      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([]);

      await service.getAll(userId, { status: 'ON_TRACK' });

      expect(prisma.financialGoal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ON_TRACK',
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a goal with calculated status', async () => {
      const mockGoal = {
        id: 'new-goal',
        userId,
        name: 'New Goal',
        type: 'CUSTOM',
        targetAmount: 100000,
        currentAmount: 80000,
        monthlyContribution: 5000,
        startDate: new Date(),
        targetDate: new Date(),
        status: 'ON_TRACK',
        notes: null,
        isArchived: false,
        isPaused: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.financialGoal.create).mockResolvedValue(mockGoal as any);

      const result = await service.create({
        userId,
        name: 'New Goal',
        type: 'CUSTOM',
        targetAmount: 100000,
        currentAmount: 80000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
      });

      expect(result.progress).toBe(80);
      expect(prisma.financialGoal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Goal',
            status: 'ON_TRACK', // 80% progress = ON_TRACK
          }),
        })
      );
    });
  });

  describe('getSummary', () => {
    it('should return correct summary statistics', async () => {
      const mockGoals = [
        { targetAmount: 100000, currentAmount: 50000, status: 'NEEDS_FOCUS', isArchived: false, isPaused: false },
        { targetAmount: 200000, currentAmount: 180000, status: 'ON_TRACK', isArchived: false, isPaused: false },
        { targetAmount: 50000, currentAmount: 10000, status: 'BEHIND', isArchived: false, isPaused: false },
      ];

      vi.mocked(prisma.financialGoal.findMany).mockResolvedValue(mockGoals as any);

      const result = await service.getSummary(userId);

      expect(result.totalGoals).toBe(3);
      expect(result.totalTarget).toBe(350000);
      expect(result.totalSaved).toBe(240000);
      expect(result.goalsByStatus.onTrack).toBe(1);
      expect(result.goalsByStatus.needsFocus).toBe(1);
      expect(result.goalsByStatus.behind).toBe(1);
    });
  });
});
