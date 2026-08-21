import { Request, Response } from 'express';
import { certificationService } from '../services/certification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateCertificationInput, UpdateCertificationInput } from '../schemas/certification.schema.js';

function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.forbidden('Only students can manage certifications');
  return id;
}

export const createCertification = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateCertificationInput = req.body;
  const cert = await certificationService.createCertification(getProfileId(req), data);
  ApiResponse.success(res, 'Certification created successfully', cert, HTTP_STATUS.CREATED);
});

export const getCertifications = asyncHandler(async (req: Request, res: Response) => {
  const certifications = await certificationService.getCertifications(getProfileId(req));
  ApiResponse.success(res, 'Certifications retrieved successfully', certifications);
});

export const getCertificationById = asyncHandler(async (req: Request, res: Response) => {
  const cert = await certificationService.getCertificationById(getProfileId(req), req.params.id);
  ApiResponse.success(res, 'Certification retrieved successfully', cert);
});

export const updateCertification = asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateCertificationInput = req.body;
  const cert = await certificationService.updateCertification(getProfileId(req), req.params.id, data);
  ApiResponse.success(res, 'Certification updated successfully', cert);
});

export const deleteCertification = asyncHandler(async (req: Request, res: Response) => {
  await certificationService.deleteCertification(getProfileId(req), req.params.id);
  ApiResponse.success(res, 'Certification deleted successfully', null);
});

// P4 hook: expiring certifications (for renewal reminders)
export const getExpiringCertifications = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  const certifications = await certificationService.getExpiringCertifications(getProfileId(req), days);
  ApiResponse.success(res, `Certifications expiring within ${days} days`, certifications);
});
