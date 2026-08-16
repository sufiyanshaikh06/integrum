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
  }
};
