import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { CreateStudyPlanInput, UpdateStudyPlanInput, AcceptAiStudyPlanInput } from '../schemas/studyplan.schema.js';
import { ApiError } from '../utils/ApiError.js';

const DAY_OFFSET_MAP: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

function computeCanonicalHash(payload: any): string {
  const { idempotencyKey, ...rest } = payload;
  const canonicalJson = canonicalStringify(rest);
  return createHash('sha256').update(canonicalJson).digest('hex');
}

function resolveBaseMonday(referenceDateStr?: string): Date {
  if (referenceDateStr) {
    const d = new Date(referenceDateStr);
    if (!isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      const day = d.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setUTCDate(d.getUTCDate() + diff);
      return d;
    }
  }

  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const currentDay = now.getUTCDay();
  const daysUntilMonday = currentDay === 1 ? 0 : ((1 + 7 - currentDay) % 7);
  now.setUTCDate(now.getUTCDate() + daysUntilMonday);
  return now;
}

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
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStudyPlanById(studentProfileId: string, studyPlanId: string) {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: { tasks: true },
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

  // W02 / W16: Idempotent AI study plan acceptance with dated session projection and supplemental tasks
  async acceptAiStudyPlan(
    studentProfileId: string,
    rawPayload: AcceptAiStudyPlanInput,
    idempotencyKeyHeader?: string
  ) {
    const planContent = rawPayload.plan ? { ...rawPayload.plan, ...rawPayload } : { ...rawPayload };
    const idempotencyKey = idempotencyKeyHeader || rawPayload.idempotencyKey || planContent.idempotencyKey;

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
      throw ApiError.badRequest('Idempotency key is required');
    }

    const title = planContent.title;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw ApiError.badRequest('Study plan title is required');
    }

    const canonicalHash = computeCanonicalHash(planContent);

    // 1. Idempotency Check: look for existing record
    const existing = await prisma.studyPlan.findUnique({
      where: {
        studentProfileId_idempotencyKey: {
          studentProfileId,
          idempotencyKey,
        },
      },
      include: { tasks: true },
    });

    if (existing) {
      if (existing.canonicalHash === canonicalHash) {
        return { plan: existing, isDuplicate: true };
      }
      throw ApiError.conflict('Idempotency key conflict: payload does not match original request');
    }

    // 2. Map weekly schedule to concrete dates
    const baseMonday = resolveBaseMonday(
      planContent.startDate || planContent.targetWeekStart || planContent.recommendedTargetDate || planContent.targetDate
    );

    const rawWeeklySchedule = Array.isArray(planContent.weeklySchedule) ? planContent.weeklySchedule : [];
    const mappedSchedule = rawWeeklySchedule.map((session: any) => {
      if (!session.topic || typeof session.topic !== 'string' || session.topic.trim() === '') {
        throw ApiError.badRequest('Session topic is required');
      }
      const dayKey = (session.day || 'MONDAY').toUpperCase();
      const offset = DAY_OFFSET_MAP[dayKey] ?? 0;
      const sessionDate = new Date(baseMonday.getTime() + offset * 86400000);

      if (session.startTime && typeof session.startTime === 'string') {
        const [h, m] = session.startTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          sessionDate.setUTCHours(h, m, 0, 0);
        } else {
          sessionDate.setUTCHours(9, 0, 0, 0);
        }
      } else {
        sessionDate.setUTCHours(9, 0, 0, 0);
      }

      const durationMinutes = Number(session.durationMinutes) || 60;
      const endDate = new Date(sessionDate.getTime() + durationMinutes * 60000);

      return {
        ...session,
        date: sessionDate.toISOString(),
        startDate: sessionDate.toISOString(),
        endDate: endDate.toISOString(),
        durationMinutes,
        subjectId: session.subjectId ?? null,
      };
    });

    const targetDateStr = planContent.targetDate || planContent.recommendedTargetDate;
    const targetDate = targetDateStr ? new Date(targetDateStr) : null;
    const goals = planContent.goals || planContent.overview || null;

    // Validate supplemental tasks before starting transaction
    const supplementalTasks = Array.isArray(planContent.suggestedTasks)
      ? planContent.suggestedTasks
      : Array.isArray(planContent.tasks)
      ? planContent.tasks
      : [];

    for (const t of supplementalTasks) {
      if (!t.title || typeof t.title !== 'string' || t.title.trim() === '') {
        throw ApiError.badRequest('Task title is required');
      }
    }

    const scheduleData = {
      ...planContent,
      baseMonday: baseMonday.toISOString(),
      weeklySchedule: mappedSchedule,
      datedSchedule: mappedSchedule,
    };

    try {
      return await prisma.$transaction(async (tx) => {
        const createdPlan = await tx.studyPlan.create({
          data: {
            studentProfileId,
            title: title.trim(),
            targetDate,
            goals,
            idempotencyKey,
            canonicalHash,
            scheduleData,
            status: 'ACTIVE',
            progressPercentage: 0,
          },
        });

        // 3. Persist study session tasks
        for (const session of mappedSchedule) {
          await tx.task.create({
            data: {
              studentProfileId,
              studyPlanId: createdPlan.id,
              title: session.topic.trim(),
              description: session.activity ? `${session.activity} (${session.durationMinutes}m)` : null,
              dueDate: new Date(session.date),
              priority: 'MEDIUM',
              status: 'TODO',
            },
          });
        }

        // 4. Persist supplemental suggested tasks
        for (const t of supplementalTasks) {
          await tx.task.create({
            data: {
              studentProfileId,
              studyPlanId: createdPlan.id,
              title: t.title.trim(),
              description: t.description ?? null,
              dueDate: t.dueDate ? new Date(t.dueDate) : targetDate,
              priority: (t.priority === 'URGENT' ? 'HIGH' : (t.priority ?? 'MEDIUM')) as 'LOW' | 'MEDIUM' | 'HIGH',
              status: 'TODO',
            },
          });
        }

        const fullPlan = await tx.studyPlan.findUniqueOrThrow({
          where: { id: createdPlan.id },
          include: { tasks: true },
        });

        return { plan: fullPlan, isDuplicate: false };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const raceExisting = await prisma.studyPlan.findUnique({
          where: {
            studentProfileId_idempotencyKey: {
              studentProfileId,
              idempotencyKey,
            },
          },
          include: { tasks: true },
        });
        if (raceExisting) {
          if (raceExisting.canonicalHash === canonicalHash) {
            return { plan: raceExisting, isDuplicate: true };
          }
          throw ApiError.conflict('Idempotency key conflict: payload does not match original request');
        }
      }
      throw err;
    }
  },
};
