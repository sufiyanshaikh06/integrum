import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    studyPlanId: z.string().uuid('Invalid study plan ID').optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    studyPlanId: z.string().uuid().optional(),
  }),
});
