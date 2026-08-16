import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view the analytics dashboard');
  }

  const dashboard = await analyticsService.getStudentDashboard(studentProfileId);
  
  ApiResponse.success(res, 'Analytics retrieved successfully', dashboard, HTTP_STATUS.OK);
});
