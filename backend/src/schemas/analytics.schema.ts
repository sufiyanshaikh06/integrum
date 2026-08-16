import { z } from 'zod';

// Currently, no specific query parameters are required for the general analytics dashboard,
// but we set up the schema pattern for future date range filtering.
export const getAnalyticsQuerySchema = z.object({
  query: z.object({
    // Optional filters could go here in the future
    // fromDate: z.string().datetime().optional(),
    // toDate: z.string().datetime().optional(),
  }),
});
