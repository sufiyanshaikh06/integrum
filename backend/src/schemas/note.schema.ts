import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    subjectId: z.string().uuid(),
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().optional(),
    fileUrl: z.string().url('Must be a valid URL').optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    content: z.string().optional(),
    fileUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>['body'];
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>['body'];
