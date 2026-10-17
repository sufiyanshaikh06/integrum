import type { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

// Every attendance writer locks the subject before reading or changing its records.
// At READ COMMITTED, the subsequent reads see the preceding lock holder's commit.
export async function lockOwnedSubject(tx: Prisma.TransactionClient, studentProfileId: string, subjectId: string) {
  await tx.$queryRaw`SELECT s."id" FROM "Subject" s
    JOIN "Semester" sem ON sem."id" = s."semesterId"
    WHERE s."id" = ${subjectId} AND sem."studentProfileId" = ${studentProfileId}
    FOR UPDATE OF s`;
  const subject = await tx.subject.findFirst({ where: { id: subjectId, semester: { studentProfileId } } });
  if (!subject) throw ApiError.notFound('Subject not found or does not belong to you');
  return subject;
}

export function validateAttendanceTotals(total: number, attended: number) {
  if (!Number.isInteger(total) || !Number.isInteger(attended) || total < 0 || attended < 0 || attended > total) {
    throw ApiError.badRequest('Attendance totals must be nonnegative integers and attended classes cannot exceed total classes');
  }
}

export async function recalculateAttendance(tx: Prisma.TransactionClient, subjectId: string) {
  const totalClasses = await tx.attendanceRecord.count({ where: { subjectId } });
  const attendedClasses = await tx.attendanceRecord.count({ where: { subjectId, status: { in: ['PRESENT', 'LATE'] } } });
  await tx.subject.update({ where: { id: subjectId }, data: { totalClasses, attendedClasses } });
}
