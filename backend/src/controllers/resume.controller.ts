import { Request, Response } from 'express';
import { resumeService } from '../services/resume.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateResumeInput, UpdateResumeInput } from '../schemas/resume.schema.js';

export const createResume = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can create resumes');
  }

  const data: CreateResumeInput = req.body;
  const resume = await resumeService.createResume(studentProfileId, data);
  
  ApiResponse.success(res, 'Resume created successfully', resume, HTTP_STATUS.CREATED);
});

export const getResumes = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view resumes');
  }

  const resumes = await resumeService.getResumes(studentProfileId);
  
  ApiResponse.success(res, 'Resumes retrieved successfully', resumes, HTTP_STATUS.OK);
});

export const getResumeById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view resumes');
  }

  const resumeId = req.params.id as string;
  const resume = await resumeService.getResumeById(studentProfileId, resumeId);
  
  ApiResponse.success(res, 'Resume retrieved successfully', resume, HTTP_STATUS.OK);
});

export const updateResume = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can update resumes');
  }

  const resumeId = req.params.id as string;
  const data: UpdateResumeInput = req.body;
  
  const updatedResume = await resumeService.updateResume(studentProfileId, resumeId, data);
  
  ApiResponse.success(res, 'Resume updated successfully', updatedResume, HTTP_STATUS.OK);
});

export const deleteResume = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can delete resumes');
  }

  const resumeId = req.params.id as string;
  await resumeService.deleteResume(studentProfileId, resumeId);
  
  ApiResponse.success(res, 'Resume deleted successfully', null, HTTP_STATUS.OK);
});
