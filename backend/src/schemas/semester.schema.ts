import { z } from 'zod';

export const createSemesterSchema = z.object({
  body: z.object({
    academicTermId: z.string().uuid().nullable().optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  }),
});

export const updateSemesterSchema = z.object({
  body: z.object({
    academicTermId: z.string().uuid().nullable().optional(),
    name: z.string().min(2).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine((data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  }, {
    message: "End date must be after start date",
    path: ["endDate"],
  }),
});

export const academicTermLookupSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
