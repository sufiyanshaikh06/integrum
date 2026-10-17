import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { semesterService } from '../services/semester.service.js';
import { ApiError } from '../utils/ApiError.js';

export const semesterController = {
  listAcademicTerms: asyncHandler(async (req: Request, res: Response) => {
    const result = await semesterService.listAcademicTerms(Number(req.query.page), Number(req.query.limit));
    ApiResponse.success(res, 'Academic terms retrieved successfully', result, HTTP_STATUS.OK);
  }),
  createSemester: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can create semesters');

    const semester = await semesterService.createSemester(profileId, req.body);
    ApiResponse.success(res, 'Semester created successfully', semester, HTTP_STATUS.CREATED);
  }),

  getSemesters: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view semesters');

    const semesters = await semesterService.getSemesters(profileId);
    ApiResponse.success(res, 'Semesters retrieved successfully', semesters, HTTP_STATUS.OK);
  }),

  getSemesterById: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view semesters');

    const semester = await semesterService.getSemesterById(profileId, req.params.id as string);
    ApiResponse.success(res, 'Semester retrieved successfully', semester, HTTP_STATUS.OK);
  }),

  updateSemester: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can update semesters');

    const semester = await semesterService.updateSemester(profileId, req.params.id as string, req.body);
    ApiResponse.success(res, 'Semester updated successfully', semester, HTTP_STATUS.OK);
  }),

  deleteSemester: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can delete semesters');

    await semesterService.deleteSemester(profileId, req.params.id as string);
    ApiResponse.success(res, 'Semester deleted successfully', null, HTTP_STATUS.OK);
  }),
};
