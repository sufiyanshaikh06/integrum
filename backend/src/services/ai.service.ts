import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { AIExecutionStatus, AIModule } from '@prisma/client';

export class AIService {
  
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

      // 3. Mock the AI response generation
      // In a real app, this would call an LLM (OpenAI, Gemini, etc.) using the input + context
      
      // Simulate network delay for realistic execution logging test
      await new Promise(resolve => setTimeout(resolve, 800));

      const generatedPlan = {
        title: `AI Study Plan: ${input.topic}`,
        recommendedTargetDate: input.targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        overview: `Based on your goal to study ${input.topic}, and considering your current subjects (${subjects.map(s => s.name).join(', ') || 'None'}), we recommend a structured approach.`,
        suggestedTasks: [
          { title: `Read foundational materials on ${input.topic}`, description: 'Focus on core concepts.' },
          { title: 'Complete practice exercises', description: 'Apply concepts in a practical setting.' },
          { title: 'Review and summarize', description: 'Create a cheat sheet or summary notes.' }
        ],
        contextUsed: {
          attendancePercentage: analytics?.attendancePercentage || 0,
          subjectsCount: subjects.length
        }
      };

      // 4. Log successful completion
      await this.logExecutionSuccess(executionLog.id);

      return generatedPlan;

    } catch (error: any) {
      // 5. Log failure and re-throw
      await this.logExecutionFailure(executionLog.id, error.message || 'Unknown AI execution error');
      throw ApiError.internal('Failed to generate AI study plan');
    }
  }
}
