import { prisma } from '../config/prisma.js';
import { CreateReminderInput, UpdateReminderInput } from '../schemas/reminder.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const reminderService = {
  async createReminder(studentProfileId: string, data: CreateReminderInput) {
    return prisma.reminder.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description,
        triggerAt: new Date(data.triggerAt),
        isCompleted: data.isCompleted ?? false,
      },
    });
  },

  async getReminders(studentProfileId: string) {
    return prisma.reminder.findMany({
      where: {
        studentProfileId,
      },
      orderBy: {
        triggerAt: 'asc',
      },
    });
  },

  async getReminderById(studentProfileId: string, reminderId: string) {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        studentProfileId,
      },
    });

    if (!reminder) {
      throw ApiError.notFound('Reminder not found or does not belong to you');
    }

    return reminder;
  },

  async updateReminder(studentProfileId: string, reminderId: string, data: UpdateReminderInput) {
    // Verify ownership first
    await this.getReminderById(studentProfileId, reminderId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.triggerAt !== undefined) updateData.triggerAt = new Date(data.triggerAt);
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

    return prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
    });
  },

  async deleteReminder(studentProfileId: string, reminderId: string) {
    // Verify ownership first
    await this.getReminderById(studentProfileId, reminderId);

    await prisma.reminder.delete({
      where: { id: reminderId },
    });
  },
};
