import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  IAIProvider,
  StudyPlanContext,
  GeneratedStudyPlan,
  ResumeContent,
  GeneratedResumeAnalysis,
  NoteContent,
  GeneratedNoteSummary,
  GeneratedKeyPoints,
  GeneratedQuestions,
  GeneratedFlashcards,
} from './ai.provider.js';
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
   * Defensive error mapper for Gemini SDK — typed to avoid catch (error: any)
   */
  private handleGeminiError(error: unknown): never {
    console.error('Gemini Provider Error:', error);

    const err = error as { message?: string; status?: number; name?: string };
    const errorMessage = err?.message ?? '';
    const status = err?.status;

    if (status === 401 || status === 403 || errorMessage.includes('API key not valid')) {
      throw ApiError.internal('AI provider authentication failed');
    }
    if (status === 404 || errorMessage.includes('not found')) {
      throw ApiError.internal('AI provider model is currently unavailable');
    }
    if (status === 429 || errorMessage.includes('quota')) {
      throw ApiError.internal('AI provider rate limit exceeded');
    }
    if (err?.name === 'SyntaxError') {
      throw ApiError.internal('AI provider returned malformed response');
    }

    throw ApiError.internal('Failed to generate response from AI provider');
  }

  // ─── Study Plan ─────────────────────────────────────────────────────────────

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

      // Zod validation handled in ai.service.ts
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
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  // ─── Resume Analysis ─────────────────────────────────────────────────────────

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
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  // ─── AI Notes Assistant ──────────────────────────────────────────────────────

  async summarizeNote(content: NoteContent): Promise<GeneratedNoteSummary> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING },
            keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ['summary', 'keyPoints'],
        },
      },
    });

    const prompt = `
You are Integrum's academic AI assistant. Summarize the following student note concisely and extract the key points.

Subject: ${content.subjectName}
Note Title: ${content.title}
Tags: ${content.tags.join(', ') || 'None'}

Note Content:
${content.content}

Provide a clear, concise summary (2-4 paragraphs) and a list of 3-8 key points.
Return a valid JSON object matching the requested schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return { summary: parsed.summary, keyPoints: parsed.keyPoints };
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  async extractKeyPoints(content: NoteContent): Promise<GeneratedKeyPoints> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            keyPoints: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  point: { type: SchemaType.STRING },
                  importance: { type: SchemaType.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                },
                required: ['point', 'importance'],
              },
            },
          },
          required: ['keyPoints'],
        },
      },
    });

    const prompt = `
You are Integrum's academic AI assistant. Extract and rank key points from this student note.

Subject: ${content.subjectName}
Note Title: ${content.title}

Note Content:
${content.content}

Extract 5-10 key points. Rate each as HIGH (exam-critical), MEDIUM (important for understanding), or LOW (supplementary).
Return a valid JSON object matching the requested schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return { keyPoints: parsed.keyPoints };
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  async generateQuestions(content: NoteContent): Promise<GeneratedQuestions> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  question: { type: SchemaType.STRING },
                  answer: { type: SchemaType.STRING },
                  difficulty: { type: SchemaType.STRING, enum: ['EASY', 'MEDIUM', 'HARD'] },
                },
                required: ['question', 'answer', 'difficulty'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const prompt = `
You are Integrum's academic AI assistant. Generate revision questions from this student note.

Subject: ${content.subjectName}
Note Title: ${content.title}

Note Content:
${content.content}

Generate 5-8 questions suitable for exam revision. Include a mix of EASY (recall), MEDIUM (understanding), and HARD (analysis/application) difficulty levels. Each question must have a clear, complete answer.
Return a valid JSON object matching the requested schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return { questions: parsed.questions };
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }

  async generateFlashcards(content: NoteContent): Promise<GeneratedFlashcards> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            flashcards: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  front: { type: SchemaType.STRING },
                  back: { type: SchemaType.STRING },
                },
                required: ['front', 'back'],
              },
            },
          },
          required: ['flashcards'],
        },
      },
    });

    const prompt = `
You are Integrum's academic AI assistant. Generate study flashcards from this student note.

Subject: ${content.subjectName}
Note Title: ${content.title}

Note Content:
${content.content}

Generate 5-10 flashcards. Each card has a "front" (question, term, or prompt) and a "back" (answer, definition, or explanation). Focus on the most important concepts for memorization.
Return a valid JSON object matching the requested schema.
    `;

    try {
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return { flashcards: parsed.flashcards };
    } catch (error: unknown) {
      this.handleGeminiError(error);
    }
  }
}
