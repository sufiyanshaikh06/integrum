import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { subjectService } from '../services/subject.service.js';
import { ApiError } from '../utils/ApiError.js';

export const subjectController = {
  createSubject: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can create subjects');

    const subject = await subjectService.createSubject(profileId, req.body);
    ApiResponse.success(res, 'Subject created successfully', subject, HTTP_STATUS.CREATED);
  }),

  getSubjects: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view subjects');

    const semesterId = req.query.semesterId as string | undefined;
    const subjects = await subjectService.getSubjects(profileId, semesterId);
    ApiResponse.success(res, 'Subjects retrieved successfully', subjects, HTTP_STATUS.OK);
  }),

  getSubjectById: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view subjects');

    const subject = await subjectService.getSubjectById(profileId, req.params.id);
    ApiResponse.success(res, 'Subject retrieved successfully', subject, HTTP_STATUS.OK);
  }),

  updateSubject: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can update subjects');

    const subject = await subjectService.updateSubject(profileId, req.params.id, req.body);
    ApiResponse.success(res, 'Subject updated successfully', subject, HTTP_STATUS.OK);
  }),

  deleteSubject: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can delete subjects');

    await subjectService.deleteSubject(profileId, req.params.id);
    ApiResponse.success(res, 'Subject deleted successfully', null, HTTP_STATUS.OK);
  }),
};
