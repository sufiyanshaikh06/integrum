import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { AIExecutionStatus, AIModule } from '@prisma/client';
import { IAIProvider, StudyPlanContext, ResumeContent } from './ai/ai.provider.js';
import { MockProvider } from './ai/mock.provider.js';
import { GeminiProvider } from './ai/gemini.provider.js';
import { generatedStudyPlanOutputSchema, generatedResumeAnalysisOutputSchema } from '../schemas/ai.schema.js';

export class AIService {
  
  private static getProvider(): IAIProvider {
    if (env.AI_PROVIDER === 'gemini') {
      return new GeminiProvider();
    }
    return new MockProvider();
  }

  /**
   * Core AI execution logging infrastructure
   */
  private static async logExecutionStart(studentProfileId: string, module: AIModule, operation: string) {
    // We document the provider internally here for traceability
    const providerName = env.AI_PROVIDER || 'mock';
    const opWithMeta = `${operation} [provider=${providerName}]`;

    return prisma.aIExecutionLog.create({
      data: {
        studentProfileId,
        module,
        operation: opWithMeta,
        status: AIExecutionStatus.RUNNING,
      }
    });
  }

  private static async logExecutionSuccess(logId: string) {
    return prisma.aIExecutionLog.update({
      where: { id: logId },
      data: {
        status: AIExecutionStatus.SUCCESS,
        completedAt: new Date()
      }
    });
  }

  private static async logExecutionFailure(logId: string, errorMsg: string) {
    return prisma.aIExecutionLog.update({
      where: { id: logId },
      data: {
        status: AIExecutionStatus.FAILED,
        errorMessage: errorMsg,
        completedAt: new Date()
      }
    });
  }

  /**
   * P2 - First AI Capability: AI Study Plan Assistant
   */
  static async generateStudyPlanRecommendation(studentProfileId: string, input: { topic: string, targetDate?: string, goals?: string }) {
    const executionLog = await this.logExecutionStart(studentProfileId, AIModule.STUDY_PLAN, 'generateStudyPlanRecommendation');

    try {
      const analytics = await prisma.studentAnalytics.findUnique({
        where: { studentProfileId }
      });
      
      const subjects = await prisma.subject.findMany({
        where: { semester: { studentProfileId } },
        select: { name: true, targetGrade: true }
      });

      const context: StudyPlanContext = {
        topic: input.topic,
        targetDate: input.targetDate,
        goals: input.goals,
        attendancePercentage: analytics?.attendancePercentage || 0,
        subjects: subjects
      };

      const provider = this.getProvider();
      const generatedPlan = await provider.generateStudyPlan(context);

      // Zod Validation - Trust no one
      const validatedOutput = generatedStudyPlanOutputSchema.parse(generatedPlan);

      await this.logExecutionSuccess(executionLog.id);

      return validatedOutput;

    } catch (error: any) {
      console.error('AIService caught error:', error);
      const isZodError = error?.name === 'ZodError';
      const msg = isZodError ? 'AI generated invalid structure' : (error.message || 'Unknown AI execution error');
      
      await this.logExecutionFailure(executionLog.id, msg);
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to generate AI study plan');
    }
  }

  /**
   * Resume AI Analysis
   */
  static async analyzeResume(studentProfileId: string, resumeId: string) {
    const executionLog = await this.logExecutionStart(studentProfileId, AIModule.RESUME, 'analyzeResume');

    try {
      // 1. Fetch Resume strictly enforcing ownership
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          studentProfileId: studentProfileId
        }
      });

      if (!resume) {
        throw ApiError.notFound('Resume not found or does not belong to the user');
      }

      // 2. Fetch the latest version
      const latestVersion = await prisma.resumeVersion.findFirst({
        where: { resumeId: resume.id },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestVersion) {
        throw ApiError.notFound('No versions found for this resume');
      }

      const content = latestVersion.content as unknown as ResumeContent;

      // 3. Delegate to provider
      const provider = this.getProvider();
      const analysis = await provider.analyzeResume(content);

      // 4. Validate output
      const validatedAnalysis = generatedResumeAnalysisOutputSchema.parse(analysis);

      // 5. Update existing version with AI feedback
      await prisma.resumeVersion.update({
        where: { id: latestVersion.id },
        data: {
          atsScore: validatedAnalysis.atsScore,
          reviewFeedback: validatedAnalysis.improvementFeedback
        }
      });

      await this.logExecutionSuccess(executionLog.id);

      return validatedAnalysis;

    } catch (error: any) {
      console.error('AIService caught error in analyzeResume:', error);
      
      // If it's already an ApiError (like notFound), we might not want to log it as an AI failure
      // if it failed before reaching the AI. But for simplicity, we log it.
      const isZodError = error?.name === 'ZodError';
      const msg = isZodError ? 'AI generated invalid structure' : (error.message || 'Unknown AI execution error');
      
      await this.logExecutionFailure(executionLog.id, msg);

      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to analyze resume');
    }
  }
}
