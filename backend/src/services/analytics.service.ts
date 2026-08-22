import { prisma } from '../config/prisma.js';

export const analyticsService = {
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
    // Need to fetch semesters to get subjects and assignments
    const semesters = await prisma.semester.findMany({
      where: { studentProfileId },
      include: {
        subjects: {
          include: {
            assignments: true,
            attendanceRecords: true,
          }
        }
      }
    });

    let totalClasses = 0;
    let attendedClasses = 0;
    let totalAssignments = 0;
    let completedAssignments = 0;

    for (const semester of semesters) {
      for (const subject of semester.subjects) {
        totalClasses += subject.totalClasses;
        attendedClasses += subject.attendedClasses;
        
        // Also fallback to attendance records if manual subject totals aren't used
        if (subject.totalClasses === 0 && subject.attendanceRecords.length > 0) {
          totalClasses += subject.attendanceRecords.length;
          attendedClasses += subject.attendanceRecords.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length;
        }

        totalAssignments += subject.assignments.length;
        completedAssignments += subject.assignments.filter(a => ['SUBMITTED', 'GRADED'].includes(a.status)).length;
      }
    }

    const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    const assignmentCompletionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

    const studyPlans = await prisma.studyPlan.findMany({
      where: { studentProfileId },
      select: { progressPercentage: true, status: true },
    });
    const totalStudyPlans = studyPlans.length;
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
      if (!byCategory[skill.category]) {
        byCategory[skill.category] = { count: 0, avgProficiency: 0, skills: [] };
      }
      byCategory[skill.category].count++;
      byCategory[skill.category].skills.push(skill.name);
    }

    for (const cat of Object.keys(byCategory)) {
      const catSkills = skills.filter(s => s.category === cat);
      byCategory[cat].avgProficiency =
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
    const [skills, resumes, applications, certifications, projects] = await Promise.all([
      prisma.skill.findMany({ where: { studentProfileId } }),
      prisma.resume.findMany({
        where: { studentProfileId },
        include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.jobApplication.findMany({ where: { studentProfileId } }),
      prisma.certification.findMany({ where: { studentProfileId } }),
      prisma.project.findMany({ where: { studentProfileId } }),
    ]);

    // Each component is scaled 0–100 independently before weighting
    const skillScore = Math.min(skills.length * 10, 100); // saturates at 10 skills
    const resumeScore =
      resumes.length > 0 ? Math.min(resumes[0]?.versions?.[0]?.atsScore ?? 0, 100) : 0;
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

    const recommendations: string[] = [
      ...(skills.length < 5 ? ['Add more skills to your profile (aim for at least 5)'] : []),
      ...(resumes.length === 0
        ? ['Create a resume — it contributes 25% of the readiness score']
        : []),
      ...(resumeScore < 70 && resumes.length > 0
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
        resume: { score: resumeScore, hasResume: resumes.length > 0 },
        applications: { score: applicationScore, count: applications.length },
        certifications: { score: certificationScore, count: certifications.length },
        projects: { score: projectScore, count: projects.length },
      },
      recommendations,
    };
  },

  // ─── AN-3: Daily/Weekly/Custom Activity Breakdown ─────────────────────────
  //
  // KNOWN LIMITATION (tasks): Tasks are counted by updatedAt, not by a
  // dedicated completedAt timestamp. A task completed earlier but edited
  // within the window may be miscounted. A future migration adding
  // Task.completedAt would eliminate this ambiguity.
  //
  async getActivityBreakdown(
    studentProfileId: string,
    period: 'daily' | 'weekly' | 'custom',
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    let from: Date;
    const to: Date = endDate ? new Date(endDate) : now;

    if (period === 'daily') {
      // Calendar day start in local-equivalent UTC
      from = startDate
        ? new Date(startDate)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      from = startDate
        ? new Date(startDate)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // 'custom' — both dates guaranteed present by Zod schema validation
      from = new Date(startDate!);
    }

    const [tasksCompleted, attendanceRecords] = await Promise.all([
      prisma.task.findMany({
        where: {
          studentProfileId,
          status: 'DONE',
          // NOTE: using updatedAt as a proxy for completion time — see limitation above
          updatedAt: { gte: from, lte: to },
        },
        select: { id: true, title: true, updatedAt: true },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          subject: { semester: { studentProfileId } },
          date: { gte: from, lte: to },
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
        note: 'Counted by updatedAt; see analytics service for known limitation.',
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
