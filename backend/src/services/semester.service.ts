import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const semesterService = {
  async createSemester(studentProfileId: string, data: any) {
    return prisma.semester.create({
      data: {
        studentProfileId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  },

  async getSemesters(studentProfileId: string) {
    return prisma.semester.findMany({
      where: { studentProfileId },
      orderBy: { startDate: 'desc' },
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
      }
    });

    if (!semester) {
      throw ApiError.notFound('Semester not found or does not belong to you');
    }

    return semester;
  },

  async updateSemester(studentProfileId: string, semesterId: string, data: any) {
    // Verify ownership first
    await this.getSemesterById(studentProfileId, semesterId);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.semester.update({
      where: { id: semesterId },
      data: updateData,
    });
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
