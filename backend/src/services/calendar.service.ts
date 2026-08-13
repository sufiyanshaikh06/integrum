import { prisma } from '../config/prisma.js';
import { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const calendarService = {
  async createCalendarEvent(studentProfileId: string, data: CreateCalendarEventInput) {
    return prisma.calendarEvent.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
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

    return prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  },

  async deleteCalendarEvent(studentProfileId: string, eventId: string) {
    await this.getCalendarEventById(studentProfileId, eventId); // verify ownership

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  },
};
