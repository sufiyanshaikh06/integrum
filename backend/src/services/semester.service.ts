import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const termSelection = { id: true, name: true, academicYear: true, termType: true, startDate: true, endDate: true, isActive: true } as const;

async function validateTerm(tx: Prisma.TransactionClient, id: string) {
  // Hold the calendar row while attaching; admin updates/deletion use an exclusive lock.
  await tx.$queryRaw`SELECT "id" FROM "AcademicTerm" WHERE "id" = ${id} FOR SHARE`;
  const term = await tx.academicTerm.findUnique({ where: { id } });
  if (!term) throw ApiError.notFound('Academic term not found');
  if (!term.isActive) throw ApiError.conflict('Select an active academic term');
}

function validateDates(start: Date, end: Date) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
    throw ApiError.badRequest('End date must be after start date');
  }
}

export const semesterService = {
  async createSemester(studentProfileId: string, data: any) {
    const startDate = new Date(data.startDate), endDate = new Date(data.endDate);
    validateDates(startDate, endDate);
    return prisma.$transaction(async tx => {
      if (data.academicTermId) await validateTerm(tx, data.academicTermId);
      return tx.semester.create({
        data: { studentProfileId, name: data.name, startDate, endDate, academicTermId: data.academicTermId ?? null },
        include: { academicTerm: { select: termSelection } },
      });
    }, { isolationLevel: 'ReadCommitted' });
  },

  async listAcademicTerms(page: number, limit: number) {
    const [total, items] = await prisma.$transaction([
      prisma.academicTerm.count({ where: { isActive: true } }),
      prisma.academicTerm.findMany({
        where: { isActive: true }, select: termSelection,
        orderBy: [{ startDate: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit,
      }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getSemesters(studentProfileId: string) {
    return prisma.semester.findMany({
      where: { studentProfileId },
      orderBy: { startDate: 'desc' },
      include: { academicTerm: { select: termSelection } },
    });
  },

  async getSemesterById(studentProfileId: string, semesterId: string) {
    const semester = await prisma.semester.findFirst({
      where: {
        id: semesterId,
        studentProfileId,
      },
      include: {
        subjects: true,
        academicTerm: { select: termSelection },
      }
    });

    if (!semester) {
      throw ApiError.notFound('Semester not found or does not belong to you');
    }

    return semester;
  },

  async updateSemester(studentProfileId: string, semesterId: string, data: any) {
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Semester" WHERE "id" = ${semesterId}
        AND "studentProfileId" = ${studentProfileId} FOR UPDATE`;
      const existing = await tx.semester.findFirst({ where: { id: semesterId, studentProfileId } });
      if (!existing) throw ApiError.notFound('Semester not found or does not belong to you');
      const startDate = data.startDate !== undefined ? new Date(data.startDate) : existing.startDate;
      const endDate = data.endDate !== undefined ? new Date(data.endDate) : existing.endDate;
      validateDates(startDate, endDate);
      if (data.academicTermId && data.academicTermId !== existing.academicTermId) {
        await validateTerm(tx, data.academicTermId);
      }
      const changed = await tx.semester.updateMany({
        where: { id: semesterId, studentProfileId, startDate: existing.startDate, endDate: existing.endDate, academicTermId: existing.academicTermId },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}), startDate, endDate,
          ...(data.academicTermId !== undefined ? { academicTermId: data.academicTermId } : {}),
        },
      });
      if (changed.count !== 1) throw ApiError.conflict('Semester changed during this edit; reload and retry');
      return tx.semester.findUniqueOrThrow({ where: { id: semesterId }, include: { academicTerm: { select: termSelection } } });
    }, { isolationLevel: 'ReadCommitted' });
  },

  async deleteSemester(studentProfileId: string, semesterId: string) {
    // Verify ownership first
    await this.getSemesterById(studentProfileId, semesterId);

    await prisma.semester.delete({
      where: { id: semesterId },
    });

    return { success: true };
  },
};
