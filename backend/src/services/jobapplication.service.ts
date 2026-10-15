import { ApplicationType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { CreateJobApplicationInput, UpdateJobApplicationInput } from '../schemas/jobapplication.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { reminderService } from './reminder.service.js';

export const jobApplicationService = {
  async createApplication(studentProfileId: string, data: CreateJobApplicationInput) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.jobApplication.create({
        data: {
          studentProfileId,
          applicationType: data.applicationType ?? 'INTERNSHIP',
          eligibilityStatus: data.eligibilityStatus ?? 'UNKNOWN',
          interviewHistory: data.interviewHistory ?? Prisma.DbNull,
          companyName: data.companyName,
          role: data.role,
          applicationUrl: data.applicationUrl ?? null,
          notes: data.notes ?? null,
          appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
          status: data.status ?? 'APPLIED',
          // C-5: Interview
          interviewDate: data.interviewDate ? new Date(data.interviewDate) : null,
          interviewRound: data.interviewRound ?? null,
          // C-6: Offer
          offerDetails: data.offerDetails ?? Prisma.DbNull,
        },
      });

      if (application.status !== 'REJECTED') {
        if (Array.isArray(data.interviewHistory)) {
          for (let i = 0; i < data.interviewHistory.length; i++) {
            const round = data.interviewHistory[i] as any;
            const roundDate = round?.date ? new Date(round.date) : null;
            if (roundDate) {
              await reminderService.syncSourceReminder(tx, {
                studentProfileId,
                sourceType: 'INTERVIEW',
                sourceId: application.id,
                occurrenceKey: `round-${i}`,
                title: `Interview Round (${round.round || i + 1}): ${application.companyName} - ${application.role}`,
                description: `Upcoming interview round for ${application.role} at ${application.companyName}`,
                targetDate: roundDate,
              });
            }
          }
        }

        if (application.interviewDate) {
          await reminderService.syncSourceReminder(tx, {
            studentProfileId,
            sourceType: 'INTERVIEW',
            sourceId: application.id,
            occurrenceKey: 'round-legacy',
            title: `Interview: ${application.companyName} - ${application.role}`,
            description: `Upcoming interview for ${application.role} at ${application.companyName}`,
            targetDate: application.interviewDate,
          });
        }
      }

      return application;
    });
  },

  async getApplications(studentProfileId: string, applicationType?: ApplicationType) {
    return prisma.jobApplication.findMany({
      where: { studentProfileId, ...(applicationType ? { applicationType } : {}) },
      orderBy: [
        { appliedDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  },

  async getApplicationById(studentProfileId: string, applicationId: string) {
    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, studentProfileId },
    });
    if (!application) {
      throw ApiError.notFound('Job application not found or does not belong to you');
    }
    return application;
  },

  async updateApplication(studentProfileId: string, applicationId: string, data: UpdateJobApplicationInput) {
    await this.getApplicationById(studentProfileId, applicationId);

    const updateData: Prisma.JobApplicationUpdateInput = {};
    if (data.applicationType !== undefined) updateData.applicationType = data.applicationType;
    if (data.eligibilityStatus !== undefined) updateData.eligibilityStatus = data.eligibilityStatus;
    if (data.interviewHistory !== undefined) updateData.interviewHistory = data.interviewHistory;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.applicationUrl !== undefined) updateData.applicationUrl = data.applicationUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.appliedDate !== undefined) updateData.appliedDate = data.appliedDate ? new Date(data.appliedDate) : null;
    if (data.status !== undefined) updateData.status = data.status;
    // C-5
    if (data.interviewDate !== undefined) updateData.interviewDate = data.interviewDate ? new Date(data.interviewDate) : null;
    if (data.interviewRound !== undefined) updateData.interviewRound = data.interviewRound;
    // C-6
    if (data.offerDetails !== undefined) updateData.offerDetails = data.offerDetails;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.jobApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      if (updated.status === 'REJECTED') {
        await reminderService.cancelSourceReminders(tx, {
          studentProfileId,
          sourceType: 'INTERVIEW',
          sourceId: applicationId,
        });
      } else {
        const activeKeys = new Set<string>();

        if (Array.isArray(updated.interviewHistory)) {
          for (let i = 0; i < updated.interviewHistory.length; i++) {
            const round = updated.interviewHistory[i] as any;
            const roundDate = round?.date ? new Date(round.date) : null;
            const key = `round-${i}`;
            activeKeys.add(key);

            await reminderService.syncSourceReminder(tx, {
              studentProfileId,
              sourceType: 'INTERVIEW',
              sourceId: updated.id,
              occurrenceKey: key,
              title: `Interview Round (${round?.round || i + 1}): ${updated.companyName} - ${updated.role}`,
              description: `Upcoming interview round for ${updated.role} at ${updated.companyName}`,
              targetDate: roundDate,
              cancelled: !roundDate,
            });
          }
        }

        if (updated.interviewDate) {
          activeKeys.add('round-legacy');
          await reminderService.syncSourceReminder(tx, {
            studentProfileId,
            sourceType: 'INTERVIEW',
            sourceId: updated.id,
            occurrenceKey: 'round-legacy',
            title: `Interview: ${updated.companyName} - ${updated.role}`,
            description: `Upcoming interview for ${updated.role} at ${updated.companyName}`,
            targetDate: updated.interviewDate,
          });
        }

        // Cancel any pending reminders that are no longer active
        await tx.reminder.updateMany({
          where: {
            studentProfileId,
            sourceType: 'INTERVIEW',
            sourceId: applicationId,
            occurrenceKey: { notIn: Array.from(activeKeys) },
            deliveryStatus: 'PENDING',
          },
          data: {
            deliveryStatus: 'CANCELLED',
          },
        });
      }

      return updated;
    });
  },

  async deleteApplication(studentProfileId: string, applicationId: string) {
    await this.getApplicationById(studentProfileId, applicationId);

    return prisma.$transaction(async (tx) => {
      await reminderService.cancelSourceReminders(tx, {
        studentProfileId,
        sourceType: 'INTERVIEW',
        sourceId: applicationId,
      });

      await tx.jobApplication.delete({ where: { id: applicationId } });
    });
  },
};
