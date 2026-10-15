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

export const acceptAiStudyPlanSchema = z.object({
  headers: z.object({
    'idempotency-key': z.string().optional(),
    'x-idempotency-key': z.string().optional(),
  }).passthrough().optional(),
  body: z.object({
    idempotencyKey: z.string().min(1).optional(),
    title: z.string().optional(),
    recommendedTargetDate: z.string().optional(),
    targetDate: z.string().optional(),
    overview: z.string().optional(),
    goals: z.string().optional(),
    weeklySchedule: z.array(z.object({
      day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      topic: z.string().trim().min(1),
      durationMinutes: z.number().int().min(1).max(1440),
      activity: z.string().trim().min(1),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      subjectId: z.string().uuid().optional().nullable(),
    })).optional(),
    revisionPlan: z.any().optional(),
    topicPriorities: z.any().optional(),
    goalRecommendations: z.any().optional(),
    suggestedTasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    })).optional(),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    })).optional(),
    plan: z.record(z.string(), z.any()).optional(),
    startDate: z.string().optional(),
    targetWeekStart: z.string().optional(),
  }).passthrough(),
});

export type CreateStudyPlanInput = z.infer<typeof createStudyPlanSchema>['body'];
export type UpdateStudyPlanInput = z.infer<typeof updateStudyPlanSchema>['body'];
export type AcceptAiStudyPlanInput = z.infer<typeof acceptAiStudyPlanSchema>['body'];
