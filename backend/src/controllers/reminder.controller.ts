import { Request, Response } from 'express';
import { reminderService } from '../services/reminder.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateReminderInput, UpdateReminderInput } from '../schemas/reminder.schema.js';

export const createReminder = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can create reminders');
  }

  const data: CreateReminderInput = req.body;
  const reminder = await reminderService.createReminder(studentProfileId, data);
  
  ApiResponse.success(res, 'Reminder created successfully', reminder, HTTP_STATUS.CREATED);
});

export const getReminders = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view reminders');
  }

  const reminders = await reminderService.getReminders(studentProfileId);
  
  ApiResponse.success(res, 'Reminders retrieved successfully', reminders, HTTP_STATUS.OK);
});

export const getReminderById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view reminders');
  }

  const reminderId = req.params.id as string;
  const reminder = await reminderService.getReminderById(studentProfileId, reminderId);
  
  ApiResponse.success(res, 'Reminder retrieved successfully', reminder, HTTP_STATUS.OK);
});

export const updateReminder = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can update reminders');
  }

  const reminderId = req.params.id as string;
  const data: UpdateReminderInput = req.body;
  
  const updatedReminder = await reminderService.updateReminder(studentProfileId, reminderId, data);
  
  ApiResponse.success(res, 'Reminder updated successfully', updatedReminder, HTTP_STATUS.OK);
});

export const deleteReminder = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can delete reminders');
  }

  const reminderId = req.params.id as string;
  await reminderService.deleteReminder(studentProfileId, reminderId);
  
  ApiResponse.success(res, 'Reminder deleted successfully', null, HTTP_STATUS.OK);
});
