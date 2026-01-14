import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { UpdateProfileInput } from '../schemas/index.js';

export const getProfile = async (
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
        updatedAt: true,
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

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = req.body as UpdateProfileInput;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        country: true,
        currency: true,
        monthlyIncome: true,
        riskPreference: true,
        updatedAt: true,
      },
    });

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.user.delete({
      where: { id: req.userId },
    });

    res.json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
