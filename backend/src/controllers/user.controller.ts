import { randomUUID } from 'node:crypto';
import { cleanupFile, sendPrivateFile } from '../services/storage/file-transfer.js';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { userService } from '../services/user.service.js';
import { getStorageProvider } from '../services/storage/index.js';
import { prisma } from '../config/prisma.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export const userController = {
  // GET /users/me
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.id);
    ApiResponse.success(res, 'User profile retrieved successfully', user);
  }),

  // PATCH /users/me — I-3: Update Profile (I-4 careerGoals, I-5 socialLinks included)
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');
    const updated = await userService.updateProfile(req.user.id, req.body);
    ApiResponse.success(res, 'Profile updated successfully', updated);
  }),
};

// G2: POST /users/me/resume-upload
export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized('Authentication required');

  if (!req.file) throw ApiError.badRequest('No file provided');

  // Ownership/profile existence check BEFORE storage
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true, uploadedResumeFileId: true } });
  if (!profile) throw ApiError.notFound('Student profile not found');

  // Magic-byte validation — PDF only
  const { fileTypeFromBuffer } = await import('file-type');
  const fileTypeResult = await fileTypeFromBuffer(req.file.buffer);
  if (!fileTypeResult || fileTypeResult.mime !== 'application/pdf') {
    throw ApiError.badRequest('Only PDF files are allowed for resume upload');
  }

  const storagePath = `profiles/${profile.id}/resume-${randomUUID()}.pdf`;
  const provider = getStorageProvider();
  const fileId = await provider.upload(storagePath, req.file.buffer, fileTypeResult.mime);

  try {
    await userService.attachResume(userId, fileId, profile.uploadedResumeFileId);
  } catch (error) {
    await cleanupFile(provider, fileId);
    throw error;
  }
  await cleanupFile(provider, profile.uploadedResumeFileId);

  return ApiResponse.success(res, 'Resume uploaded successfully', { fileId }, HTTP_STATUS.OK);
});

// G2: GET /users/me/resume-file
export const streamResume = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized('Authentication required');

  const fileId = await userService.getResumeFileId(userId);
  const provider = getStorageProvider();
  await sendPrivateFile(res, provider, fileId);
});
