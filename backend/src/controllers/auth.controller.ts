import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { authService } from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ApiError } from '../utils/ApiError.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);
    ApiResponse.success(res, 'User registered successfully', user, HTTP_STATUS.CREATED);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    setRefreshCookie(res, refreshToken);

    ApiResponse.success(res, 'Login successful', { user, accessToken }, HTTP_STATUS.OK);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const currentRefreshToken = req.cookies.refreshToken;
    if (!currentRefreshToken) {
      throw ApiError.unauthorized('Refresh token missing');
    }

    const { accessToken, refreshToken } = await authService.refresh(currentRefreshToken);

    setRefreshCookie(res, refreshToken);

    ApiResponse.success(res, 'Token refreshed successfully', { accessToken }, HTTP_STATUS.OK);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    // We assume the authenticate middleware attaches req.user
    if (req.user) {
      await authService.logout(req.user.id);
    }
    
    clearRefreshCookie(res);
    ApiResponse.success(res, 'Logout successful', null, HTTP_STATUS.OK);
  }),
};
