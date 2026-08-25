import { performance } from 'perf_hooks';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { ReportQueryInput } from '../../schemas/admin/report.schema.js';

// Helper for safe division
function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

// Helper to format ISO date string into grouping keys
function formatPeriodKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  if (period === 'monthly') {
    return `${yyyy}-${mm}`;
  }

  if (period === 'weekly') {
    // ISO week number calculation
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  return `${yyyy}-${mm}-${dd}`;
}

export const adminReportService = {
  /**
   * Validate cross-filters (departmentId & courseId)
   */
  async validateCrossFilters(departmentId?: string, courseId?: string) {
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) throw ApiError.notFound('Referenced department does not exist');
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) throw ApiError.notFound('Referenced course does not exist');

      if (departmentId && course.departmentId !== departmentId) {
        throw ApiError.badRequest('The specified course does not belong to the specified department');
      }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 1. USER REPORTS
  // ───────────────────────────────────────────────────────────────────────────

  async getUserReport(query: ReportQueryInput) {
    await this.validateCrossFilters(query.departmentId, query.courseId);

    const dateFilter: Prisma.UserWhereInput = {};
    if (query.startDate || query.endDate) {
      dateFilter.createdAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const [
      totalUsers,
      students,
      admins,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      allUsersForTrends,
      departments,
      courses,
      unassignedStudentsCount,
    ] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.user.count({ where: { ...dateFilter, role: 'STUDENT' } }),
      prisma.user.count({ where: { ...dateFilter, role: 'ADMIN' } }),
      prisma.user.count({ where: { ...dateFilter, isActive: true } }),
      prisma.user.count({ where: { ...dateFilter, isActive: false } }),
      prisma.user.count({ where: { ...dateFilter, isVerified: true } }),
      prisma.user.count({ where: { ...dateFilter, isVerified: false } }),
      prisma.user.findMany({
        where: dateFilter,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.department.findMany({
        include: {
          courses: {
            include: {
              students: { select: { id: true } },
            },
          },
        },
      }),
      prisma.course.findMany({
        include: {
          students: { select: { id: true } },
        },
      }),
      prisma.studentProfile.count({
        where: { courseId: null },
      }),
    ]);

    // Group registrations by requested period
    const period = query.period || 'daily';
    const registrationMap = new Map<string, number>();
    for (const u of allUsersForTrends) {
      const key = formatPeriodKey(u.createdAt, period);
      registrationMap.set(key, (registrationMap.get(key) || 0) + 1);
    }
    const registrations = Array.from(registrationMap.entries()).map(([periodKey, count]) => ({
      period: periodKey,
      count,
    }));

    // Students by course
    const studentsByCourse = courses.map((c) => ({
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      count: c.students.length,
    }));

    // Students by department
    const studentsByDepartment = departments.map((d) => {
      const totalStudentsInDept = d.courses.reduce((acc, c) => acc + c.students.length, 0);
      return {
        departmentId: d.id,
        departmentName: d.name,
        departmentCode: d.code,
        count: totalStudentsInDept,
      };
    });

    return {
      summary: {
        totalUsers,
        students,
        admins,
        activeUsers,
        inactiveUsers,
        verifiedUsers,
        unverifiedUsers,
        verificationRate: safeRate(verifiedUsers, totalUsers),
        activeRate: safeRate(activeUsers, totalUsers),
      },
      registrations,
      studentsByCourse,
      studentsByDepartment,
      unassignedStudents: unassignedStudentsCount,
      generatedAt: new Date().toISOString(),
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ACADEMIC REPORTS
  // ───────────────────────────────────────────────────────────────────────────

  async getAcademicReport(query: ReportQueryInput) {
    await this.validateCrossFilters(query.departmentId, query.courseId);

    // Fetch relevant students with institutional hierarchy and operational academic data
    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        ...(query.courseId ? { courseId: query.courseId } : {}),
        ...(query.departmentId ? { course: { departmentId: query.departmentId } } : {}),
      },
      include: {
        course: {
          include: {
            department: true,
          },
        },
        semesters: {
          include: {
            subjects: {
              include: {
                attendanceRecords: true,
                assignments: true,
              },
            },
          },
        },
      },
    });

    let totalStudentSubjects = 0;
    let totalClasses = 0;
    let attendedClasses = 0;
    let totalAssignments = 0;
    let completedAssignments = 0;
    let totalAttendanceRecords = 0;

    // Course and Department aggregate trackers
    const courseStats = new Map<
      string,
      {
        courseId: string;
        courseName: string;
        courseCode: string;
        students: number;
        totalClasses: number;
        attendedClasses: number;
        totalAssignments: number;
        completedAssignments: number;
      }
    >();

    const deptStats = new Map<
      string,
      {
        departmentId: string;
        departmentName: string;
        departmentCode: string;
        coursesSet: Set<string>;
        students: number;
        totalClasses: number;
        attendedClasses: number;
        totalAssignments: number;
        completedAssignments: number;
      }
    >();

    for (const student of studentProfiles) {
      const courseId = student.courseId;
      const course = student.course;
      const dept = course?.department;

      if (courseId && course) {
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            courseId,
            courseName: course.name,
            courseCode: course.code,
            students: 0,
            totalClasses: 0,
            attendedClasses: 0,
            totalAssignments: 0,
            completedAssignments: 0,
          });
        }
        courseStats.get(courseId)!.students += 1;
      }

      if (dept) {
        if (!deptStats.has(dept.id)) {
          deptStats.set(dept.id, {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            coursesSet: new Set(),
            students: 0,
            totalClasses: 0,
            attendedClasses: 0,
            totalAssignments: 0,
            completedAssignments: 0,
          });
        }
        deptStats.get(dept.id)!.coursesSet.add(course!.id);
        deptStats.get(dept.id)!.students += 1;
      }

      for (const semester of student.semesters) {
        for (const subject of semester.subjects) {
          totalStudentSubjects += 1;

          let subjTotalClasses = subject.totalClasses;
          let subjAttendedClasses = subject.attendedClasses;

          // Fallback to individual records if totalClasses was 0 but records exist
          if (subjTotalClasses === 0 && subject.attendanceRecords.length > 0) {
            subjTotalClasses = subject.attendanceRecords.length;
            subjAttendedClasses = subject.attendanceRecords.filter((r) =>
              ['PRESENT', 'LATE'].includes(r.status)
            ).length;
          }

          totalAttendanceRecords += subject.attendanceRecords.length;
          totalClasses += subjTotalClasses;
          attendedClasses += subjAttendedClasses;

          const subjTotalAssignments = subject.assignments.length;
          const subjCompletedAssignments = subject.assignments.filter((a) =>
            ['SUBMITTED', 'GRADED'].includes(a.status)
          ).length;

          totalAssignments += subjTotalAssignments;
          completedAssignments += subjCompletedAssignments;

          if (courseId && courseStats.has(courseId)) {
            const cs = courseStats.get(courseId)!;
            cs.totalClasses += subjTotalClasses;
            cs.attendedClasses += subjAttendedClasses;
            cs.totalAssignments += subjTotalAssignments;
            cs.completedAssignments += subjCompletedAssignments;
          }

          if (dept && deptStats.has(dept.id)) {
            const ds = deptStats.get(dept.id)!;
            ds.totalClasses += subjTotalClasses;
            ds.attendedClasses += subjAttendedClasses;
            ds.totalAssignments += subjTotalAssignments;
            ds.completedAssignments += subjCompletedAssignments;
          }
        }
      }
    }

    const unassignedStudentsCount = await prisma.studentProfile.count({
      where: { courseId: null },
    });

    const byCourse = Array.from(courseStats.values()).map((cs) => ({
      courseId: cs.courseId,
      courseName: cs.courseName,
      courseCode: cs.courseCode,
      students: cs.students,
      averageAttendance: safeRate(cs.attendedClasses, cs.totalClasses),
      assignmentCompletionRate: safeRate(cs.completedAssignments, cs.totalAssignments),
    }));

    const byDepartment = Array.from(deptStats.values()).map((ds) => ({
      departmentId: ds.departmentId,
      departmentName: ds.departmentName,
      departmentCode: ds.departmentCode,
      coursesCount: ds.coursesSet.size,
      students: ds.students,
      averageAttendance: safeRate(ds.attendedClasses, ds.totalClasses),
      assignmentCompletionRate: safeRate(ds.completedAssignments, ds.totalAssignments),
    }));

    return {
      overview: {
        totalStudentSubjects,
        totalAttendanceRecords,
        averageAttendancePercentage: safeRate(attendedClasses, totalClasses),
        totalAssignments,
        submittedAssignments: completedAssignments,
        pendingAssignments: totalAssignments - completedAssignments,
        assignmentCompletionRate: safeRate(completedAssignments, totalAssignments),
        unassignedStudents: unassignedStudentsCount,
      },
      byCourse,
      byDepartment,
      generatedAt: new Date().toISOString(),
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. USAGE ANALYTICS (AI & CAREER)
  // ───────────────────────────────────────────────────────────────────────────

  async getUsageReport(query: ReportQueryInput) {
    const aiDateFilter: Prisma.AIExecutionLogWhereInput = {};
    const careerDateFilter: Prisma.JobApplicationWhereInput = {};

    if (query.startDate || query.endDate) {
      const gte = query.startDate ? new Date(query.startDate) : undefined;
      const lte = query.endDate ? new Date(query.endDate) : undefined;

      aiDateFilter.createdAt = {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {}),
      };
      careerDateFilter.createdAt = {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {}),
      };
    }

    const [aiLogs, jobApplications] = await Promise.all([
      prisma.aIExecutionLog.findMany({
        where: aiDateFilter,
        select: {
          id: true,
          module: true,
          operation: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.jobApplication.findMany({
        where: careerDateFilter,
        select: {
          id: true,
          status: true,
          appliedDate: true,
        },
      }),
    ]);

    // ── AI Calculations ──
    const totalAiExecutions = aiLogs.length;
    const successfulAiExecutions = aiLogs.filter((l) => l.status === 'SUCCESS').length;
    const failedAiExecutions = aiLogs.filter((l) => l.status === 'FAILED').length;

    const byModule: Record<string, number> = {
      RESUME: 0,
      STUDY_PLAN: 0,
      NOTES: 0,
    };
    const byOperation: Record<string, number> = {};

    let totalDurationMs = 0;
    let completedDurationCount = 0;

    for (const log of aiLogs) {
      if (log.module in byModule) {
        byModule[log.module] += 1;
      } else {
        byModule[log.module] = 1;
      }

      byOperation[log.operation] = (byOperation[log.operation] || 0) + 1;

      if (log.startedAt && log.completedAt) {
        const dur = log.completedAt.getTime() - log.startedAt.getTime();
        if (dur >= 0) {
          totalDurationMs += dur;
          completedDurationCount += 1;
        }
      }
    }

    const averageDurationMs =
      completedDurationCount > 0 ? Math.round(totalDurationMs / completedDurationCount) : 0;

    // ── Career Calculations ──
    const totalApplications = jobApplications.length;
    const appliedCount = jobApplications.filter((a) => a.status === 'APPLIED').length;
    const interviewingCount = jobApplications.filter((a) => a.status === 'INTERVIEWING').length;
    const offeredCount = jobApplications.filter((a) => a.status === 'OFFERED').length;
    const rejectedCount = jobApplications.filter((a) => a.status === 'REJECTED').length;

    const appMonthlyMap = new Map<string, number>();
    for (const app of jobApplications) {
      const d = app.appliedDate ? new Date(app.appliedDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      appMonthlyMap.set(monthKey, (appMonthlyMap.get(monthKey) || 0) + 1);
    }
    const applicationsByMonth = Array.from(appMonthlyMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    return {
      ai: {
        totalExecutions: totalAiExecutions,
        successfulExecutions: successfulAiExecutions,
        failedExecutions: failedAiExecutions,
        successRate: safeRate(successfulAiExecutions, totalAiExecutions),
        failureRate: safeRate(failedAiExecutions, totalAiExecutions),
        byModule,
        byOperation,
        averageDurationMs,
      },
      career: {
        totalApplications,
        applied: appliedCount,
        interviewing: interviewingCount,
        offered: offeredCount,
        rejected: rejectedCount,
        interviewRate: safeRate(interviewingCount, totalApplications),
        offerRate: safeRate(offeredCount, totalApplications),
        rejectionRate: safeRate(rejectedCount, totalApplications),
        applicationsByMonth,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. PLATFORM HEALTH & RUNTIME TELEMETRY
  // ───────────────────────────────────────────────────────────────────────────

  async getPlatformHealthReport() {
    let dbStatus: 'CONNECTED' | 'ERROR' = 'CONNECTED';
    let dbLatencyMs = 0;

    try {
      const t0 = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Math.round(performance.now() - t0);
    } catch {
      dbStatus = 'ERROR';
      dbLatencyMs = -1;
    }

    const mem = process.memoryUsage();

    return {
      status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssBytes: mem.rss,
        heapTotalBytes: mem.heapTotal,
        heapUsedBytes: mem.heapUsed,
        externalBytes: mem.external,
      },
      runtime: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    };
  },
};
