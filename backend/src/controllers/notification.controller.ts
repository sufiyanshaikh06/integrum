import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw ApiError.unauthorized('Authentication required');
  }

  const notifications = await notificationService.getNotifications(userId);
  ApiResponse.success(res, 'Notifications retrieved successfully', notifications, HTTP_STATUS.OK);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw ApiError.unauthorized('Authentication required');
  }

  const notificationId = req.params.id as string;
  const updated = await notificationService.markAsRead(userId, notificationId);
  ApiResponse.success(res, 'Notification marked as read', updated, HTTP_STATUS.OK);
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw ApiError.unauthorized('Authentication required');
  }

  const result = await notificationService.markAllAsRead(userId);
  ApiResponse.success(res, 'All notifications marked as read', result, HTTP_STATUS.OK);
});
