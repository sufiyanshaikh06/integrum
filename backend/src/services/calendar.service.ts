import { prisma } from '../config/prisma.js';
import { CreateCalendarEventInput, UpdateCalendarEventInput } from '../schemas/calendar.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const calendarService = {
  async createCalendarEvent(studentProfileId: string, data: CreateCalendarEventInput) {
    if (data.endDate && new Date(data.endDate) < new Date(data.date)) {
      throw ApiError.badRequest('End date must be greater than or equal to start date');
    }
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
    return prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; studentProfileId: string; date: Date; endDate: Date | null }>>`
        SELECT "id", "studentProfileId", "date", "endDate"
        FROM "CalendarEvent"
        WHERE "id" = ${eventId}
        FOR UPDATE
      `;

      const event = locked[0];
      if (!event || event.studentProfileId !== studentProfileId) {
        throw ApiError.notFound('Calendar event not found');
      }

      const effectiveDate = data.date !== undefined ? new Date(data.date) : event.date;
      const effectiveEndDate = data.endDate !== undefined
        ? (data.endDate ? new Date(data.endDate) : null)
        : event.endDate;

      if (effectiveEndDate !== null && effectiveEndDate < effectiveDate) {
        throw ApiError.badRequest('End date must be greater than or equal to start date');
      }

      const updateData: {
        title?: string;
        description?: string | null;
        date?: Date;
        endDate?: Date | null;
        eventType?: 'CLASS' | 'EXAM' | 'HOLIDAY' | 'COLLEGE_EVENT';
      } = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description ?? null;
      if (data.date !== undefined) updateData.date = effectiveDate;
      if (data.endDate !== undefined) updateData.endDate = effectiveEndDate;
      if (data.eventType !== undefined) updateData.eventType = data.eventType;

      return tx.calendarEvent.update({
        where: { id: eventId },
        data: updateData,
      });
    }, {
      isolationLevel: 'ReadCommitted',
    });
  },

  async deleteCalendarEvent(studentProfileId: string, eventId: string) {
    await this.getCalendarEventById(studentProfileId, eventId); // verify ownership

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  },
};
