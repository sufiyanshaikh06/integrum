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
    await this.verifySubjectOwnership(studentProfileId, data.subjectId);

    const record = await prisma.attendanceRecord.create({
      data: {
        subjectId: data.subjectId,
        date: new Date(data.date),
        status: data.status,
        notes: data.notes,
      },
    });

    await this.recalculateSubjectAttendance(data.subjectId);
    return record;
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

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    if (data.status) {
      await this.recalculateSubjectAttendance(record.subjectId);
    }
    return updated;
  },

  async deleteAttendanceRecord(studentProfileId: string, recordId: string) {
    const record = await this.getAttendanceRecordById(studentProfileId, recordId);

    await prisma.attendanceRecord.delete({
      where: { id: recordId },
    });

    await this.recalculateSubjectAttendance(record.subjectId);
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

  async recalculateSubjectAttendance(subjectId: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: { subjectId },
    });

    const totalClasses = records.length;
    const attendedClasses = records.filter(
      r => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;

    await prisma.subject.update({
      where: { id: subjectId },
      data: { totalClasses, attendedClasses },
    });
  }
};
