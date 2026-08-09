import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { assignmentService } from '../services/assignment.service.js';
import { ApiError } from '../utils/ApiError.js';

export const assignmentController = {
  createAssignment: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can create assignments');

    const assignment = await assignmentService.createAssignment(profileId, req.body);
    ApiResponse.success(res, 'Assignment created successfully', assignment, HTTP_STATUS.CREATED);
  }),

  getAssignments: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view assignments');

    const subjectId = req.query.subjectId as string | undefined;
    const assignments = await assignmentService.getAssignments(profileId, subjectId);
    ApiResponse.success(res, 'Assignments retrieved successfully', assignments, HTTP_STATUS.OK);
  }),

  getAssignmentById: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view assignments');

    const assignment = await assignmentService.getAssignmentById(profileId, req.params.id);
    ApiResponse.success(res, 'Assignment retrieved successfully', assignment, HTTP_STATUS.OK);
  }),

  updateAssignment: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can update assignments');

    const assignment = await assignmentService.updateAssignment(profileId, req.params.id, req.body);
    ApiResponse.success(res, 'Assignment updated successfully', assignment, HTTP_STATUS.OK);
  }),

  deleteAssignment: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can delete assignments');

    await assignmentService.deleteAssignment(profileId, req.params.id);
    ApiResponse.success(res, 'Assignment deleted successfully', null, HTTP_STATUS.OK);
  }),
};
