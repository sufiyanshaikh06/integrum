import type { Prisma } from '@prisma/client';
import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { CreateReminderInput, UpdateReminderInput } from '../schemas/reminder.schema.js';
import { ApiError } from '../utils/ApiError.js';

let isProcessing = false;
let timer: NodeJS.Timeout | null = null;
let activeBatchPromise: Promise<{ processedCount: number; skippedCount: number }> | null = null;

export const reminderService = {
  async createReminder(studentProfileId: string, data: CreateReminderInput) {
    return prisma.reminder.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description ?? null,
        triggerAt: new Date(data.triggerAt),
        deliveryStatus: 'PENDING',
      },
    });
  },

  async getReminders(studentProfileId: string) {
    return prisma.reminder.findMany({
      where: { studentProfileId },
      orderBy: { triggerAt: 'asc' },
    });
  },

  async getReminderById(studentProfileId: string, reminderId: string) {
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder || reminder.studentProfileId !== studentProfileId) {
      throw ApiError.notFound('Reminder not found');
    }

    return reminder;
  },

  async updateReminder(studentProfileId: string, reminderId: string, data: UpdateReminderInput) {
    await this.getReminderById(studentProfileId, reminderId); // verify ownership

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.triggerAt !== undefined) updateData.triggerAt = new Date(data.triggerAt);
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted;
      if (data.isCompleted) {
        updateData.deliveryStatus = 'CANCELLED';
      }
    }

    return prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
    });
  },

  async deleteReminder(studentProfileId: string, reminderId: string) {
    await this.getReminderById(studentProfileId, reminderId); // verify ownership

    await prisma.reminder.delete({
      where: { id: reminderId },
    });
  },

  // W03: Source synchronization helper within caller's transaction
  async syncSourceReminder(
    tx: Prisma.TransactionClient,
    params: {
      studentProfileId: string;
      sourceType: string;
      sourceId: string;
      occurrenceKey: string;
      title: string;
      description?: string | null;
      targetDate: Date | null;
      leadTimeMs?: number;
      cancelled?: boolean;
    }
  ) {
    if (params.cancelled || !params.targetDate) {
      await tx.reminder.updateMany({
        where: {
          studentProfileId: params.studentProfileId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          occurrenceKey: params.occurrenceKey,
          deliveryStatus: 'PENDING',
        },
        data: {
          deliveryStatus: 'CANCELLED',
        },
      });
      return;
    }

    const leadTimeMs = params.leadTimeMs ?? (24 * 60 * 60 * 1000); // default 24 hours
    const triggerAt = params.targetDate.getTime() > Date.now() + leadTimeMs
      ? new Date(params.targetDate.getTime() - leadTimeMs)
      : new Date();

    const existing = await tx.reminder.findUnique({
      where: {
        studentProfileId_sourceType_sourceId_occurrenceKey: {
          studentProfileId: params.studentProfileId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          occurrenceKey: params.occurrenceKey,
        },
      },
    });

    if (!existing) {
      await tx.reminder.create({
        data: {
          studentProfileId: params.studentProfileId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          occurrenceKey: params.occurrenceKey,
          title: params.title,
          description: params.description ?? null,
          triggerAt,
          deliveryStatus: 'PENDING',
        },
      });
    } else {
      await tx.reminder.update({
        where: { id: existing.id },
        data: {
          title: params.title,
          description: params.description ?? null,
          triggerAt,
          ...(existing.deliveryStatus === 'CANCELLED' || existing.deliveryStatus === 'SKIPPED'
            ? { deliveryStatus: 'PENDING', deliveredAt: null, suppressedAt: null }
            : {}),
        },
      });
    }
  },

  async cancelSourceReminders(
    tx: Prisma.TransactionClient,
    params: {
      studentProfileId: string;
      sourceType: string;
      sourceId: string;
    }
  ) {
    await tx.reminder.updateMany({
      where: {
        studentProfileId: params.studentProfileId,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        deliveryStatus: 'PENDING',
      },
      data: {
        deliveryStatus: 'CANCELLED',
      },
    });
  },

  // W03 / B06: Atomic batch processor with overlapping-batch protection & per-item recovery
  async processDueReminders(): Promise<{ processedCount: number; skippedCount: number }> {
    if (isProcessing) return { processedCount: 0, skippedCount: 0 };
    isProcessing = true;

    activeBatchPromise = (async () => {
      let processedCount = 0;
      let skippedCount = 0;

      try {
        const candidates = await prisma.reminder.findMany({
          where: {
            triggerAt: { lte: new Date() },
            deliveryStatus: 'PENDING',
          },
          select: { id: true },
          orderBy: { triggerAt: 'asc' },
          take: 50,
        });

        for (const { id } of candidates) {
          try {
            await prisma.$transaction(async (tx) => {
              // Atomic lock and transition to processing / claim
              const claim = await tx.reminder.updateMany({
                where: { id, triggerAt: { lte: new Date() }, deliveryStatus: 'PENDING' },
                data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() },
              });
              if (claim.count !== 1) return; // already claimed, cancelled, or rescheduled

              const reminder = await tx.reminder.findUniqueOrThrow({
                where: { id },
                include: {
                  studentProfile: {
                    include: { user: { include: { settings: true } } },
                  },
                },
              });

              const prefs = reminder.studentProfile.user.settings?.notificationPreferences as Record<string, boolean> | null;
              let suppressed = false;
              if (prefs) {
                if (reminder.sourceType === 'ASSIGNMENT' && prefs.assignmentReminders === false) suppressed = true;
                if (reminder.sourceType === 'EXAM' && prefs.examReminders === false) suppressed = true;
                if (reminder.sourceType === 'INTERVIEW' && prefs.interviewReminders === false) suppressed = true;
                if (reminder.sourceType === 'CERTIFICATION' && prefs.certificationReminders === false) suppressed = true;
                // CRITICAL: emailNotifications === false does NOT suppress in-app notifications!
              }

              if (suppressed) {
                await tx.reminder.update({
                  where: { id },
                  data: {
                    deliveryStatus: 'SKIPPED',
                    deliveredAt: null,
                    suppressedAt: new Date(),
                  },
                });
                skippedCount++;
                return;
              }

              let notifType: NotificationType = NotificationType.GENERAL_REMINDER;
              if (reminder.sourceType === 'ASSIGNMENT') notifType = NotificationType.ASSIGNMENT_REMINDER;
              else if (reminder.sourceType === 'INTERVIEW') notifType = NotificationType.PLACEMENT_ALERT;
              else if (reminder.sourceType === 'EXAM') notifType = NotificationType.EXAM_REMINDER;
              else if (reminder.sourceType === 'CERTIFICATION') notifType = NotificationType.CERTIFICATION_ALERT;

              await tx.notification.create({
                data: {
                  userId: reminder.studentProfile.userId,
                  title: reminder.title,
                  message: reminder.description || reminder.title,
                  type: notifType,
                  triggerTime: reminder.triggerAt,
                  isRead: false,
                },
              });

              processedCount++;
            });
          } catch (err) {
            console.error(`Error processing reminder ${id}:`, err);
            // Rollback tentative claim on error so it can be retried
            await prisma.reminder.updateMany({
              where: { id, deliveryStatus: 'DELIVERED', deliveredAt: { not: null } },
              data: { deliveryStatus: 'PENDING', deliveredAt: null },
            }).catch(() => {});
          }
        }
      } finally {
        isProcessing = false;
        activeBatchPromise = null;
      }

      return { processedCount, skippedCount };
    })();

    return activeBatchPromise;
  },

  startReminderProcessor(intervalMs = 60000) {
    if (!timer) {
      timer = setInterval(() => {
        this.processDueReminders().catch((e) => console.error('Reminder processor tick error:', e));
      }, intervalMs);
      timer.unref(); // Don't hold node process open
    }
    return timer;
  },

  async stopReminderProcessor(): Promise<void> {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (activeBatchPromise) {
      await activeBatchPromise;
    }
  },

  isProcessorRunning(): boolean {
    return timer !== null;
  },
};
