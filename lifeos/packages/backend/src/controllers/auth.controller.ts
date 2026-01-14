import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { RegisterInput, LoginInput } from '../schemas/index.js';

const generateToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  };
  return jwt.sign({ userId }, config.jwtSecret, options);
};

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body as RegisterInput;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as LoginInput;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
