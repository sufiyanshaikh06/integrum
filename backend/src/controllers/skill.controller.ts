import { Request, Response } from 'express';
import { skillService } from '../services/skill.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { CreateSkillInput, UpdateSkillInput } from '../schemas/skill.schema.js';

export const createSkill = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can create skills');
  }

  const data: CreateSkillInput = req.body;
  const skill = await skillService.createSkill(studentProfileId, data);
  
  ApiResponse.success(res, 'Skill created successfully', skill, HTTP_STATUS.CREATED);
});

export const getSkills = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view skills');
  }

  const skills = await skillService.getSkills(studentProfileId);
  
  ApiResponse.success(res, 'Skills retrieved successfully', skills, HTTP_STATUS.OK);
});

export const getSkillById = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can view skills');
  }

  const skillId = req.params.id as string;
  const skill = await skillService.getSkillById(studentProfileId, skillId);
  
  ApiResponse.success(res, 'Skill retrieved successfully', skill, HTTP_STATUS.OK);
});

export const updateSkill = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can update skills');
  }

  const skillId = req.params.id as string;
  const data: UpdateSkillInput = req.body;
  
  const updatedSkill = await skillService.updateSkill(studentProfileId, skillId, data);
  
  ApiResponse.success(res, 'Skill updated successfully', updatedSkill, HTTP_STATUS.OK);
});

export const deleteSkill = asyncHandler(async (req: Request, res: Response) => {
  const studentProfileId = req.user?.studentProfile?.id;
  if (!studentProfileId) {
    throw ApiError.forbidden('Only students can delete skills');
  }

  const skillId = req.params.id as string;
  await skillService.deleteSkill(studentProfileId, skillId);
  
  ApiResponse.success(res, 'Skill deleted successfully', null, HTTP_STATUS.OK);
});
