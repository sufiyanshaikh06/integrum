import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Extend the Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw ApiError.unauthorized('Access token is missing');
  }

  try {
    const payload = verifyAccessToken(token);

    // Verify user actually exists in the database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        studentProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    throw ApiError.unauthorized('Access token is invalid or expired');
  }
});
