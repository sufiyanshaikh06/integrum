import { Request, Response } from 'express';
import { studyPlanService } from '../services/studyplan.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateStudyPlanInput, UpdateStudyPlanInput } from '../schemas/studyplan.schema.js';

export const createStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: CreateStudyPlanInput = req.body;
  const plan = await studyPlanService.createStudyPlan(studentProfileId, data);
  ApiResponse.success(res, 'Study plan created successfully', plan, 201);
});

export const getStudyPlans = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const plans = await studyPlanService.getStudyPlans(studentProfileId);
  ApiResponse.success(res, 'Study plans retrieved successfully', plans);
});

export const getStudyPlanById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const plan = await studyPlanService.getStudyPlanById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Study plan retrieved successfully', plan);
});

export const updateStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: UpdateStudyPlanInput = req.body;
  const plan = await studyPlanService.updateStudyPlan(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Study plan updated successfully', plan);
});

export const deleteStudyPlan = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  await studyPlanService.deleteStudyPlan(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Study plan deleted successfully', null, 204);
});
