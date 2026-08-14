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
      where: {
        studentProfileId,
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only fetch the most recent version by default for listing
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },

  async getResumeById(studentProfileId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        studentProfileId,
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!resume) {
      throw ApiError.notFound('Resume not found or does not belong to you');
    }

    return resume;
  },

  async updateResume(studentProfileId: string, resumeId: string, data: UpdateResumeInput) {
    // Verify ownership
    await this.getResumeById(studentProfileId, resumeId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // If new content is provided, create a new version
    if (data.content) {
      updateData.versions = {
        create: {
          content: data.content,
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
    // Verify ownership
    await this.getResumeById(studentProfileId, resumeId);

    await prisma.resume.delete({
      where: { id: resumeId },
    });
  },
};
