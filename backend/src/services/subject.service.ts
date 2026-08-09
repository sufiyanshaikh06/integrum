import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { semesterService } from './semester.service.js';

export const subjectService = {
  async createSubject(studentProfileId: string, data: any) {
    // Enforce ownership boundary
    await semesterService.getSemesterById(studentProfileId, data.semesterId);

    return prisma.subject.create({
      data: {
        semesterId: data.semesterId,
        name: data.name,
        code: data.code,
        credits: data.credits,
        targetGrade: data.targetGrade,
        totalClasses: data.totalClasses ?? 0,
        attendedClasses: data.attendedClasses ?? 0,
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
    // Verify ownership
    await this.getSubjectById(studentProfileId, subjectId);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.credits !== undefined) updateData.credits = data.credits;
    if (data.targetGrade !== undefined) updateData.targetGrade = data.targetGrade;
    if (data.totalClasses !== undefined) updateData.totalClasses = data.totalClasses;
    if (data.attendedClasses !== undefined) updateData.attendedClasses = data.attendedClasses;

    return prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
    });
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
