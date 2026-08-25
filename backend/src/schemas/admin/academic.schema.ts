// @ts-nocheck
import { z } from 'zod';

// ─── DEPARTMENT SCHEMAS ───────────────────────────────────────────────────

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Department name is required'),
    code: z
      .string()
      .trim()
      .min(1, 'Department code is required')
      .transform((v) => v.toUpperCase()),
    description: z.string().trim().optional(),
    headOfDepartment: z.string().trim().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    code: z
      .string()
      .trim()
      .min(1)
      .transform((v) => v.toUpperCase())
      .optional(),
    description: z.string().trim().optional(),
    headOfDepartment: z.string().trim().optional(),
  }),
});

export const listDepartmentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
  }),
});

// ─── COURSE SCHEMAS ───────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid('Invalid department ID format'),
    name: z.string().trim().min(1, 'Course name is required'),
    code: z
      .string()
      .trim()
      .min(1, 'Course code is required')
      .transform((v) => v.toUpperCase()),
    durationYears: z.coerce.number().int().min(1, 'Duration must be at least 1 year').default(4),
    totalSemesters: z.coerce.number().int().min(1, 'Total semesters must be at least 1').default(8),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid('Invalid department ID format').optional(),
    name: z.string().trim().min(1).optional(),
    code: z
      .string()
      .trim()
      .min(1)
      .transform((v) => v.toUpperCase())
      .optional(),
    durationYears: z.coerce.number().int().min(1).optional(),
    totalSemesters: z.coerce.number().int().min(1).optional(),
  }),
});

export const listCoursesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    departmentId: z.string().uuid().optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── MASTER SUBJECT SCHEMAS ───────────────────────────────────────────────

export const createMasterSubjectSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID format'),
    name: z.string().trim().min(1, 'Master subject name is required'),
    code: z
      .string()
      .trim()
      .min(1, 'Subject code is required')
      .transform((v) => v.toUpperCase()),
    credits: z.coerce.number().int().min(1, 'Credits must be at least 1').default(3),
    semesterNumber: z.coerce.number().int().min(1, 'Semester number must be at least 1').default(1),
    description: z.string().trim().optional(),
  }),
});

export const updateMasterSubjectSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID format').optional(),
    name: z.string().trim().min(1).optional(),
    code: z
      .string()
      .trim()
      .min(1)
      .transform((v) => v.toUpperCase())
      .optional(),
    credits: z.coerce.number().int().min(1).optional(),
    semesterNumber: z.coerce.number().int().min(1).optional(),
    description: z.string().trim().optional(),
  }),
});

export const listMasterSubjectsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    courseId: z.string().uuid().optional(),
    semesterNumber: z.coerce.number().int().min(1).optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── ACADEMIC TERM SCHEMAS ────────────────────────────────────────────────

export const createAcademicTermSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'Term name is required'),
      academicYear: z.coerce.number().int().min(2000, 'Academic year must be valid (>= 2000)'),
      termType: z.enum(['', '', ''] as [string, ...string[]], {
        errorMap: () => ({ message: 'Term type must be ODD, EVEN, or SUMMER' }),
      }),
      startDate: z.string().datetime({ message: 'Invalid start date format (ISO-8601 required)' }),
      endDate: z.string().datetime({ message: 'Invalid end date format (ISO-8601 required)' }),
      isActive: z.boolean().default(true),
    })
    .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
      message: 'startDate must be strictly before endDate',
      path: ['startDate'],
    }),
});

export const updateAcademicTermSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      academicYear: z.coerce.number().int().min(2000).optional(),
      termType: z.enum(['', '', ''] as [string, ...string[]]).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: 'startDate must be strictly before endDate',
        path: ['startDate'],
      }
    ),
});

export const listAcademicTermsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    academicYear: z.coerce.number().int().optional(),
    termType: z.enum(['', '', ''] as [string, ...string[]]).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().trim().optional(),
  }),
});

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>['body'];
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>['query'];

export type CreateCourseInput = z.infer<typeof createCourseSchema>['body'];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>['body'];
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>['query'];

export type CreateMasterSubjectInput = z.infer<typeof createMasterSubjectSchema>['body'];
export type UpdateMasterSubjectInput = z.infer<typeof updateMasterSubjectSchema>['body'];
export type ListMasterSubjectsQuery = z.infer<typeof listMasterSubjectsQuerySchema>['query'];

export type CreateAcademicTermInput = z.infer<typeof createAcademicTermSchema>['body'];
export type UpdateAcademicTermInput = z.infer<typeof updateAcademicTermSchema>['body'];
export type ListAcademicTermsQuery = z.infer<typeof listAcademicTermsQuerySchema>['query'];
