import { Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';

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
  const note = await noteService.getNoteById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Note retrieved successfully', note);
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const data: UpdateNoteInput = req.body;
  const note = await noteService.updateNote(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Note updated successfully', note);
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  await noteService.deleteNote(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Note deleted successfully', null, 204);
});
