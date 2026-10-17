import { prisma } from '../config/prisma.js';
import { CreateCertificationInput, UpdateCertificationInput } from '../schemas/certification.schema.js';
import { ApiError } from '../utils/ApiError.js';
import { reminderService } from './reminder.service.js';

export const certificationService = {
  async createCertification(studentProfileId: string, data: CreateCertificationInput) {
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    return prisma.$transaction(async (tx) => {
      const cert = await tx.certification.create({
        data: {
          studentProfileId,
          name: data.name,
          issuer: data.issuer,
          dateObtained: data.dateObtained ? new Date(data.dateObtained) : null,
          expiryDate,
          credentialId: data.credentialId ?? null,
          credentialUrl: data.credentialUrl ?? null,
        },
      });

      if (expiryDate) {
        await reminderService.syncSourceReminder(tx, {
          studentProfileId,
          sourceType: 'CERTIFICATION',
          sourceId: cert.id,
          occurrenceKey: 'expiry',
          title: `Certification Expiring: ${cert.name}`,
          description: `Your ${cert.name} certification from ${cert.issuer} expires on ${expiryDate.toISOString()}`,
          targetDate: expiryDate,
          leadTimeMs: 30 * 24 * 60 * 60 * 1000, // 30-day renewal lead time
        });
      }

      return cert;
    });
  },

  async getCertifications(studentProfileId: string) {
    return prisma.certification.findMany({
      where: { studentProfileId },
      orderBy: { dateObtained: 'desc' },
    });
  },

  async getCertificationById(studentProfileId: string, certificationId: string) {
    const cert = await prisma.certification.findFirst({
      where: { id: certificationId, studentProfileId },
    });
    if (!cert) throw ApiError.notFound('Certification not found or does not belong to you');
    return cert;
  },

  async updateCertification(studentProfileId: string, certificationId: string, data: UpdateCertificationInput) {
    const existing = await this.getCertificationById(studentProfileId, certificationId);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.issuer !== undefined) updateData.issuer = data.issuer;
    if (data.dateObtained !== undefined) updateData.dateObtained = data.dateObtained ? new Date(data.dateObtained) : null;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.credentialId !== undefined) updateData.credentialId = data.credentialId;
    if (data.credentialUrl !== undefined) updateData.credentialUrl = data.credentialUrl;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.certification.update({
        where: { id: certificationId },
        data: updateData,
      });

      const effectiveExpiry = updated.expiryDate;
      if (effectiveExpiry) {
        await reminderService.syncSourceReminder(tx, {
          studentProfileId,
          sourceType: 'CERTIFICATION',
          sourceId: updated.id,
          occurrenceKey: 'expiry',
          title: `Certification Expiring: ${updated.name}`,
          description: `Your ${updated.name} certification from ${updated.issuer} expires on ${effectiveExpiry.toISOString()}`,
          targetDate: effectiveExpiry,
          leadTimeMs: 30 * 24 * 60 * 60 * 1000,
          cancelled: false,
        });
      } else if (existing.expiryDate && !effectiveExpiry) {
        await reminderService.cancelSourceReminders(tx, {
          studentProfileId,
          sourceType: 'CERTIFICATION',
          sourceId: updated.id,
        });
      }

      return updated;
    });
  },

  async deleteCertification(studentProfileId: string, certificationId: string) {
    await this.getCertificationById(studentProfileId, certificationId);

    return prisma.$transaction(async (tx) => {
      await reminderService.cancelSourceReminders(tx, {
        studentProfileId,
        sourceType: 'CERTIFICATION',
        sourceId: certificationId,
      });

      await tx.certification.delete({ where: { id: certificationId } });
    });
  },

  // P4: Return certifications expiring within N days — for renewal reminders
  async getExpiringCertifications(studentProfileId: string, withinDays = 30) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + withinDays);

    return prisma.certification.findMany({
      where: {
        studentProfileId,
        expiryDate: {
          gt: new Date(),   // not yet expired
          lte: deadline,   // but expiring within window
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  },
};
