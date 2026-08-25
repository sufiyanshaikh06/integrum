import { prisma } from '../config/prisma.js';
import { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const calendarService = {
  async createCalendarEvent(studentProfileId: string, data: CreateCalendarEventInput) {
    return prisma.calendarEvent.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description ?? null,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        eventType: data.eventType,
      },
    });
  },

  async getCalendarEvents(studentProfileId: string) {
    return prisma.calendarEvent.findMany({
      where: { studentProfileId },
      orderBy: { date: 'asc' },
    });
  },

  async getCalendarEventById(studentProfileId: string, eventId: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.studentProfileId !== studentProfileId) {
      throw ApiError.notFound('Calendar event not found');
    }

    return event;
  },

  async updateCalendarEvent(studentProfileId: string, eventId: string, data: UpdateCalendarEventInput) {
    await this.getCalendarEventById(studentProfileId, eventId); // verify ownership

    const updateData: {
      title?: string;
      description?: string | null;
      date?: Date;
      endDate?: Date | null;
      eventType?: 'CLASS' | 'EXAM' | 'HOLIDAY' | 'COLLEGE_EVENT';
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.eventType !== undefined) updateData.eventType = data.eventType;

    return prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
    });
  },

  async deleteCalendarEvent(studentProfileId: string, eventId: string) {
    await this.getCalendarEventById(studentProfileId, eventId); // verify ownership

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  },
};
