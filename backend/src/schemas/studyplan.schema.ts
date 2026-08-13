import { z } from 'zod';

export const createStudyPlanSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    targetDate: z.string().datetime().optional(),
    goals: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
  }),
});

export const updateStudyPlanSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    targetDate: z.string().datetime().optional(),
    goals: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateStudyPlanInput = z.infer<typeof createStudyPlanSchema>['body'];
export type UpdateStudyPlanInput = z.infer<typeof updateStudyPlanSchema>['body'];
