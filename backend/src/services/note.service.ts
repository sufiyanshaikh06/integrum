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
        content: data.content,
        fileUrl: data.fileUrl,
        tags: data.tags ?? [],
      },
    });
  },

  async getNotes(studentProfileId: string, subjectId?: string, tag?: string) {
    // If subjectId is provided, verify it. Otherwise, get all notes for the student's subjects
    if (subjectId) {
      await this.verifySubjectOwnership(studentProfileId, subjectId);
    }

    return prisma.note.findMany({
      where: {
        subject: subjectId ? { id: subjectId } : {
          semester: {
            studentProfileId,
          },
        },
        ...(tag ? { tags: { has: tag } } : {}),
      },
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

    return prisma.note.update({
      where: { id: noteId },
      data,
    });
  },

  async deleteNote(studentProfileId: string, noteId: string) {
    await this.getNoteById(studentProfileId, noteId); // verify ownership

    await prisma.note.delete({
      where: { id: noteId },
    });
  },
};
