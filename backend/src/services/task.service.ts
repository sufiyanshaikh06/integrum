import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export const taskService = {
  async createTask(studentProfileId: string, data: any) {
    return prisma.task.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
        studyPlanId: data.studyPlanId,
      },
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

  async updateTask(studentProfileId: string, taskId: string, data: any) {
    await this.getTaskById(studentProfileId, taskId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.studyPlanId !== undefined) updateData.studyPlanId = data.studyPlanId;

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
