import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { GenerateStudyPlanInput } from '../schemas/ai.schema.js';

function getProfileId(req: Request): string {
  const id = req.user?.studentProfile?.id;
  if (!id) throw ApiError.unauthorized('Student profile not found');
  return id;
}

export const generateStudyPlan = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const plan = await AIService.generateStudyPlanRecommendation(studentProfileId, req.body as GenerateStudyPlanInput);
  return ApiResponse.success(res, 'AI Study Plan generated successfully', plan, 201);
};

export const analyzeResume = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const analysis = await AIService.analyzeResume(studentProfileId, req.params.id as string);
  return ApiResponse.success(res, 'Resume analyzed successfully', analysis, 200);
};

// ─── AI Notes Assistant ───────────────────────────────────────────────────────

export const summarizeNote = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const result = await AIService.summarizeNote(studentProfileId, req.params.id as string);
  return ApiResponse.success(res, 'Note summarized successfully', result, 200);
};

export const extractKeyPoints = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const result = await AIService.extractKeyPoints(studentProfileId, req.params.id as string);
  return ApiResponse.success(res, 'Key points extracted successfully', result, 200);
};

export const generateQuestions = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const result = await AIService.generateQuestions(studentProfileId, req.params.id as string);
  return ApiResponse.success(res, 'Questions generated successfully', result, 200);
};

export const generateFlashcards = async (req: Request, res: Response) => {
  const studentProfileId = getProfileId(req);
  const result = await AIService.generateFlashcards(studentProfileId, req.params.id as string);
  return ApiResponse.success(res, 'Flashcards generated successfully', result, 200);
};
