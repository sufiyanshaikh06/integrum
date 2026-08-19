import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { GenerateStudyPlanInput } from '../schemas/ai.schema.js';

export const generateStudyPlan = async (req: Request<{}, {}, GenerateStudyPlanInput>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  
  const plan = await AIService.generateStudyPlanRecommendation(studentProfileId, req.body);
  
  return ApiResponse.success(res, 'AI Study Plan generated successfully', plan, 201);
};

export const analyzeResume = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const resumeId = req.params.id;

  const analysis = await AIService.analyzeResume(studentProfileId, resumeId);

  return ApiResponse.success(res, 'Resume analyzed successfully', analysis, 200);
};
