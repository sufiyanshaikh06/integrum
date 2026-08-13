import { Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: CreateNoteInput = req.body;
  const note = await noteService.createNote(studentProfileId, data);
  ApiResponse.success(res, 'Note created successfully', note, 201);
});

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const subjectId = req.query.subjectId as string | undefined;
  const tag = req.query.tag as string | undefined;

  const notes = await noteService.getNotes(studentProfileId, subjectId, tag);
  ApiResponse.success(res, 'Notes retrieved successfully', notes);
});

export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const note = await noteService.getNoteById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Note retrieved successfully', note);
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: UpdateNoteInput = req.body;
  const note = await noteService.updateNote(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Note updated successfully', note);
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  await noteService.deleteNote(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Note deleted successfully', null, 204);
});
