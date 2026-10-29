import { Request, Response, NextFunction } from 'express';
import { Prisma, Role } from '@prisma/client';
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
        role: Role;
        isActive: boolean;
        studentProfile?: { id: string; courseId?: string | null } | null;
        adminProfile?: { id: string; permissionsLevel: number; departmentId?: string | null } | null;
      };
    }
  }
}

function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  // 1. Prisma Known Request Errors: only transient connectivity / pool exhaustion codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1002: The database server was reached but timed out
    // P1008: Operations timed out
    // P1017: Server has closed the connection
    return (
      error.code === 'P1001' ||
      error.code === 'P1002' ||
      error.code === 'P1008' ||
      error.code === 'P1017'
    );
  }

  // 2. Engine Panics are internal crashes, NOT temporary outages: return false (maps to sanitized 500)
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return false;
  }

  // 3. Prisma Client Initialization Error: only transient network failure, not invalid config/credentials
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const code = (error as { errorCode?: string }).errorCode;
    if (code === 'P1001' || code === 'P1002' || code === 'P1008' || code === 'P1017') return true;
    const msg = ((error as Error).message || '').toLowerCase();
    return msg.includes("can't reach database server") || msg.includes('timeout') || msg.includes('econnrefused');
  }

  // 4. Low-level system network errors
  const code = (error as { code?: string }).code;
  const msg = ((error as Error).message || '').toLowerCase();
  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ENOTFOUND' ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('epipe') ||
    msg.includes('enotfound')
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
    role: Role;
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
