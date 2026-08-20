import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { userService } from '../services/user.service.js';
import { ApiError } from '../utils/ApiError.js';

export const userController = {
  // GET /users/me
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.id);
    ApiResponse.success(res, 'User profile retrieved successfully', user);
  }),

  // PATCH /users/me (I-3)
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');
    const updated = await userService.updateProfile(req.user.id, req.body);
    ApiResponse.success(res, 'Profile updated successfully', updated);
  }),
};
