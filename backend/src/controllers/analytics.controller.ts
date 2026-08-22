import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ActivityQuery } from '../schemas/analytics.schema.js';

function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.forbidden('Only students can view analytics');
  return id;
}

// Existing: GET /analytics/dashboard
export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const dashboard = await analyticsService.getStudentDashboard(studentProfileId);
  ApiResponse.success(res, 'Analytics retrieved successfully', dashboard, HTTP_STATUS.OK);
});

// AN-1: GET /analytics/skills-progress
export const getSkillsProgress = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data = await analyticsService.getSkillsProgress(studentProfileId);
  ApiResponse.success(res, 'Skills progress retrieved', data, HTTP_STATUS.OK);
});

// AN-2: GET /analytics/placement-readiness
export const getPlacementReadiness = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data = await analyticsService.getPlacementReadiness(studentProfileId);
  ApiResponse.success(res, 'Placement readiness calculated', data, HTTP_STATUS.OK);
});

// AN-3: GET /analytics/activity
export const getActivityBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const { period, startDate, endDate } = req.query as unknown as ActivityQuery;
  const data = await analyticsService.getActivityBreakdown(
    studentProfileId,
    period ?? 'weekly',
    startDate,
    endDate,
  );
  ApiResponse.success(res, 'Activity breakdown retrieved', data, HTTP_STATUS.OK);
});
