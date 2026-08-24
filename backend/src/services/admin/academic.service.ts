import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ListDepartmentsQuery,
  CreateCourseInput,
  UpdateCourseInput,
  ListCoursesQuery,
  CreateMasterSubjectInput,
  UpdateMasterSubjectInput,
  ListMasterSubjectsQuery,
  CreateAcademicTermInput,
  UpdateAcademicTermInput,
  ListAcademicTermsQuery,
} from '../../schemas/admin/academic.schema.js';

// ─── AUDIT ACTION CONSTANTS ───────────────────────────────────────────────────

export const ACADEMIC_AUDIT_ACTIONS = {
  DEPARTMENT_CREATED: 'DEPARTMENT_CREATED',
  DEPARTMENT_UPDATED: 'DEPARTMENT_UPDATED',
  DEPARTMENT_DELETED: 'DEPARTMENT_DELETED',

  COURSE_CREATED: 'COURSE_CREATED',
  COURSE_UPDATED: 'COURSE_UPDATED',
  COURSE_DELETED: 'COURSE_DELETED',

  MASTER_SUBJECT_CREATED: 'MASTER_SUBJECT_CREATED',
  MASTER_SUBJECT_UPDATED: 'MASTER_SUBJECT_UPDATED',
  MASTER_SUBJECT_DELETED: 'MASTER_SUBJECT_DELETED',

  ACADEMIC_TERM_CREATED: 'ACADEMIC_TERM_CREATED',
  ACADEMIC_TERM_UPDATED: 'ACADEMIC_TERM_UPDATED',
  ACADEMIC_TERM_DELETED: 'ACADEMIC_TERM_DELETED',
} as const;

export const adminAcademicService = {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. DEPARTMENT MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async createDepartment(actorUserId: string, data: CreateDepartmentInput, ipAddress?: string) {
    const existing = await prisma.department.findFirst({
      where: {
        OR: [{ name: { equals: data.name, mode: 'insensitive' } }, { code: data.code }],
      },
    });
    if (existing) {
      if (existing.code === data.code) {
        throw ApiError.conflict(`Department code "${data.code}" is already in use`);
      }
      throw ApiError.conflict(`Department name "${data.name}" is already in use`);
    }

    return prisma.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          headOfDepartment: data.headOfDepartment,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.DEPARTMENT_CREATED,
          targetType: 'Department',
          targetId: department.id,
          details: { name: department.name, code: department.code },
          ipAddress,
        },
      });

      return department;
    });
  },

  async listDepartments(query: ListDepartmentsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          _count: {
            select: { courses: true, adminProfiles: true },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getDepartmentById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: { code: 'asc' },
          include: {
            _count: { select: { masterSubjects: true, students: true } },
          },
        },
        _count: {
          select: { courses: true, adminProfiles: true, announcements: true, resources: true },
        },
      },
    });

    if (!department) throw ApiError.notFound('Department not found');
    return department;
  },

  async updateDepartment(
    actorUserId: string,
    id: string,
    data: UpdateDepartmentInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.department.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Department not found');

      if (data.code && data.code !== existing.code) {
        const codeInUse = await tx.department.findUnique({ where: { code: data.code } });
        if (codeInUse) throw ApiError.conflict(`Department code "${data.code}" is already in use`);
      }

      if (data.name && data.name !== existing.name) {
        const nameInUse = await tx.department.findUnique({ where: { name: data.name } });
        if (nameInUse) throw ApiError.conflict(`Department name "${data.name}" is already in use`);
      }

      const updated = await tx.department.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.code ? { code: data.code } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.headOfDepartment !== undefined ? { headOfDepartment: data.headOfDepartment } : {}),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.DEPARTMENT_UPDATED,
          targetType: 'Department',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress,
        },
      });

      return updated;
    });
  },

  async deleteDepartment(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({
        where: { id },
        include: { _count: { select: { courses: true } } },
      });

      if (!department) throw ApiError.notFound('Department not found');

      // Restrictive Deletion Guard: Cannot delete department containing courses
      if (department._count.courses > 0) {
        throw ApiError.conflict(
          `Cannot delete department "${department.name}" because it contains ${department._count.courses} course(s). Please delete or reassign all courses first.`
        );
      }

      const deleted = await tx.department.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.DEPARTMENT_DELETED,
          targetType: 'Department',
          targetId: id,
          details: { name: department.name, code: department.code },
          ipAddress,
        },
      });

      return deleted;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. COURSE / PROGRAM MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async createCourse(actorUserId: string, data: CreateCourseInput, ipAddress?: string) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      throw ApiError.notFound('Referenced department does not exist');
    }

    const codeInUse = await prisma.course.findUnique({
      where: { code: data.code },
    });
    if (codeInUse) {
      throw ApiError.conflict(`Course code "${data.code}" is already in use`);
    }

    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          departmentId: data.departmentId,
          name: data.name,
          code: data.code,
          durationYears: data.durationYears || 4,
          totalSemesters: data.totalSemesters || 8,
        },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.COURSE_CREATED,
          targetType: 'Course',
          targetId: course.id,
          details: { name: course.name, code: course.code, departmentId: course.departmentId },
          ipAddress,
        },
      });

      return course;
    });
  },

  async listCourses(query: ListCoursesQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { masterSubjects: true, students: true },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getCourseById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true, headOfDepartment: true } },
        masterSubjects: {
          orderBy: [{ semesterNumber: 'asc' }, { code: 'asc' }],
          include: {
            _count: { select: { studentSubjects: true } },
          },
        },
        _count: {
          select: { masterSubjects: true, students: true, announcements: true, resources: true },
        },
      },
    });

    if (!course) throw ApiError.notFound('Course not found');
    return course;
  },

  async updateCourse(actorUserId: string, id: string, data: UpdateCourseInput, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.course.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Course not found');

      if (data.departmentId && data.departmentId !== existing.departmentId) {
        const dept = await tx.department.findUnique({ where: { id: data.departmentId } });
        if (!dept) throw ApiError.notFound('Referenced department does not exist');
      }

      if (data.code && data.code !== existing.code) {
        const codeInUse = await tx.course.findUnique({ where: { code: data.code } });
        if (codeInUse) throw ApiError.conflict(`Course code "${data.code}" is already in use`);
      }

      const updated = await tx.course.update({
        where: { id },
        data: {
          ...(data.departmentId ? { departmentId: data.departmentId } : {}),
          ...(data.name ? { name: data.name } : {}),
          ...(data.code ? { code: data.code } : {}),
          ...(data.durationYears ? { durationYears: data.durationYears } : {}),
          ...(data.totalSemesters ? { totalSemesters: data.totalSemesters } : {}),
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.COURSE_UPDATED,
          targetType: 'Course',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress,
        },
      });

      return updated;
    });
  },

  async deleteCourse(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id },
        include: {
          _count: { select: { masterSubjects: true, students: true } },
        },
      });

      if (!course) throw ApiError.notFound('Course not found');

      // Restrictive Deletion Guard 1: Cannot delete course with master subjects
      if (course._count.masterSubjects > 0) {
        throw ApiError.conflict(
          `Cannot delete course "${course.name}" because it contains ${course._count.masterSubjects} master subject(s). Please delete master subjects first.`
        );
      }

      // Restrictive Deletion Guard 2: Cannot delete course with enrolled students
      if (course._count.students > 0) {
        throw ApiError.conflict(
          `Cannot delete course "${course.name}" because ${course._count.students} student(s) are currently enrolled in it.`
        );
      }

      const deleted = await tx.course.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.COURSE_DELETED,
          targetType: 'Course',
          targetId: id,
          details: { name: course.name, code: course.code },
          ipAddress,
        },
      });

      return deleted;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MASTER SUBJECT CATALOG MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async createMasterSubject(
    actorUserId: string,
    data: CreateMasterSubjectInput,
    ipAddress?: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) {
      throw ApiError.notFound('Referenced course does not exist');
    }

    // Invariant: semesterNumber <= course.totalSemesters
    if (data.semesterNumber > course.totalSemesters) {
      throw ApiError.badRequest(
        `Semester number (${data.semesterNumber}) cannot exceed the course total semesters (${course.totalSemesters})`
      );
    }

    const codeInUse = await prisma.masterSubject.findUnique({
      where: {
        courseId_code: {
          courseId: data.courseId,
          code: data.code,
        },
      },
    });
    if (codeInUse) {
      throw ApiError.conflict(`Subject code "${data.code}" already exists in this course`);
    }

    return prisma.$transaction(async (tx) => {
      const masterSubject = await tx.masterSubject.create({
        data: {
          courseId: data.courseId,
          name: data.name,
          code: data.code,
          credits: data.credits || 3,
          semesterNumber: data.semesterNumber || 1,
          description: data.description,
        },
        include: {
          course: {
            select: { id: true, name: true, code: true, department: { select: { id: true, name: true, code: true } } },
          },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.MASTER_SUBJECT_CREATED,
          targetType: 'MasterSubject',
          targetId: masterSubject.id,
          details: { name: masterSubject.name, code: masterSubject.code, courseId: masterSubject.courseId },
          ipAddress,
        },
      });

      return masterSubject;
    });
  },

  async listMasterSubjects(query: ListMasterSubjectsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MasterSubjectWhereInput = {
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.semesterNumber ? { semesterNumber: Number(query.semesterNumber) } : {}),
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.masterSubject.count({ where }),
      prisma.masterSubject.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ semesterNumber: 'asc' }, { code: 'asc' }],
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              department: { select: { id: true, name: true, code: true } },
            },
          },
          _count: { select: { studentSubjects: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getMasterSubjectById(id: string) {
    const masterSubject = await prisma.masterSubject.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            department: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { studentSubjects: true } },
      },
    });

    if (!masterSubject) throw ApiError.notFound('Master subject not found');
    return masterSubject;
  },

  async updateMasterSubject(
    actorUserId: string,
    id: string,
    data: UpdateMasterSubjectInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.masterSubject.findUnique({
        where: { id },
        include: { course: true },
      });
      if (!existing) throw ApiError.notFound('Master subject not found');

      const targetCourseId = data.courseId || existing.courseId;
      const targetCourse =
        data.courseId && data.courseId !== existing.courseId
          ? await tx.course.findUnique({ where: { id: data.courseId } })
          : existing.course;

      if (!targetCourse) throw ApiError.notFound('Referenced course not found');

      const targetSemesterNumber = data.semesterNumber !== undefined ? data.semesterNumber : existing.semesterNumber;
      if (targetSemesterNumber > targetCourse.totalSemesters) {
        throw ApiError.badRequest(
          `Semester number (${targetSemesterNumber}) exceeds course total semesters (${targetCourse.totalSemesters})`
        );
      }

      const targetCode = data.code || existing.code;
      if (targetCode !== existing.code || targetCourseId !== existing.courseId) {
        const codeInUse = await tx.masterSubject.findUnique({
          where: {
            courseId_code: {
              courseId: targetCourseId,
              code: targetCode,
            },
          },
        });
        if (codeInUse && codeInUse.id !== id) {
          throw ApiError.conflict(`Subject code "${targetCode}" already exists in this course`);
        }
      }

      const updated = await tx.masterSubject.update({
        where: { id },
        data: {
          ...(data.courseId ? { courseId: data.courseId } : {}),
          ...(data.name ? { name: data.name } : {}),
          ...(data.code ? { code: data.code } : {}),
          ...(data.credits ? { credits: data.credits } : {}),
          ...(data.semesterNumber ? { semesterNumber: data.semesterNumber } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
        },
        include: {
          course: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.MASTER_SUBJECT_UPDATED,
          targetType: 'MasterSubject',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress,
        },
      });

      return updated;
    });
  },

  async deleteMasterSubject(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const masterSubject = await tx.masterSubject.findUnique({
        where: { id },
        include: { _count: { select: { studentSubjects: true } } },
      });

      if (!masterSubject) throw ApiError.notFound('Master subject not found');

      // Restrictive Deletion Guard: Cannot delete master subject while student subjects reference it
      if (masterSubject._count.studentSubjects > 0) {
        throw ApiError.conflict(
          `Cannot delete master subject "${masterSubject.name}" because ${masterSubject._count.studentSubjects} student personal subject(s) currently reference it.`
        );
      }

      const deleted = await tx.masterSubject.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.MASTER_SUBJECT_DELETED,
          targetType: 'MasterSubject',
          targetId: id,
          details: { name: masterSubject.name, code: masterSubject.code },
          ipAddress,
        },
      });

      return deleted;
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ACADEMIC TERM (SEMESTER CONFIGURATION) MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async createAcademicTerm(
    actorUserId: string,
    data: CreateAcademicTermInput,
    ipAddress?: string
  ) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw ApiError.badRequest('startDate must be strictly before endDate');
    }

    return prisma.$transaction(async (tx) => {
      const term = await tx.academicTerm.create({
        data: {
          name: data.name,
          academicYear: data.academicYear,
          termType: data.termType,
          startDate,
          endDate,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.ACADEMIC_TERM_CREATED,
          targetType: 'AcademicTerm',
          targetId: term.id,
          details: { name: term.name, academicYear: term.academicYear, termType: term.termType },
          ipAddress,
        },
      });

      return term;
    });
  },

  async listAcademicTerms(query: ListAcademicTermsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const isActiveFilter =
      query.isActive === true || (query.isActive as any) === 'true'
        ? true
        : query.isActive === false || (query.isActive as any) === 'false'
        ? false
        : undefined;

    const where: Prisma.AcademicTermWhereInput = {
      ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
      ...(query.academicYear ? { academicYear: Number(query.academicYear) } : {}),
      ...(query.termType ? { termType: query.termType } : {}),
    };

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [total, items] = await prisma.$transaction([
      prisma.academicTerm.count({ where }),
      prisma.academicTerm.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ academicYear: 'desc' }, { startDate: 'desc' }],
        include: {
          _count: { select: { semesters: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAcademicTermById(id: string) {
    const term = await prisma.academicTerm.findUnique({
      where: { id },
      include: {
        _count: { select: { semesters: true } },
      },
    });

    if (!term) throw ApiError.notFound('Academic term not found');
    return term;
  },

  async updateAcademicTerm(
    actorUserId: string,
    id: string,
    data: UpdateAcademicTermInput,
    ipAddress?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.academicTerm.findUnique({ where: { id } });
      if (!existing) throw ApiError.notFound('Academic term not found');

      const targetStartDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const targetEndDate = data.endDate ? new Date(data.endDate) : existing.endDate;

      if (targetStartDate >= targetEndDate) {
        throw ApiError.badRequest('startDate must be strictly before endDate');
      }

      const updated = await tx.academicTerm.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.academicYear ? { academicYear: data.academicYear } : {}),
          ...(data.termType ? { termType: data.termType } : {}),
          ...(data.startDate ? { startDate: targetStartDate } : {}),
          ...(data.endDate ? { endDate: targetEndDate } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.ACADEMIC_TERM_UPDATED,
          targetType: 'AcademicTerm',
          targetId: id,
          details: { previous: existing, updated: data },
          ipAddress,
        },
      });

      return updated;
    });
  },

  async deleteAcademicTerm(actorUserId: string, id: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const term = await tx.academicTerm.findUnique({
        where: { id },
        include: { _count: { select: { semesters: true } } },
      });

      if (!term) throw ApiError.notFound('Academic term not found');

      // Restrictive Deletion Guard: Cannot delete term while personal student semesters reference it
      if (term._count.semesters > 0) {
        throw ApiError.conflict(
          `Cannot delete academic term "${term.name}" because ${term._count.semesters} student semester(s) currently reference it.`
        );
      }

      const deleted = await tx.academicTerm.delete({ where: { id } });

      await tx.adminAuditLog.create({
        data: {
          actorUserId,
          action: ACADEMIC_AUDIT_ACTIONS.ACADEMIC_TERM_DELETED,
          targetType: 'AcademicTerm',
          targetId: id,
          details: { name: term.name, academicYear: term.academicYear },
          ipAddress,
        },
      });

      return deleted;
    });
  },
};
