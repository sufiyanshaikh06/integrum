import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const generateStudyPlan = async (req: Request, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  
  const generatedPlan = await AIService.generateStudyPlanRecommendation(studentProfileId, req.body);
  
  return ApiResponse.success(res, 'AI study plan recommendation generated successfully', generatedPlan, 201);
};
