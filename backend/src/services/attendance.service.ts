import { lockOwnedSubject, recalculateAttendance } from './attendance-consistency.js';
import { prisma } from '../config/prisma.js';
import { CreateAttendanceRecordInput, UpdateAttendanceRecordInput } from '../schemas/attendance.schema.js';
import { ApiError } from '../utils/ApiError.js';

export const attendanceService = {
  async verifySubjectOwnership(studentProfileId: string, subjectId: string) {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { semester: true },
    });

    if (!subject || subject.semester.studentProfileId !== studentProfileId) {
      throw ApiError.forbidden('You do not have access to this subject');
    }
  },

  async createAttendanceRecord(studentProfileId: string, data: CreateAttendanceRecordInput) {
    return prisma.$transaction(async tx => {
      const subject = await lockOwnedSubject(tx, studentProfileId, data.subjectId);
      const count = await tx.attendanceRecord.count({ where: { subjectId: data.subjectId } });
      if (count === 0 && (subject.totalClasses !== 0 || subject.attendedClasses !== 0)) {
        throw ApiError.conflict('Clear manual attendance totals before adding individual records');
      }
      const record = await tx.attendanceRecord.create({
        data: { subjectId: data.subjectId, date: new Date(data.date), status: data.status, notes: data.notes ?? null },
      });
      await recalculateAttendance(tx, data.subjectId);
      return record;
    }, { isolationLevel: 'ReadCommitted' });
  },

  async getAttendanceRecords(studentProfileId: string, subjectId: string) {
    await this.verifySubjectOwnership(studentProfileId, subjectId);

    return prisma.attendanceRecord.findMany({
      where: { subjectId },
      orderBy: { date: 'desc' },
    });
  },

  async getAttendanceRecordById(studentProfileId: string, recordId: string) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        subject: {
          include: { semester: true },
        },
      },
    });

    if (!record || record.subject.semester.studentProfileId !== studentProfileId) {
      throw ApiError.notFound('Attendance record not found');
    }

    return record;
  },

  async updateAttendanceRecord(studentProfileId: string, recordId: string, data: UpdateAttendanceRecordInput) {
    const record = await this.getAttendanceRecordById(studentProfileId, recordId);

    const updateData: {
      status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      notes?: string | null;
      date?: Date;
    } = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    return prisma.$transaction(async tx => {
      await lockOwnedSubject(tx, studentProfileId, record.subjectId);
      if (!await tx.attendanceRecord.findUnique({ where: { id: recordId } })) {
        throw ApiError.notFound('Attendance record not found');
      }
      const updated = await tx.attendanceRecord.update({ where: { id: recordId }, data: updateData });
      await recalculateAttendance(tx, record.subjectId);
      return updated;
    }, { isolationLevel: 'ReadCommitted' });
  },

  async deleteAttendanceRecord(studentProfileId: string, recordId: string) {
    const record = await this.getAttendanceRecordById(studentProfileId, recordId);
    await prisma.$transaction(async tx => {
      await lockOwnedSubject(tx, studentProfileId, record.subjectId);
      const deleted = await tx.attendanceRecord.deleteMany({ where: { id: recordId } });
      if (!deleted.count) throw ApiError.notFound('Attendance record not found');
      await recalculateAttendance(tx, record.subjectId);
    }, { isolationLevel: 'ReadCommitted' });
  },

  // A-4: Per-subject attendance report
  async getAttendanceReport(studentProfileId: string) {
    // Fetch all subjects owned by this student across all semesters
    const subjects = await prisma.subject.findMany({
      where: { semester: { studentProfileId } },
      select: {
        id: true,
        name: true,
        code: true,
        totalClasses: true,
        attendedClasses: true,
        attendanceGoal: true,
        semester: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return subjects.map((subject) => {
      const totalClasses = subject.totalClasses;
      const attendedClasses = subject.attendedClasses;
      const absentClasses = totalClasses - attendedClasses;
      const attendancePercentage =
        totalClasses > 0 ? parseFloat(((attendedClasses / totalClasses) * 100).toFixed(2)) : 0;

      const goal = subject.attendanceGoal ?? null;
      const goalDelta = goal !== null ? parseFloat((attendancePercentage - goal).toFixed(2)) : null;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: subject.semester,
        totalClasses,
        attendedClasses,
        absentClasses,
        attendancePercentage,
        attendanceGoal: goal,
        goalDelta, // positive = exceeding goal, negative = below goal
      };
    });
  },

};
