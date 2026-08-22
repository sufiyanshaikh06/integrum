import { z } from 'zod';

export const generateStudyPlanSchema = z.object({
  body: z.object({
    topic: z.string().min(3, 'Topic must be at least 3 characters long'),
    targetDate: z.string().datetime().optional(),
    goals: z.string().optional(),
  }),
});

export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanSchema>['body'];

export const generatedStudyPlanOutputSchema = z.object({
  title: z.string(),
  recommendedTargetDate: z.string(),
  overview: z.string(),
  suggestedTasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })),
});

export const generatedResumeAnalysisOutputSchema = z.object({
  atsScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingSkills: z.array(z.string()),
  improvementFeedback: z.string(),
});

// ─── AI Notes Assistant output schemas ───────────────────────────────────────

export const generatedNoteSummaryOutputSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()),
});

export const generatedKeyPointsOutputSchema = z.object({
  keyPoints: z.array(z.object({
    point: z.string(),
    importance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  })),
});

export const generatedQuestionsOutputSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  })),
});

export const generatedFlashcardsOutputSchema = z.object({
  flashcards: z.array(z.object({
    front: z.string(),
    back: z.string(),
  })),
});
