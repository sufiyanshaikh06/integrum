import { z } from 'zod';

const booleanQuery = z
  .enum(['true', 'false'])
  .transform(val => val === 'true');

export const getAnnouncementsQuerySchema = z.object({
  query: z.object({
    type: z.enum(['ANNOUNCEMENT', 'NOTICE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    search: z.string().trim().optional(),
  }).strict(),
});

export const getEventsQuerySchema = z.object({
  query: z.object({
    category: z.enum(['EXAM', 'HOLIDAY', 'COLLEGE_EVENT', 'SEMINAR', 'WORKSHOP']).optional(),
    upcomingOnly: booleanQuery.optional(),
    search: z.string().trim().optional(),
  }).strict(),
});

export const getResourcesQuerySchema = z.object({
  query: z.object({
    category: z.enum(['SYLLABUS', 'PREVIOUS_PAPER', 'STUDY_GUIDE', 'TEMPLATE', 'OTHER']).optional(),
    search: z.string().trim().optional(),
  }).strict(),
});

export type GetAnnouncementsQuery = z.infer<typeof getAnnouncementsQuerySchema>['query'];
export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>['query'];
export type GetResourcesQuery = z.infer<typeof getResourcesQuerySchema>['query'];
