import { z } from 'zod';

// C-1: Supported resume templates
export const RESUME_TEMPLATES = ['classic', 'modern', 'minimal', 'executive', 'compact'] as const;
export type ResumeTemplate = typeof RESUME_TEMPLATES[number];

export const createResumeSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    isActive: z.boolean().optional(),
    content: z.record(z.any(), { message: 'Content must be a valid JSON object' }),
    templateId: z.enum(RESUME_TEMPLATES).optional(),
  }),
});

export const updateResumeSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').optional(),
    isActive: z.boolean().optional(),
    content: z.record(z.any()).optional(),
    templateId: z.enum(RESUME_TEMPLATES).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>['body'];
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>['body'];
