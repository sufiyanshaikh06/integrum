import { Request, Response, NextFunction } from 'express';
import { adminPlatformService } from '../services/admin/platform.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { verifyAccessToken } from '../utils/jwt.js';

// Paths that bypass maintenance mode entirely
const BYPASS_PATHS = [
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/admin',
];

export async function maintenanceMode(req: Request, res: Response, next: NextFunction) {
  try {
    const isMaintenance = await adminPlatformService.getSettingValue('MAINTENANCE_MODE');
    if (!isMaintenance) {
      return next();
    }

    // 1. Check path bypasses
    const isBypassed = BYPASS_PATHS.some((path) => req.originalUrl.startsWith(path));
    if (isBypassed) {
      return next();
    }

    // 2. Check if bearer token belongs to an ADMIN user
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          if (payload.role === 'ADMIN') {
            return next();
          }
        } catch {
          // Token invalid; fall through to maintenance block
        }
      }
    }

    // 3. Block all other traffic with 503 Service Unavailable
    return ApiResponse.error(
      res,
      'Integrum platform is currently undergoing scheduled maintenance. Please check back shortly.',
      [],
      HTTP_STATUS.SERVICE_UNAVAILABLE || 503
    );
  } catch (error) {
    // If setting check fails, fail open to avoid accidental complete lockouts
    next();
  }
}
