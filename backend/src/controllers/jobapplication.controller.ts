import { Request, Response } from 'express';
import { jobApplicationService } from '../services/jobapplication.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateJobApplicationInput, UpdateJobApplicationInput } from '../schemas/jobapplication.schema.js';

export const createApplication = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can create job applications');
  }

  const data: CreateJobApplicationInput = req.body;
  const application = await jobApplicationService.createApplication(studentProfileId, data);
  
  ApiResponse.success(res, 'Job application created successfully', application, HTTP_STATUS.CREATED);
});

export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view job applications');
  }

  const applications = await jobApplicationService.getApplications(studentProfileId);
  
  ApiResponse.success(res, 'Job applications retrieved successfully', applications, HTTP_STATUS.OK);
});

export const getApplicationById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view job applications');
  }

  const applicationId = req.params.id as string;
  const application = await jobApplicationService.getApplicationById(studentProfileId, applicationId);
  
  ApiResponse.success(res, 'Job application retrieved successfully', application, HTTP_STATUS.OK);
});

export const updateApplication = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can update job applications');
  }

  const applicationId = req.params.id as string;
  const data: UpdateJobApplicationInput = req.body;
  
  const updatedApplication = await jobApplicationService.updateApplication(studentProfileId, applicationId, data);
  
  ApiResponse.success(res, 'Job application updated successfully', updatedApplication, HTTP_STATUS.OK);
});

export const deleteApplication = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can delete job applications');
  }

  const applicationId = req.params.id as string;
  await jobApplicationService.deleteApplication(studentProfileId, applicationId);
  
  ApiResponse.success(res, 'Job application deleted successfully', null, HTTP_STATUS.OK);
});
