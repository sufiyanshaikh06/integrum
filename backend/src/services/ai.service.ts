import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { AIExecutionStatus, AIModule } from '@prisma/client';
import { IAIProvider, StudyPlanContext } from './ai/ai.provider.js';
import { MockProvider } from './ai/mock.provider.js';
import { GeminiProvider } from './ai/gemini.provider.js';

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
    return prisma.aIExecutionLog.create({
      data: {
        studentProfileId,
        module,
        operation,
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
   * Recommends a structured study plan based on student input.
   */
  static async generateStudyPlanRecommendation(studentProfileId: string, input: { topic: string, targetDate?: string, goals?: string }) {
    // 1. Log the start of execution
    const executionLog = await this.logExecutionStart(studentProfileId, AIModule.STUDY_PLAN, 'generateStudyPlanRecommendation');

    try {
      // 2. Fetch existing academic context (subjects, analytics) to inform the AI (Hardening/Integration P3)
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

      // 3. Delegate to the configured AI Provider
      const provider = this.getProvider();
      const generatedPlan = await provider.generateStudyPlan(context);

      // 4. Log successful completion
      await this.logExecutionSuccess(executionLog.id);

      return generatedPlan;

    } catch (error: any) {
      // 5. Log failure and re-throw
      console.error('AIService caught error:', error);
      await this.logExecutionFailure(executionLog.id, error.message || 'Unknown AI execution error');
      throw ApiError.internal('Failed to generate AI study plan');
    }
  }
}
