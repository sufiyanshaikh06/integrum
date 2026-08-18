import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { IAIProvider, StudyPlanContext, GeneratedStudyPlan } from './ai.provider.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw ApiError.internal('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.modelName = env.GEMINI_MODEL || 'gemini-3.6-flash';
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
      console.error('Gemini Provider Error:', error);
      throw ApiError.internal('Failed to generate response from Gemini API');
    }
  }
}
