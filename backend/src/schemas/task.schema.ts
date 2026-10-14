import { z } from 'zod';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const statusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    studyPlanId: z.string().uuid('Invalid study plan ID').nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    studyPlanId: z.string().uuid('Invalid study plan ID').nullable().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
