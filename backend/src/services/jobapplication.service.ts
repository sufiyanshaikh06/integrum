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
        // C-5: Interview
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : null,
        interviewRound: data.interviewRound,
        // C-6: Offer
        offerDetails: data.offerDetails ?? undefined,
      },
    });
  },

  async getApplications(studentProfileId: string) {
    return prisma.jobApplication.findMany({
      where: { studentProfileId },
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

    const updateData: any = {};
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

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
    });
  },

  async deleteApplication(studentProfileId: string, applicationId: string) {
    await this.getApplicationById(studentProfileId, applicationId);
    await prisma.jobApplication.delete({ where: { id: applicationId } });
  },
};
