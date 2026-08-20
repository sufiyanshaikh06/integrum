import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { taskService } from '../services/task.service.js';
import { ApiError } from '../utils/ApiError.js';

export const taskController = {
  createTask: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can create tasks');

    const task = await taskService.createTask(profileId, req.body);
    ApiResponse.success(res, 'Task created successfully', task, HTTP_STATUS.CREATED);
  }),

  getTasks: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view tasks');

    const tasks = await taskService.getTasks(profileId);
    ApiResponse.success(res, 'Tasks retrieved successfully', tasks, HTTP_STATUS.OK);
  }),

  getTaskById: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view tasks');

    const task = await taskService.getTaskById(profileId, req.params.id as string);
    ApiResponse.success(res, 'Task retrieved successfully', task, HTTP_STATUS.OK);
  }),

  updateTask: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can update tasks');

    const task = await taskService.updateTask(profileId, req.params.id as string, req.body);
    ApiResponse.success(res, 'Task updated successfully', task, HTTP_STATUS.OK);
  }),

  deleteTask: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can delete tasks');

    await taskService.deleteTask(profileId, req.params.id as string);
    ApiResponse.success(res, 'Task deleted successfully', null, HTTP_STATUS.OK);
  }),

  // I-6: Upcoming Tasks
  getUpcomingTasks: asyncHandler(async (req: Request, res: Response) => {
    const profileId = req.user?.studentProfile?.id;
    if (!profileId) throw ApiError.forbidden('Only students can view tasks');

    const tasks = await taskService.getUpcomingTasks(profileId);
    ApiResponse.success(res, 'Upcoming tasks retrieved successfully', tasks, HTTP_STATUS.OK);
  }),
};
