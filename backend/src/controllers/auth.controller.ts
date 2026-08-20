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
    ApiResponse.success(res, 'User registered successfully. Check your email to verify your account.', user, HTTP_STATUS.CREATED);
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
    if (req.user) {
      await authService.logout(req.user.id);
    }
    clearRefreshCookie(res);
    ApiResponse.success(res, 'Logout successful', null, HTTP_STATUS.OK);
  }),

  // I-1: Forgot Password
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    ApiResponse.success(res, result.message, null, HTTP_STATUS.OK);
  }),

  // I-1: Reset Password
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    ApiResponse.success(res, result.message, null, HTTP_STATUS.OK);
  }),

  // I-2: Verify Email
  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    ApiResponse.success(res, result.message, null, HTTP_STATUS.OK);
  }),

  // I-2: Resend Verification Email
  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');
    const result = await authService.resendVerificationEmail(req.user.id);
    ApiResponse.success(res, result.message, null, HTTP_STATUS.OK);
  }),
};
