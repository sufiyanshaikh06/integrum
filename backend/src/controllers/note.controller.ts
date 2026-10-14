import path from 'path';
import { cleanupFile, sendPrivateFile } from '../services/storage/file-transfer.js';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';
import { getStorageProvider } from '../services/storage/index.js';

/**
 * Retrieves the authenticated student's profile ID from the request.
 * Throws 401 if the profile is not available.
 *
 * Note: req.user.studentProfile.id is the correct access path.
 * req.user.studentProfileId is always undefined — do not use it.
 */
function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.unauthorized('Student profile not found');
  return id;
}

export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data: CreateNoteInput = req.body;
  const note = await noteService.createNote(studentProfileId, data);
  ApiResponse.success(res, 'Note created successfully', note, 201);
});

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const subjectId = req.query.subjectId as string | undefined;
  const tag = req.query.tag as string | undefined;
  const notes = await noteService.getNotes(studentProfileId, subjectId, tag);
  ApiResponse.success(res, 'Notes retrieved successfully', notes);
});

export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const note = await noteService.getNoteById(studentProfileId, req.params.id as string);
  ApiResponse.success(res, 'Note retrieved successfully', note);
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data: UpdateNoteInput = req.body;
  const note = await noteService.updateNote(studentProfileId, req.params.id as string, data);
  ApiResponse.success(res, 'Note updated successfully', note);
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  await noteService.deleteNote(studentProfileId, req.params.id as string);
  ApiResponse.success(res, 'Note deleted successfully', null, 204);
});

export const uploadNoteFile = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) throw ApiError.forbidden('Only students can upload files');
  if (!req.file) throw ApiError.badRequest('No file provided');

  const note = await noteService.getNoteById(studentProfileId, req.params.noteId as string);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const allowedExtensions = new Set(['.pdf', '.docx', '.pptx', '.ppt']);
  if (!allowedExtensions.has(ext)) {
    throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
  }

  // Magic-byte and deep format validation
  const { fileTypeFromBuffer } = await import('file-type');
  const fileTypeResult = await fileTypeFromBuffer(req.file.buffer);
  if (!fileTypeResult) {
    throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
  }

  // Verify that the detected format strictly matches the declared extension
  if (ext === '.pdf') {
    if (fileTypeResult.mime !== 'application/pdf') {
      throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
    }
  } else if (ext === '.docx') {
    if (fileTypeResult.mime !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
    }
  } else if (ext === '.pptx') {
    if (fileTypeResult.mime !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
    }
  } else if (ext === '.ppt') {
    const isPptMime = fileTypeResult.mime === 'application/vnd.ms-powerpoint' || fileTypeResult.mime === 'application/x-cfb';
    const hasPptStream = req.file.buffer.includes(Buffer.from('PowerPoint Document', 'utf16le')) ||
                         req.file.buffer.includes(Buffer.from('Current User', 'utf16le'));
    if (!isPptMime || !hasPptStream) {
      throw ApiError.badRequest('File type not allowed. Accepted: PDF, DOCX, PPT, PPTX');
    }
  }

  const storagePath = `notes/${studentProfileId}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  const provider = getStorageProvider();
  const fileId = await provider.upload(storagePath, req.file.buffer, fileTypeResult.mime);
  try {
    await noteService.attachFile(studentProfileId, req.params.noteId as string, fileId, note.fileId);
  } catch (error) {
    await cleanupFile(provider, fileId);
    throw error;
  }
  await cleanupFile(provider, note.fileId);

  return ApiResponse.success(res, 'File uploaded successfully', { fileId }, HTTP_STATUS.OK);
});

export const streamNoteFile = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) throw ApiError.forbidden('Only students can access note files');

  const fileId = await noteService.getFileId(studentProfileId, req.params.noteId as string);
  const provider = getStorageProvider();
  await sendPrivateFile(res, provider, fileId);
});
