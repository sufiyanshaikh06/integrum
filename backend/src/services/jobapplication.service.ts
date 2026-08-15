import { prisma } from '../config/prisma.js';
import { CreateJobApplicationInput, UpdateJobApplicationInput } from '../schemas/jobapplication.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const jobApplicationService = {
  async createApplication(studentProfileId: string, data: CreateJobApplicationInput) {
    return prisma.jobApplication.create({
      data: {
        studentProfileId,
        companyName: data.companyName,
        role: data.role,
        applicationUrl: data.applicationUrl,
        notes: data.notes,
        appliedDate: data.appliedDate ? new Date(data.appliedDate) : null,
        status: data.status ?? 'APPLIED',
      },
    });
  },

  async getApplications(studentProfileId: string) {
    return prisma.jobApplication.findMany({
      where: {
        studentProfileId,
      },
      orderBy: [
        { appliedDate: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  },

  async getApplicationById(studentProfileId: string, applicationId: string) {
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        studentProfileId,
      },
    });

    if (!application) {
      throw ApiError.notFound('Job application not found or does not belong to you');
    }

    return application;
  },

  async updateApplication(studentProfileId: string, applicationId: string, data: UpdateJobApplicationInput) {
    // Verify ownership via getApplicationById to prevent direct update info leakage
    await this.getApplicationById(studentProfileId, applicationId);

    const updateData: any = { ...data };
    if (data.appliedDate) {
      updateData.appliedDate = new Date(data.appliedDate);
    }

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
    });
  },

  async deleteApplication(studentProfileId: string, applicationId: string) {
    // Verify ownership
    await this.getApplicationById(studentProfileId, applicationId);

    await prisma.jobApplication.delete({
      where: { id: applicationId },
    });
  },
};
