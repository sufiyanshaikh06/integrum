import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';

export const taskService = {
  async verifyStudyPlanOwnership(studentProfileId: string, studyPlanId?: string | null) {
    if (!studyPlanId) return;
    const plan = await prisma.studyPlan.findFirst({
      where: { id: studyPlanId, studentProfileId }, select: { id: true },
    });
    if (!plan) throw ApiError.notFound('Study plan not found or does not belong to you');
  },

  async createTask(studentProfileId: string, data: CreateTaskInput) {
    await this.verifyStudyPlanOwnership(studentProfileId, data.studyPlanId);
    const taskData: Parameters<typeof prisma.task.create>[0]['data'] = {
      studentProfileId,
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      studyPlanId: data.studyPlanId ?? null,
      completedAt: data.status === 'DONE' ? new Date() : null,
    };
    if (data.priority !== undefined) taskData.priority = data.priority;
    if (data.status !== undefined) taskData.status = data.status;

    return prisma.task.create({
      data: taskData,
    });
  },

  async getTasks(studentProfileId: string) {
    return prisma.task.findMany({
      where: { studentProfileId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // I-6: Upcoming Tasks — due in future, not yet completed
  async getUpcomingTasks(studentProfileId: string) {
    return prisma.task.findMany({
      where: {
        studentProfileId,
        status: { not: 'DONE' },
        dueDate: { gt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
    });
  },

  async getTaskById(studentProfileId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        studentProfileId,
      },
    });

    if (!task) {
      throw ApiError.notFound('Task not found or does not belong to you');
    }
    return task;
  },

  async updateTask(studentProfileId: string, taskId: string, data: UpdateTaskInput) {
    const existing = await this.getTaskById(studentProfileId, taskId);

    await this.verifyStudyPlanOwnership(studentProfileId, data.studyPlanId);

    const updateData: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      completedAt?: Date | null;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      studyPlanId?: string | null;
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.studyPlanId !== undefined) updateData.studyPlanId = data.studyPlanId;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'DONE') {
        if (!existing.completedAt) {
          updateData.completedAt = new Date();
        }
      } else {
        if (existing.completedAt !== null || existing.status === 'DONE') {
          updateData.completedAt = null;
        }
      }
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });
  },

  async deleteTask(studentProfileId: string, taskId: string) {
    await this.getTaskById(studentProfileId, taskId);
    await prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  },
};
