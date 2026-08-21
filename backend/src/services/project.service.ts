import { prisma } from '../config/prisma.js';
import { CreateProjectInput, UpdateProjectInput } from '../schemas/project.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const projectService = {
  async createProject(studentProfileId: string, data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        studentProfileId,
        title: data.title,
        description: data.description,
        technologies: data.technologies ?? [],
        projectUrl: data.projectUrl,
        repoUrl: data.repoUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isOngoing: data.isOngoing ?? false,
      },
    });
  },

  async getProjects(studentProfileId: string) {
    return prisma.project.findMany({
      where: { studentProfileId },
      orderBy: { startDate: 'desc' },
    });
  },

  async getProjectById(studentProfileId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, studentProfileId },
    });
    if (!project) throw ApiError.notFound('Project not found or does not belong to you');
    return project;
  },

  async updateProject(studentProfileId: string, projectId: string, data: UpdateProjectInput) {
    await this.getProjectById(studentProfileId, projectId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.technologies !== undefined) updateData.technologies = data.technologies;
    if (data.projectUrl !== undefined) updateData.projectUrl = data.projectUrl;
    if (data.repoUrl !== undefined) updateData.repoUrl = data.repoUrl;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isOngoing !== undefined) updateData.isOngoing = data.isOngoing;

    return prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });
  },

  async deleteProject(studentProfileId: string, projectId: string) {
    await this.getProjectById(studentProfileId, projectId);
    await prisma.project.delete({ where: { id: projectId } });
  },
};
