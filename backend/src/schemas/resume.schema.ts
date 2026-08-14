import { z } from 'zod';

export const createResumeSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    isActive: z.boolean().optional(),
    content: z.record(z.any(), { message: 'Content must be a valid JSON object' }),
  }),
});

export const updateResumeSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').optional(),
    isActive: z.boolean().optional(),
    content: z.record(z.any()).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>['body'];
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>['body'];
