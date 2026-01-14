import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma client
vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    financialGoal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    fitnessGoal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lifeSystem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
    $disconnect: vi.fn(),
  },
}));

beforeAll(() => {
  console.log('Test suite starting...');
});

afterAll(() => {
  console.log('Test suite complete.');
});
