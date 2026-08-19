import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { IAIProvider, StudyPlanContext, GeneratedStudyPlan, ResumeContent, GeneratedResumeAnalysis } from './ai.provider.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  public modelName: string;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw ApiError.internal('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelName = env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  /**
   * Defensive error mapper for Gemini SDK
   */
  private handleGeminiError(error: any): never {
    console.error('Gemini Provider Error:', error);

    const errorMessage = error?.message || '';
    const status = error?.status;

    if (status === 401 || status === 403 || errorMessage.includes('API key not valid')) {
      throw ApiError.internal('AI provider authentication failed');
    }
    if (status === 404 || errorMessage.includes('not found')) {
      throw ApiError.internal('AI provider model is currently unavailable');
    }
    if (status === 429 || errorMessage.includes('quota')) {
      throw ApiError.internal('AI provider rate limit exceeded');
    }
    if (error?.name === 'SyntaxError') {
      throw ApiError.internal('AI provider returned malformed response');
    }

    throw ApiError.internal('Failed to generate response from AI provider');
  }

  async generateStudyPlan(context: StudyPlanContext): Promise<GeneratedStudyPlan> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            recommendedTargetDate: { type: SchemaType.STRING },
            overview: { type: SchemaType.STRING },
            suggestedTasks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  description: { type: SchemaType.STRING }
                },
                required: ['title', 'description']
              }
            }
          },
          required: ['title', 'recommendedTargetDate', 'overview', 'suggestedTasks']
        }
      }
    });

    const prompt = `
You are Integrum's academic assistant. Create a realistic study plan for a student.

Student Context:
- Current Attendance: ${context.attendancePercentage.toFixed(1)}%
- Enrolled Subjects: ${context.subjects.map(s => s.name).join(', ') || 'None'}
- Target Goals: ${context.goals || 'None specified'}

Requested Topic:
${context.topic}

Target Date:
${context.targetDate || 'Not specified (assume 14 days from now)'}

Return a valid JSON object matching the requested schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      // We'll trust Zod validation in ai.service.ts
      return {
        title: parsedData.title,
        recommendedTargetDate: parsedData.recommendedTargetDate,
        overview: parsedData.overview,
        suggestedTasks: parsedData.suggestedTasks,
        contextUsed: {
          attendancePercentage: context.attendancePercentage,
          subjectsCount: context.subjects.length
        }
      };
    } catch (error: any) {
      this.handleGeminiError(error);
    }
  }

  async analyzeResume(content: ResumeContent): Promise<GeneratedResumeAnalysis> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            atsScore: { type: SchemaType.NUMBER, description: "Score from 0 to 100" },
            strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            missingSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            improvementFeedback: { type: SchemaType.STRING }
          },
          required: ['atsScore', 'strengths', 'weaknesses', 'missingSkills', 'improvementFeedback']
        }
      }
    });

    const prompt = `
You are an expert ATS (Applicant Tracking System) and career coach.
Analyze the following student resume content and provide an ATS score (0-100) and actionable feedback.

Resume Content:
${JSON.stringify(content, null, 2)}

Provide your analysis strictly matching the requested JSON schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsedData = JSON.parse(responseText);

      return {
        atsScore: parsedData.atsScore,
        strengths: parsedData.strengths,
        weaknesses: parsedData.weaknesses,
        missingSkills: parsedData.missingSkills,
        improvementFeedback: parsedData.improvementFeedback
      };
    } catch (error: any) {
      this.handleGeminiError(error);
    }
  }
}
