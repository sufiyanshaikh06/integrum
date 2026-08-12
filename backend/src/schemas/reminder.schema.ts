import { z } from 'zod';

export const createReminderSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }).min(1, 'Title cannot be empty').max(255, 'Title is too long'),
    description: z.string().optional(),
    triggerAt: z.string({
      required_error: 'triggerAt is required',
    }).datetime({ message: 'Invalid datetime format for triggerAt' }),
    isCompleted: z.boolean().optional(),
  }),
});

export const updateReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').max(255, 'Title is too long').optional(),
    description: z.string().optional(),
    triggerAt: z.string().datetime({ message: 'Invalid datetime format for triggerAt' }).optional(),
    isCompleted: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>['body'];
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>['body'];
