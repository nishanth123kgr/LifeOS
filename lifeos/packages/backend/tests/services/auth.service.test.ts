import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock dependencies before importing service
vi.mock('../../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from '../../src/lib/prisma';
import { AuthService } from '../../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        currency: 'INR',
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should throw error if email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      } as any);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        currency: 'INR',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
      } as any);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
