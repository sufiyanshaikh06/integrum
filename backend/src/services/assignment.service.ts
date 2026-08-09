import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { subjectService } from './subject.service.js';

export const assignmentService = {
  async createAssignment(studentProfileId: string, data: any) {
    // Enforce ownership boundary
    await subjectService.getSubjectById(studentProfileId, data.subjectId);

    return prisma.assignment.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
      },
    });
  },

  async getAssignments(studentProfileId: string, subjectId?: string) {
    const whereClause: any = {
      subject: {
        semester: { studentProfileId },
      },
    };
    if (subjectId) {
      whereClause.subjectId = subjectId;
    }
    return prisma.assignment.findMany({
      where: whereClause,
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAssignmentById(studentProfileId: string, assignmentId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        subject: {
          semester: { studentProfileId },
        },
      },
      include: {
        subject: { select: { id: true, name: true } },
      }
    });

    if (!assignment) {
      throw ApiError.notFound('Assignment not found or does not belong to you');
    }
    return assignment;
  },

  async updateAssignment(studentProfileId: string, assignmentId: string, data: any) {
    // Verify ownership
    await this.getAssignmentById(studentProfileId, assignmentId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
    });
  },

  async deleteAssignment(studentProfileId: string, assignmentId: string) {
    // Verify ownership
    await this.getAssignmentById(studentProfileId, assignmentId);

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });
    return { success: true };
  },
};
