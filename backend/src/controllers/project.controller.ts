import { Request, Response } from 'express';
import { projectService } from '../services/project.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema.js';

function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.forbidden('Only students can manage projects');
  return id;
}

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateProjectInput = req.body;
  const project = await projectService.createProject(getProfileId(req), data);
  ApiResponse.success(res, 'Project created successfully', project, HTTP_STATUS.CREATED);
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.getProjects(getProfileId(req));
  ApiResponse.success(res, 'Projects retrieved successfully', projects);
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(getProfileId(req), req.params.id);
  ApiResponse.success(res, 'Project retrieved successfully', project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateProjectInput = req.body;
  const project = await projectService.updateProject(getProfileId(req), req.params.id, data);
  ApiResponse.success(res, 'Project updated successfully', project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(getProfileId(req), req.params.id);
  ApiResponse.success(res, 'Project deleted successfully', null);
});
