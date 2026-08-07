import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export const healthCheck = async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  return ApiResponse.success(res, 'Server is healthy', {
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
  });
};
