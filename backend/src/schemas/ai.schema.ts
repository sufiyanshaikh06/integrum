import { z } from 'zod';

export const generateStudyPlanSchema = z.object({
  body: z.object({
    topic: z.string().min(3, 'Topic must be at least 3 characters long'),
    targetDate: z.string().datetime().optional(),
    goals: z.string().optional(),
  }),
});

export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanSchema>['body'];
