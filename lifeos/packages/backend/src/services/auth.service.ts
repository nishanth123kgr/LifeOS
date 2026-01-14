import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    currency: string;
    createdAt?: Date;
  };
  token: string;
}

export class AuthService {
  /**
   * Generate JWT token for a user
   */
  private generateToken(userId: string): string {
    const options: SignOptions = {
      expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    };
    return jwt.sign({ userId }, config.jwtSecret, options);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResult> {
    logger.info({ email: data.email }, 'Attempting user registration');

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      logger.warn({ email: data.email }, 'Registration failed - email already registered');
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        createdAt: true,
      },
    });

    logger.info({ userId: user.id }, 'User registered successfully');

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Login a user
   */
  async login(data: LoginDTO): Promise<AuthResult> {
    logger.debug({ email: data.email }, 'Attempting user login');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      logger.warn({ email: data.email }, 'Login failed - user not found');
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      logger.warn({ email: data.email }, 'Login failed - invalid password');
      throw new Error('Invalid email or password');
    }

    logger.info({ userId: user.id }, 'User logged in successfully');

    // Generate token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        country: true,
        currency: true,
        monthlyIncome: true,
        riskPreference: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      age?: number;
      country?: string;
      currency?: string;
      monthlyIncome?: number;
      riskPreference?: string;
    }
  ) {
    logger.info({ userId, updates: Object.keys(data) }, 'Updating user profile');

    const user = await prisma.user.update({
      where: { id: userId },
      data: data as any,
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        country: true,
        currency: true,
        monthlyIncome: true,
        riskPreference: true,
        createdAt: true,
      },
    });

    return user;
  }
}

export const authService = new AuthService();
