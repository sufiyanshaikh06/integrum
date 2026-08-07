import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('User does not have required permissions'));
    }

    next();
  };
};
