import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const percentage = (part: number, total: number) => total > 0 ? part / total * 100 : 0;

// A completion indicator, not an ATS/quality score. Empty placeholders do not count.
function hasContent(value: Prisma.JsonValue | undefined): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasContent);
  if (value && typeof value === 'object') return Object.values(value).some(hasContent);
  return typeof value === 'number' && Number.isFinite(value);
}

// Canonical resume selector: active first, then most recently updated, then ID asc.
// Versions ordered by createdAt desc, then ID desc.
// If explicitResumeId is passed, ownership is verified and that specific resume is loaded.
export async function getCanonicalResume(studentProfileId: string, explicitResumeId?: string | null) {
  if (explicitResumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: explicitResumeId, studentProfileId },
      include: {
        versions: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
        },
      },
    });
    if (!resume) throw ApiError.notFound('Resume not found or does not belong to you');
    return resume;
  }

  return prisma.resume.findFirst({
    where: { studentProfileId },
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
    include: {
      versions: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
      },
    },
  });
}

export const analyticsService = {
  async getSubjectPerformance(studentProfileId: string) {
    const subjects = await prisma.subject.findMany({
      where: { semester: { studentProfileId } },
      include: { assignments: { select: { status: true } }, attendanceRecords: { select: { status: true } } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return subjects.map(subject => {
      // Preserve the existing attendance policy: PRESENT/LATE count as attended;
      // all records (including EXCUSED) count in the denominator.
      const useRecords = subject.totalClasses === 0 && subject.attendanceRecords.length > 0;
      const totalClasses = useRecords ? subject.attendanceRecords.length : subject.totalClasses;
      const attendedClasses = useRecords
        ? subject.attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
        : subject.attendedClasses;
      const totalAssignments = subject.assignments.length;
      const completedAssignments = subject.assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED').length;
      return {
        subjectId: subject.id, subjectName: subject.name, semesterId: subject.semesterId,
        totalClasses, attendedClasses, attendancePercentage: percentage(attendedClasses, totalClasses),
        totalAssignments, completedAssignments,
        assignmentCompletionRate: percentage(completedAssignments, totalAssignments),
      };
    });
  },

  async getResumeCompletion(studentProfileId: string, explicitResumeId?: string | null) {
    const resume = await getCanonicalResume(studentProfileId, explicitResumeId);
    const raw = resume?.versions[0]?.content;
    const content = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const sections = ['personalInfo', 'education', 'experience', 'skills', 'projects'] as const;
    const completedSections = sections.filter(key => {
      const value = content[key];
      return key === 'personalInfo'
        ? !!value && typeof value === 'object' && !Array.isArray(value) && hasContent(value)
        : Array.isArray(value) && hasContent(value);
    });
    return { resumeId: resume?.id ?? null, completedSections,
      missingSections: sections.filter(key => !completedSections.includes(key)),
      score: percentage(completedSections.length, sections.length) };
  },

  async getInternshipStats(studentProfileId: string) {
    const applications = await prisma.jobApplication.findMany({
      where: { studentProfileId, applicationType: 'INTERNSHIP' }, select: { status: true },
    });
    const applicationsByStatus = { APPLIED: 0, INTERVIEWING: 0, OFFERED: 0, REJECTED: 0 };
    for (const application of applications) applicationsByStatus[application.status]++;
    return { totalApplications: applications.length, applicationsByStatus,
      interviewCount: applicationsByStatus.INTERVIEWING, offerCount: applicationsByStatus.OFFERED,
      offerRate: percentage(applicationsByStatus.OFFERED, applications.length) };
  },
  async getStudentDashboard(studentProfileId: string) {
    // ---------------------------------------------------------
    // 1. Productivity Metrics
    // ---------------------------------------------------------
    const tasks = await prisma.task.findMany({
      where: { studentProfileId },
      select: { status: true },
    });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const reminders = await prisma.reminder.findMany({
      where: { studentProfileId },
      select: { isCompleted: true },
    });
    const totalReminders = reminders.length;
    const completedReminders = reminders.filter(r => r.isCompleted).length;

    // ---------------------------------------------------------
    // 2. Career Metrics
    // ---------------------------------------------------------
    const jobApplications = await prisma.jobApplication.findMany({
      where: { studentProfileId },
      select: { status: true },
    });
    const totalApplications = jobApplications.length;
    const applicationsByStatus = jobApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const interviewCount = applicationsByStatus['INTERVIEWING'] || 0;
    const offerCount = applicationsByStatus['OFFERED'] || 0;

    // ---------------------------------------------------------
    // 3. Academic Metrics
    // ---------------------------------------------------------
    const subjects = await this.getSubjectPerformance(studentProfileId);
    const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
    const attendedClasses = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
    const totalAssignments = subjects.reduce((sum, s) => sum + s.totalAssignments, 0);
    const completedAssignments = subjects.reduce((sum, s) => sum + s.completedAssignments, 0);

    const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    const assignmentCompletionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    const studyPlans = await prisma.studyPlan.findMany({
      where: { studentProfileId },
      select: { progressPercentage: true, status: true },
    });
    const totalStudyPlans = studyPlans.length;
    const completedStudyPlans = studyPlans.filter(p => p.status === 'COMPLETED').length;
    const studyPlanGoalAchievementRate = percentage(completedStudyPlans, totalStudyPlans);
    const resumeCompletion = await this.getResumeCompletion(studentProfileId);
    const averageStudyPlanProgress = totalStudyPlans > 0 
      ? studyPlans.reduce((sum, p) => sum + p.progressPercentage, 0) / totalStudyPlans 
      : 0;

    // ---------------------------------------------------------
    // 4. Overall Student Score
    // ---------------------------------------------------------
    // A simplified weighted score out of 100
    // Task Completion (30%), Assignment Completion (30%), Attendance (30%), Study Plan (10%)
    let overallScore = 0;
    let weightTotal = 0;
    
    if (totalTasks > 0) {
      overallScore += taskCompletionRate * 0.3;
      weightTotal += 0.3;
    }
    if (totalAssignments > 0) {
      overallScore += assignmentCompletionRate * 0.3;
      weightTotal += 0.3;
    }
    if (totalClasses > 0) {
      overallScore += attendancePercentage * 0.3;
      weightTotal += 0.3;
    }
    if (totalStudyPlans > 0) {
      overallScore += averageStudyPlanProgress * 0.1;
      weightTotal += 0.1;
    }
    
    // Normalize if some weights were missing
    if (weightTotal > 0 && weightTotal < 1) {
      overallScore = (overallScore / weightTotal);
    } else if (weightTotal === 0) {
      overallScore = 0;
    }

    // Attempt to update the StudentAnalytics table to cache this calculation
    await prisma.studentAnalytics.upsert({
      where: { studentProfileId },
      update: {
        attendancePercentage,
        taskCompletionRate,
        generatedAt: new Date(),
      },
      create: {
        studentProfileId,
        attendancePercentage,
        taskCompletionRate,
        generatedAt: new Date(),
      },
    });

    return {
      academic: {
        attendancePercentage,
        totalAssignments,
        completedAssignments,
        assignmentCompletionRate,
        totalStudyPlans,
        averageStudyPlanProgress,
        completedStudyPlans,
        studyPlanGoalAchievementRate,
      },
      productivity: {
        totalTasks,
        pendingTasks,
        completedTasks,
        taskCompletionRate,
        totalReminders,
        completedReminders,
      },
      career: {
        resumeCompletionScore: resumeCompletion.score,
        resumeCompletion,
        totalApplications,
        applicationsByStatus,
        interviewCount,
        offerCount,
      },
      overallScore,
    };
  },

  // ─── AN-1: Skills Progress ────────────────────────────────────────────────

  async getSkillsProgress(studentProfileId: string) {
    const skills = await prisma.skill.findMany({
      where: { studentProfileId },
      select: { name: true, category: true, proficiencyLevel: true },
      orderBy: { category: 'asc' },
    });

    const totalSkills = skills.length;
    const averageProficiency =
      totalSkills > 0
        ? skills.reduce((sum, s) => sum + s.proficiencyLevel, 0) / totalSkills
        : 0;

    // Group by category
    type CategoryStats = { count: number; avgProficiency: number; skills: string[] };
    const byCategory: Record<string, CategoryStats> = {};

    for (const skill of skills) {
      let entry = byCategory[skill.category];
      if (!entry) {
        entry = { count: 0, avgProficiency: 0, skills: [] };
        byCategory[skill.category] = entry;
      }
      entry.count++;
      entry.skills.push(skill.name);
    }

    for (const cat of Object.keys(byCategory)) {
      const entry = byCategory[cat];
      if (!entry) continue;
      const catSkills = skills.filter(s => s.category === cat);
      entry.avgProficiency =
        Math.round(
          (catSkills.reduce((sum, s) => sum + s.proficiencyLevel, 0) / catSkills.length) * 100,
        ) / 100;
    }

    return {
      totalSkills,
      averageProficiency: Math.round(averageProficiency * 100) / 100,
      byCategory,
    };
  },

  // ─── AN-2: Placement Readiness ────────────────────────────────────────────
  //
  // IMPORTANT: This is a product-defined heuristic score, not a scientifically
  // validated employability metric. The weights below were chosen to reflect
  // V1 priorities but should be revisited with real student data.
  //   Skills: 25%  — breadth of technical/soft skills
  //   Resume: 25%  — latest ATS score from AI analysis
  //   Applications: 20% — demonstrates active job search behaviour
  //   Certifications: 15% — signals verified credentials
  //   Projects: 15% — demonstrates applied experience
  //
  async getPlacementReadiness(studentProfileId: string) {
    const [skills, resume, applications, certifications, projects] = await Promise.all([
      prisma.skill.findMany({ where: { studentProfileId } }),
      getCanonicalResume(studentProfileId),
      prisma.jobApplication.findMany({ where: { studentProfileId } }),
      prisma.certification.findMany({ where: { studentProfileId } }),
      prisma.project.findMany({ where: { studentProfileId } }),
    ]);

    // Each component is scaled 0–100 independently before weighting
    const skillScore = Math.min(skills.length * 10, 100); // saturates at 10 skills
    const resumeScore =
      resume?.versions[0]?.atsScore != null ? Math.min(resume.versions[0].atsScore, 100) : 0;
    const applicationScore = Math.min(applications.length * 15, 100);
    const certificationScore = Math.min(certifications.length * 25, 100);
    const projectScore = Math.min(projects.length * 20, 100);

    const readinessScore = Math.round(
      skillScore * 0.25 +
        resumeScore * 0.25 +
        applicationScore * 0.2 +
        certificationScore * 0.15 +
        projectScore * 0.15,
    );

    const hasResume = resume !== null;
    const recommendations: string[] = [
      ...(skills.length < 5 ? ['Add more skills to your profile (aim for at least 5)'] : []),
      ...(!hasResume
        ? ['Create a resume — it contributes 25% of the readiness score']
        : []),
      ...(resumeScore < 70 && hasResume
        ? ['Run AI analysis on your resume to improve the ATS score (currently below 70)']
        : []),
      ...(certifications.length === 0 ? ['Add relevant certifications'] : []),
      ...(projects.length === 0 ? ['Showcase at least one personal project'] : []),
      ...(applications.length === 0
        ? ['Start applying to internships or jobs to demonstrate active search']
        : []),
    ];

    return {
      readinessScore,
      note: 'Readiness score is a product-defined heuristic (not a validated employability measure). Weights: Skills 25%, Resume ATS 25%, Applications 20%, Certifications 15%, Projects 15%.',
      breakdown: {
        skills: { score: skillScore, count: skills.length },
        resume: { score: resumeScore, hasResume },
        applications: { score: applicationScore, count: applications.length },
        certifications: { score: certificationScore, count: certifications.length },
        projects: { score: projectScore, count: projects.length },
      },
      recommendations,
    };
  },

  // ─── AN-3: Daily/Weekly/Custom Activity Breakdown ─────────────────────────
  //
  // Activity uses UTC half-open [from, to) intervals.
  // Tasks are queried strictly by completedAt. Legacy tasks with null completedAt
  // are excluded from dated windows to prevent mutable updatedAt pollution,
  // but remain included in lifetime dashboard metrics.
  //
  async getActivityBreakdown(
    studentProfileId: string,
    period: 'daily' | 'weekly' | 'custom',
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    let from: Date;
    let to: Date;

    if (period === 'daily') {
      from = startDate
        ? new Date(startDate)
        : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      to = endDate
        ? new Date(endDate)
        : new Date(from.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === 'weekly') {
      from = startDate
        ? new Date(startDate)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = endDate ? new Date(endDate) : now;
    } else {
      // 'custom' — both dates guaranteed present by Zod schema validation
      from = new Date(startDate!);
      to = new Date(endDate!);
    }

    const [tasksCompleted, attendanceRecords] = await Promise.all([
      prisma.task.findMany({
        where: {
          studentProfileId,
          status: 'DONE',
          completedAt: { gte: from, lt: to },
        },
        select: { id: true, title: true, completedAt: true },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          subject: { semester: { studentProfileId } },
          date: { gte: from, lt: to },
        },
        select: { status: true },
      }),
    ]);

    const presentCount = attendanceRecords.filter(r =>
      ['PRESENT', 'LATE'].includes(r.status),
    ).length;
    const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;

    return {
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      tasks: {
        completed: tasksCompleted.length,
        note: 'Daily activity uses UTC start-inclusive, end-exclusive boundaries. Counted by completedAt timestamp; legacy tasks with unknown completion dates are excluded from dated activity breakdown but retained in total task counts.',
      },
      attendance: {
        totalRecords: attendanceRecords.length,
        present: presentCount,
        absent: absentCount,
        percentage:
          attendanceRecords.length > 0
            ? Math.round((presentCount / attendanceRecords.length) * 10000) / 100
            : 0,
      },
    };
  },
};
