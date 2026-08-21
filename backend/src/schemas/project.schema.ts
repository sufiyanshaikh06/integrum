import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Project title must be at least 2 characters'),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    projectUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isOngoing: z.boolean().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    projectUrl: z.string().url().optional().or(z.literal('')),
    repoUrl: z.string().url().optional().or(z.literal('')),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isOngoing: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
