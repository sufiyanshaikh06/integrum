import { lockOwnedSubject, validateAttendanceTotals } from './attendance-consistency.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { semesterService } from './semester.service.js';

export const subjectService = {
  async createSubject(studentProfileId: string, data: any) {
    // Enforce ownership boundary
    await semesterService.getSemesterById(studentProfileId, data.semesterId);

    validateAttendanceTotals(data.totalClasses ?? 0, data.attendedClasses ?? 0);
    return prisma.subject.create({
      data: {
        semesterId: data.semesterId,
        name: data.name,
        code: data.code,
        credits: data.credits,
        targetGrade: data.targetGrade,
        totalClasses: data.totalClasses ?? 0,
        attendedClasses: data.attendedClasses ?? 0,
        attendanceGoal: data.attendanceGoal,
      },
    });
  },

  async getSubjects(studentProfileId: string, semesterId?: string) {
    const whereClause: any = {
      semester: { studentProfileId },
    };
    if (semesterId) {
      whereClause.semesterId = semesterId;
    }
    return prisma.subject.findMany({
      where: whereClause,
      include: { semester: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSubjectById(studentProfileId: string, subjectId: string) {
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        semester: { studentProfileId },
      },
      include: {
        semester: { select: { id: true, name: true } },
        assignments: true,
      }
    });

    if (!subject) {
      throw ApiError.notFound('Subject not found or does not belong to you');
    }
    return subject;
  },

  async updateSubject(studentProfileId: string, subjectId: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.credits !== undefined) updateData.credits = data.credits;
    if (data.targetGrade !== undefined) updateData.targetGrade = data.targetGrade;
    if (data.totalClasses !== undefined) updateData.totalClasses = data.totalClasses;
    if (data.attendedClasses !== undefined) updateData.attendedClasses = data.attendedClasses;
    if (data.attendanceGoal !== undefined) updateData.attendanceGoal = data.attendanceGoal;

    return prisma.$transaction(async tx => {
      const subject = await lockOwnedSubject(tx, studentProfileId, subjectId);
      if (data.totalClasses !== undefined || data.attendedClasses !== undefined) {
        if (await tx.attendanceRecord.count({ where: { subjectId } })) {
          throw ApiError.conflict('Attendance totals are calculated from individual records; edit those records instead');
        }
        validateAttendanceTotals(data.totalClasses ?? subject.totalClasses, data.attendedClasses ?? subject.attendedClasses);
      }
      return tx.subject.update({ where: { id: subjectId }, data: updateData });
    }, { isolationLevel: 'ReadCommitted' });
  },

  async deleteSubject(studentProfileId: string, subjectId: string) {
    // Verify ownership
    await this.getSubjectById(studentProfileId, subjectId);

    await prisma.subject.delete({
      where: { id: subjectId },
    });
    return { success: true };
  },
};
