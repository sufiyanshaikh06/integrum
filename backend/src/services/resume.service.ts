import { prisma } from '../config/prisma.js';
import { CreateResumeInput, UpdateResumeInput } from '../schemas/resume.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const resumeService = {
  async createResume(studentProfileId: string, data: CreateResumeInput) {
    return prisma.resume.create({
      data: {
        studentProfileId,
        title: data.title,
        isActive: data.isActive ?? false,
        versions: {
          create: {
            content: data.content,
            templateId: data.templateId ?? 'classic', // C-1: default template
          },
        },
      },
      include: {
        versions: true,
      },
    });
  },

  async getResumes(studentProfileId: string) {
    return prisma.resume.findMany({
      where: { studentProfileId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getResumeById(studentProfileId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, studentProfileId },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!resume) throw ApiError.notFound('Resume not found or does not belong to you');
    return resume;
  },

  async updateResume(studentProfileId: string, resumeId: string, data: UpdateResumeInput) {
    await this.getResumeById(studentProfileId, resumeId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // C-1: If content or template changes, create a new version
    if (data.content || data.templateId) {
      // Get the latest version for content if only templateId is changing
      const current = await prisma.resumeVersion.findFirst({
        where: { resumeId },
        orderBy: { createdAt: 'desc' },
      });

      updateData.versions = {
        create: {
          content: data.content ?? current?.content ?? {},
          templateId: data.templateId ?? current?.templateId ?? 'classic',
        },
      };
    }

    return prisma.resume.update({
      where: { id: resumeId },
      data: updateData,
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  },

  async deleteResume(studentProfileId: string, resumeId: string) {
    await this.getResumeById(studentProfileId, resumeId);
    await prisma.resume.delete({ where: { id: resumeId } });
  },

  // C-2: Generate PDF-ready data from the latest resume version
  async getResumePdfData(studentProfileId: string, resumeId: string) {
    const resume = await this.getResumeById(studentProfileId, resumeId);

    const latestVersion = resume.versions[0];
    if (!latestVersion) {
      throw ApiError.badRequest('Resume has no versions to export');
    }

    // Return structured data — the client/PDF library renders this
    return {
      resumeId: resume.id,
      title: resume.title,
      templateId: latestVersion.templateId ?? 'classic',
      versionId: latestVersion.id,
      content: latestVersion.content,
      atsScore: latestVersion.atsScore,
      generatedAt: new Date().toISOString(),
    };
  },
};
