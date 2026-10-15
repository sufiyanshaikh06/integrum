import { env } from '../config/env.js';
import { getStorageProvider } from './storage/index.js';
import { cleanupFile } from './storage/file-transfer.js';
import { prisma } from '../config/prisma.js';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const noteService = {
  // Utility: verify subject ownership via Semester -> StudentProfile
  async verifySubjectOwnership(studentProfileId: string, subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { semester: true },
    });

    if (!subject || subject.semester.studentProfileId !== studentProfileId) {
      throw ApiError.forbidden('You do not have access to this subject');
    }
  },

  async createNote(studentProfileId: string, data: CreateNoteInput) {
    await this.verifySubjectOwnership(studentProfileId, data.subjectId);

    return prisma.note.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        content: data.content ?? null,
        fileUrl: data.fileUrl ?? null,
        tags: data.tags ?? [],
      },
    });
  },

  async getNotes(studentProfileId: string, subjectId?: string, tag?: string, search?: string) {
    // If subjectId is provided, verify it. Otherwise, get all notes for the student's subjects
    if (subjectId) {
      await this.verifySubjectOwnership(studentProfileId, subjectId);
    }

    const where: any = {
      subject: subjectId ? { id: subjectId } : {
        semester: {
          studentProfileId,
        },
      },
    };

    if (tag) {
      where.tags = { has: tag };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { subject: { select: { name: true } } },
    });
  },

  async getNoteById(studentProfileId: string, noteId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        subject: {
          include: { semester: true },
        },
      },
    });

    if (!note || note.subject.semester.studentProfileId !== studentProfileId) {
      throw ApiError.notFound('Note not found');
    }

    return note;
  },

  async updateNote(studentProfileId: string, noteId: string, data: UpdateNoteInput) {
    await this.getNoteById(studentProfileId, noteId); // verify ownership

    const updateData: {
      title?: string;
      content?: string | null;
      fileUrl?: string | null;
      tags?: string[];
    } = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content ?? null;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl ?? null;
    if (data.tags !== undefined) updateData.tags = data.tags;

    return prisma.note.update({
      where: { id: noteId },
      data: updateData,
    });
  },

  async deleteNote(studentProfileId: string, noteId: string) {
    await this.getNoteById(studentProfileId, noteId); // verify ownership

    const deleted = await prisma.note.delete({ where: { id: noteId } });
    if (deleted.fileId) await cleanupFile(getStorageProvider(), deleted.fileId);
  },

  async attachFile(studentProfileId: string, noteId: string, fileId: string, expectedFileId: string | null) {
    await this.getNoteById(studentProfileId, noteId); // ownership check
    const result = await prisma.note.updateMany({
      where: { id: noteId, fileId: expectedFileId },
      data: { fileId, fileStorageProvider: env.STORAGE_PROVIDER },
    });
    if (result.count !== 1) throw ApiError.conflict('Note changed during upload; retry');
  },

  async getFileId(studentProfileId: string, noteId: string): Promise<string> {
    const note = await this.getNoteById(studentProfileId, noteId);
    if (!note.fileId) {
      throw ApiError.notFound('No file attached to this note');
    }
    return note.fileId;
  },
};
