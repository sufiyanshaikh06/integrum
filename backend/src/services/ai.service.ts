import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { AIExecutionStatus, AIModule } from '@prisma/client';
import { IAIProvider, StudyPlanContext, ResumeContent, NoteContent } from './ai/ai.provider.js';
import { MockProvider } from './ai/mock.provider.js';
import { GeminiProvider } from './ai/gemini.provider.js';
import { noteService } from './note.service.js';
import {
  generatedStudyPlanOutputSchema,
  generatedResumeAnalysisOutputSchema,
  generatedNoteSummaryOutputSchema,
  generatedKeyPointsOutputSchema,
  generatedQuestionsOutputSchema,
  generatedFlashcardsOutputSchema,
} from '../schemas/ai.schema.js';
import { ZodSchema } from 'zod';

export class AIService {

  private static getProvider(): IAIProvider {
    if (env.AI_PROVIDER === 'gemini') {
      return new GeminiProvider();
    }
    return new MockProvider();
  }

  // ─── Execution lifecycle helpers ─────────────────────────────────────────────

  private static async logExecutionStart(studentProfileId: string, module: AIModule, operation: string) {
    const providerName = env.AI_PROVIDER || 'mock';
    return prisma.aIExecutionLog.create({
      data: {
        studentProfileId,
        module,
        operation: `${operation} [provider=${providerName}]`,
        status: AIExecutionStatus.RUNNING,
      }
    });
  }

  private static async logExecutionSuccess(logId: string) {
    return prisma.aIExecutionLog.update({
      where: { id: logId },
      data: { status: AIExecutionStatus.SUCCESS, completedAt: new Date() }
    });
  }

  private static async logExecutionFailure(logId: string, errorMsg: string) {
    return prisma.aIExecutionLog.update({
      where: { id: logId },
      data: { status: AIExecutionStatus.FAILED, errorMessage: errorMsg, completedAt: new Date() }
    });
  }

  /**
   * Generic lifecycle wrapper for Note AI operations.
   * Handles: ownership check → content extraction → provider call → Zod validation →
   * execution log SUCCESS/FAILED → typed error re-throw.
   *
   * @param studentProfileId  The authenticated student's profile ID
   * @param noteId            The note to process
   * @param operation         Operation name written to the execution log
   * @param providerFn        Receives a typed NoteContent; returns the raw provider output
   * @param outputSchema      Zod schema used to validate the provider output
   */
  private static async executeNoteAI<T>(
    studentProfileId: string,
    noteId: string,
    operation: string,
    providerFn: (provider: IAIProvider, content: NoteContent) => Promise<T>,
    outputSchema: ZodSchema<T>,
  ): Promise<T> {
    const executionLog = await this.logExecutionStart(studentProfileId, AIModule.NOTES, operation);

    try {
      // 1. Ownership verification + content extraction
      const noteContent = await this.extractNoteContent(studentProfileId, noteId);

      // 2. Provider call
      const provider = this.getProvider();
      const raw = await providerFn(provider, noteContent);

      // 3. Zod validation
      const validated = outputSchema.parse(raw);

      await this.logExecutionSuccess(executionLog.id);
      return validated;

    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      const msg = err?.name === 'ZodError'
        ? 'AI generated invalid structure'
        : (err?.message ?? 'Unknown AI execution error');

      await this.logExecutionFailure(executionLog.id, msg);

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to execute AI operation: ${operation}`);
    }
  }

  /**
   * Fetches a note with ownership verification and prepares a typed NoteContent
   * for AI processing.
   *
   * V1 limitation: only textual content is supported. Notes that contain only a
   * fileUrl (PDF/DOCX/PPT) are rejected with 400 until a document-extraction layer
   * is added in a future slice.
   */
  private static async extractNoteContent(studentProfileId: string, noteId: string): Promise<NoteContent> {
    const note = await noteService.getNoteById(studentProfileId, noteId);

    if (!note.content || note.content.trim().length === 0) {
      throw ApiError.badRequest(
        'This note has no textual content for AI analysis. ' +
        'Notes that consist only of a file attachment are not yet supported for AI features.'
      );
    }

    return {
      title: note.title,
      content: note.content,
      subjectName: note.subject.name,
      tags: note.tags ?? [],
    };
  }

  // ─── Study Plan ──────────────────────────────────────────────────────────────

  static async generateStudyPlanRecommendation(
    studentProfileId: string,
    input: { topic: string; targetDate?: string; goals?: string }
  ) {
    const executionLog = await this.logExecutionStart(
      studentProfileId, AIModule.STUDY_PLAN, 'generateStudyPlanRecommendation'
    );

    try {
      const analytics = await prisma.studentAnalytics.findUnique({ where: { studentProfileId } });
      const subjects = await prisma.subject.findMany({
        where: { semester: { studentProfileId } },
        select: { name: true, targetGrade: true }
      });

      const context: StudyPlanContext = {
        topic: input.topic,
        targetDate: input.targetDate,
        goals: input.goals,
        attendancePercentage: analytics?.attendancePercentage ?? 0,
        subjects,
      };

      const provider = this.getProvider();
      const generatedPlan = await provider.generateStudyPlan(context);
      const validatedOutput = generatedStudyPlanOutputSchema.parse(generatedPlan);

      await this.logExecutionSuccess(executionLog.id);
      return validatedOutput;

    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      const msg = err?.name === 'ZodError'
        ? 'AI generated invalid structure'
        : (err?.message ?? 'Unknown AI execution error');

      await this.logExecutionFailure(executionLog.id, msg);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to generate AI study plan');
    }
  }

  // ─── Resume Analysis ─────────────────────────────────────────────────────────

  static async analyzeResume(studentProfileId: string, resumeId: string) {
    const executionLog = await this.logExecutionStart(studentProfileId, AIModule.RESUME, 'analyzeResume');

    try {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, studentProfileId }
      });
      if (!resume) throw ApiError.notFound('Resume not found or does not belong to the user');

      const latestVersion = await prisma.resumeVersion.findFirst({
        where: { resumeId: resume.id },
        orderBy: { createdAt: 'desc' }
      });
      if (!latestVersion) throw ApiError.notFound('No versions found for this resume');

      const content = latestVersion.content as unknown as ResumeContent;
      const provider = this.getProvider();
      const analysis = await provider.analyzeResume(content);
      const validatedAnalysis = generatedResumeAnalysisOutputSchema.parse(analysis);

      await prisma.resumeVersion.update({
        where: { id: latestVersion.id },
        data: { atsScore: validatedAnalysis.atsScore, reviewFeedback: validatedAnalysis.improvementFeedback }
      });

      await this.logExecutionSuccess(executionLog.id);
      return validatedAnalysis;

    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      const msg = err?.name === 'ZodError'
        ? 'AI generated invalid structure'
        : (err?.message ?? 'Unknown AI execution error');

      await this.logExecutionFailure(executionLog.id, msg);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to analyze resume');
    }
  }

  // ─── AI Notes Assistant ──────────────────────────────────────────────────────

  static async summarizeNote(studentProfileId: string, noteId: string) {
    return this.executeNoteAI(
      studentProfileId, noteId, 'summarizeNote',
      (provider, content) => provider.summarizeNote(content),
      generatedNoteSummaryOutputSchema,
    );
  }

  static async extractKeyPoints(studentProfileId: string, noteId: string) {
    return this.executeNoteAI(
      studentProfileId, noteId, 'extractKeyPoints',
      (provider, content) => provider.extractKeyPoints(content),
      generatedKeyPointsOutputSchema,
    );
  }

  static async generateQuestions(studentProfileId: string, noteId: string) {
    return this.executeNoteAI(
      studentProfileId, noteId, 'generateQuestions',
      (provider, content) => provider.generateQuestions(content),
      generatedQuestionsOutputSchema,
    );
  }

  static async generateFlashcards(studentProfileId: string, noteId: string) {
    return this.executeNoteAI(
      studentProfileId, noteId, 'generateFlashcards',
      (provider, content) => provider.generateFlashcards(content),
      generatedFlashcardsOutputSchema,
    );
  }
}
