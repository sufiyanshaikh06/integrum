import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { GenerateStudyPlanInput } from '../schemas/ai.schema.js';

export const generateStudyPlan = async (req: Request<Record<string, never>, unknown, GenerateStudyPlanInput>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const plan = await AIService.generateStudyPlanRecommendation(studentProfileId, req.body);
  return ApiResponse.success(res, 'AI Study Plan generated successfully', plan, 201);
};

export const analyzeResume = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const analysis = await AIService.analyzeResume(studentProfileId, req.params.id);
  return ApiResponse.success(res, 'Resume analyzed successfully', analysis, 200);
};

// ─── AI Notes Assistant ───────────────────────────────────────────────────────

export const summarizeNote = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const result = await AIService.summarizeNote(studentProfileId, req.params.id);
  return ApiResponse.success(res, 'Note summarized successfully', result, 200);
};

export const extractKeyPoints = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const result = await AIService.extractKeyPoints(studentProfileId, req.params.id);
  return ApiResponse.success(res, 'Key points extracted successfully', result, 200);
};

export const generateQuestions = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const result = await AIService.generateQuestions(studentProfileId, req.params.id);
  return ApiResponse.success(res, 'Questions generated successfully', result, 200);
};

export const generateFlashcards = async (req: Request<{ id: string }>, res: Response) => {
  const studentProfileId = req.user!.studentProfile.id;
  const result = await AIService.generateFlashcards(studentProfileId, req.params.id);
  return ApiResponse.success(res, 'Flashcards generated successfully', result, 200);
};
