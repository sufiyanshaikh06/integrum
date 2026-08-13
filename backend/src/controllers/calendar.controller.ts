import { Request, Response } from 'express';
import { calendarService } from '../services/calendar.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema.js';

export const createCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: CreateCalendarEventInput = req.body;
  const event = await calendarService.createCalendarEvent(studentProfileId, data);
  ApiResponse.success(res, 'Calendar event created successfully', event, 201);
});

export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const events = await calendarService.getCalendarEvents(studentProfileId);
  ApiResponse.success(res, 'Calendar events retrieved successfully', events);
});

export const getCalendarEventById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const event = await calendarService.getCalendarEventById(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Calendar event retrieved successfully', event);
});

export const updateCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  const data: UpdateCalendarEventInput = req.body;
  const event = await calendarService.updateCalendarEvent(studentProfileId, req.params.id, data);
  ApiResponse.success(res, 'Calendar event updated successfully', event);
});

export const deleteCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfileId;
  if (!studentProfileId) throw ApiError.unauthorized('Student profile not found');

  await calendarService.deleteCalendarEvent(studentProfileId, req.params.id);
  ApiResponse.success(res, 'Calendar event deleted successfully', null, 204);
});
