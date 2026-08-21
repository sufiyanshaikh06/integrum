import { prisma } from '../config/prisma.js';
import { CreateCertificationInput, UpdateCertificationInput } from '../schemas/certification.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const certificationService = {
  async createCertification(studentProfileId: string, data: CreateCertificationInput) {
    return prisma.certification.create({
      data: {
        studentProfileId,
        name: data.name,
        issuer: data.issuer,
        dateObtained: data.dateObtained ? new Date(data.dateObtained) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl,
      },
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
    await this.getCertificationById(studentProfileId, certificationId);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.issuer !== undefined) updateData.issuer = data.issuer;
    if (data.dateObtained !== undefined) updateData.dateObtained = data.dateObtained ? new Date(data.dateObtained) : null;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.credentialId !== undefined) updateData.credentialId = data.credentialId;
    if (data.credentialUrl !== undefined) updateData.credentialUrl = data.credentialUrl;

    return prisma.certification.update({
      where: { id: certificationId },
      data: updateData,
    });
  },

  async deleteCertification(studentProfileId: string, certificationId: string) {
    await this.getCertificationById(studentProfileId, certificationId);
    await prisma.certification.delete({ where: { id: certificationId } });
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
