import type { Prisma } from '@prisma/client';
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

  // W05: Unified Calendar Projection
  async getUnifiedCalendar(userId: string, studentProfileId: string, startDateStr: string, endDateStr: string) {
    const windowStart = new Date(startDateStr);
    const windowEnd = new Date(endDateStr);

    return prisma.$transaction(async (tx) => {
      // 1. Fetch student profile and course/dept info for safe audience scoping
      const profile = await tx.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { id: true, courseId: true, course: { select: { departmentId: true } } },
      });
      if (!profile) throw ApiError.notFound('Student profile not found');

      const courseId = profile.courseId ?? null;
      const departmentId = profile.course?.departmentId ?? null;

      const audienceConditions: Prisma.InstitutionalEventWhereInput[] = [
        { targetScope: 'ALL' },
      ];
      if (departmentId) {
        audienceConditions.push({ targetScope: 'DEPARTMENT', departmentId });
      }
      if (courseId) {
        audienceConditions.push({ targetScope: 'COURSE', courseId });
      }

      // Query all 5 sources concurrently under RepeatableRead snapshot
      const [personalEvents, assignments, tasks, jobApplications, institutionalEvents] = await Promise.all([
        // Personal Events: CalendarEvent
        tx.calendarEvent.findMany({
          where: {
            studentProfileId,
            date: { lte: windowEnd },
            OR: [
              { endDate: { gte: windowStart } },
              { endDate: null, date: { gte: windowStart } },
            ],
          },
        }),

        // Assignments
        tx.assignment.findMany({
          where: {
            subject: { semester: { studentProfileId } },
            dueDate: { gte: windowStart, lte: windowEnd, not: null },
          },
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        }),

        // Tasks
        tx.task.findMany({
          where: {
            studentProfileId,
            dueDate: { gte: windowStart, lte: windowEnd, not: null },
          },
        }),

        // Job Applications
        tx.jobApplication.findMany({
          where: {
            studentProfileId,
            OR: [
              { interviewDate: { gte: windowStart, lte: windowEnd, not: null } },
              { interviewHistory: { not: 'null' as any } },
            ],
          },
        }),

        // Institutional Broadcast Events
        tx.institutionalEvent.findMany({
          where: {
            isPublished: true,
            startDate: { lte: windowEnd },
            OR: [
              { endDate: { gte: windowStart } },
              { endDate: null, startDate: { gte: windowStart } },
            ],
            AND: [
              {
                OR: audienceConditions,
              },
            ],
          },
        }),
      ]);

      const items: Array<{
        id: string;
        source: 'PERSONAL' | 'ASSIGNMENT' | 'TASK' | 'INTERVIEW' | 'INSTITUTIONAL';
        sourceId: string;
        title: string;
        description: string | null;
        startDate: string;
        endDate: string | null;
        category: string;
        metadata: Record<string, unknown>;
      }> = [];

      // 1. Personal Events
      for (const p of personalEvents) {
        items.push({
          id: `PERSONAL:${p.id}`,
          source: 'PERSONAL',
          sourceId: p.id,
          title: p.title,
          description: p.description,
          startDate: p.date.toISOString(),
          endDate: p.endDate ? p.endDate.toISOString() : null,
          category: p.eventType,
          metadata: {},
        });
      }

      // 2. Assignments
      for (const a of assignments) {
        items.push({
          id: `ASSIGNMENT:${a.id}`,
          source: 'ASSIGNMENT',
          sourceId: a.id,
          title: a.title,
          description: a.description,
          startDate: a.dueDate!.toISOString(),
          endDate: null,
          category: 'DEADLINE',
          metadata: {
            subjectId: a.subjectId,
            subjectName: a.subject.name,
            subjectCode: a.subject.code,
            priority: a.priority,
            status: a.status,
          },
        });
      }

      // 3. Tasks
      for (const t of tasks) {
        items.push({
          id: `TASK:${t.id}`,
          source: 'TASK',
          sourceId: t.id,
          title: t.title,
          description: t.description,
          startDate: t.dueDate!.toISOString(),
          endDate: null,
          category: 'TASK',
          metadata: {
            priority: t.priority,
            status: t.status,
            studyPlanId: t.studyPlanId,
          },
        });
      }

      // 4. Job Applications & Interviews
      for (const app of jobApplications) {
        const history = Array.isArray(app.interviewHistory) ? (app.interviewHistory as any[]) : [];
        if (history.length > 0) {
          // Display each interview round from history if within window
          history.forEach((round, index) => {
            if (round && round.date) {
              const rDate = new Date(round.date);
              if (rDate >= windowStart && rDate <= windowEnd) {
                items.push({
                  id: `INTERVIEW:${app.id}:${index}`,
                  source: 'INTERVIEW',
                  sourceId: app.id,
                  title: `Interview (${round.round}): ${app.companyName} - ${app.role}`,
                  description: round.notes ?? null,
                  startDate: rDate.toISOString(),
                  endDate: null,
                  category: 'INTERVIEW',
                  metadata: {
                    applicationId: app.id,
                    companyName: app.companyName,
                    role: app.role,
                    round: round.round,
                    outcome: round.outcome,
                  },
                });
              }
            }
          });
        } else if (app.interviewDate) {
          // Fall back to legacy fields if interviewHistory is absent
          if (app.interviewDate >= windowStart && app.interviewDate <= windowEnd) {
            items.push({
              id: `INTERVIEW:${app.id}:legacy`,
              source: 'INTERVIEW',
              sourceId: app.id,
              title: `Interview (${app.interviewRound || 'Scheduled'}): ${app.companyName} - ${app.role}`,
              description: app.notes,
              startDate: app.interviewDate.toISOString(),
              endDate: null,
              category: 'INTERVIEW',
              metadata: {
                applicationId: app.id,
                companyName: app.companyName,
                role: app.role,
                round: app.interviewRound,
              },
            });
          }
        }
      }

      // 5. Institutional Events
      for (const inst of institutionalEvents) {
        items.push({
          id: `INSTITUTIONAL:${inst.id}`,
          source: 'INSTITUTIONAL',
          sourceId: inst.id,
          title: inst.title,
          description: inst.description,
          startDate: inst.startDate.toISOString(),
          endDate: inst.endDate ? inst.endDate.toISOString() : null,
          category: inst.category,
          metadata: {
            targetScope: inst.targetScope,
            location: inst.location,
          },
        });
      }

      // Sort by startDate ASC, then id ASC
      items.sort((x, y) => {
        const timeDiff = new Date(x.startDate).getTime() - new Date(y.startDate).getTime();
        if (timeDiff !== 0) return timeDiff;
        return x.id.localeCompare(y.id);
      });

      return items;
    }, {
      isolationLevel: 'RepeatableRead',
    });
  },
};
