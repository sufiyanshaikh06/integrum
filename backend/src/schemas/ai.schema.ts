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
  weeklySchedule: z.array(z.object({
    day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    topic: z.string().trim().min(1),
    durationMinutes: z.number().int().min(1).max(1440),
    activity: z.string().trim().min(1),
  })).min(1).max(49),
  revisionPlan: z.array(z.object({
    topic: z.string().trim().min(1),
    strategy: z.string().trim().min(1),
    frequency: z.string().trim().min(1),
  })).min(1).max(50),
  topicPriorities: z.array(z.object({
    topic: z.string().trim().min(1),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    reason: z.string().trim().min(1),
  })).min(1).max(50),
  goalRecommendations: z.array(z.string().trim().min(1)).min(1).max(50),
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
