import { prisma } from '../config/prisma.js';
import { CreateStudyPlanInput, UpdateStudyPlanInput } from '../schemas/studyplan.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const studyPlanService = {
  async createStudyPlan(studentProfileId: string, data: CreateStudyPlanInput) {
    return prisma.studyPlan.create({
      data: {
        studentProfileId,
        title: data.title,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        goals: data.goals ?? null,
        status: data.status ?? 'ACTIVE',
        progressPercentage: data.progressPercentage ?? 0,
      },
    });
  },

  async getStudyPlans(studentProfileId: string) {
    return prisma.studyPlan.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStudyPlanById(studentProfileId: string, studyPlanId: string) {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
    });

    if (!plan || plan.studentProfileId !== studentProfileId) {
      throw ApiError.notFound('Study plan not found');
    }

    return plan;
  },

  async updateStudyPlan(studentProfileId: string, studyPlanId: string, data: UpdateStudyPlanInput) {
    await this.getStudyPlanById(studentProfileId, studyPlanId); // verify ownership

    const updateData: {
      title?: string;
      goals?: string | null;
      status?: 'ACTIVE' | 'COMPLETED';
      progressPercentage?: number;
      targetDate?: Date | null;
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.goals !== undefined) updateData.goals = data.goals ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progressPercentage !== undefined) updateData.progressPercentage = data.progressPercentage;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;

    return prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: updateData,
    });
  },

  async deleteStudyPlan(studentProfileId: string, studyPlanId: string) {
    await this.getStudyPlanById(studentProfileId, studyPlanId); // verify ownership

    await prisma.studyPlan.delete({
      where: { id: studyPlanId },
    });
  },
};
