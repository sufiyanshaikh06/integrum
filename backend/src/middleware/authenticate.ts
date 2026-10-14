import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

// Extend the Express Request interface with typed user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sessionId: string;
        id: string;
        email: string;
        role: 'STUDENT' | 'ADMIN';
        isActive: boolean;
        studentProfile?: { id: string; courseId?: string | null } | null;
        adminProfile?: { id: string; permissionsLevel: number; departmentId?: string | null } | null;
      };
    }
  }
}

function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code.startsWith('P10') || error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1008' || error.code === 'P1017') {
      return true;
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  const msg = (error as Error).message || '';
  const code = (error as { code?: string }).code;
  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    /connection|database|connect|timeout/i.test(msg)
  ) {
    return true;
  }

  return false;
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

  // 1. JWT verification step isolated
  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (_jwtError: unknown) {
    throw ApiError.unauthorized('Access token is invalid or expired');
  }

  // 2. Database lookups isolated
  let user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    isActive: boolean;
    authVersion: number;
    studentProfile: { id: string; courseId: string | null } | null;
    adminProfile: { id: string; permissionsLevel: number; departmentId: string | null } | null;
  } | null;
  let session: { id: string } | null;

  try {
    user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        authVersion: true,
        studentProfile: {
          select: { id: true, courseId: true },
        },
        adminProfile: {
          select: { id: true, permissionsLevel: true, departmentId: true },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('User account is inactive');
    }

    session = await prisma.authSession.findFirst({
      where: {
        id: payload.sid!,
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    if (isPrismaConnectionError(error)) {
      throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'Database service is temporarily unavailable');
    }
    throw ApiError.internal('Internal server error during authentication');
  }

  if (!session || payload.version !== user.authVersion) {
    throw ApiError.unauthorized('Session revoked');
  }

  req.user = { ...user, sessionId: session.id };
  next();
});
