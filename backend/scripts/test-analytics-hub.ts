import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../src/services/analytics.service.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Analytics Hub Integration Tests...');

  const studentProfileId = '55fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c55';
  const otherProfileId = '66fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c66';

  // 1. Cleanup
  await prisma.user.deleteMany({
    where: { email: { in: ['analytics1@example.com', 'analytics2@example.com'] } }
  });

  // 2. Setup Data
  const user1 = await prisma.user.create({
    data: {
      email: 'analytics1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: studentProfileId,
          firstName: 'Data',
          lastName: 'Student',
          university: 'Analytics Uni',
        },
      },
    },
  });

  // Productivity
  await prisma.task.createMany({
    data: [
      { studentProfileId, title: 'Task 1', status: 'DONE' },
      { studentProfileId, title: 'Task 2', status: 'TODO' },
      { studentProfileId, title: 'Task 3', status: 'IN_PROGRESS' },
    ]
  });

  await prisma.reminder.createMany({
    data: [
      { studentProfileId, title: 'Rem 1', triggerAt: new Date(), isCompleted: true },
      { studentProfileId, title: 'Rem 2', triggerAt: new Date(), isCompleted: false },
    ]
  });

  // Career
  await prisma.jobApplication.createMany({
    data: [
      { studentProfileId, companyName: 'A', role: 'Dev', status: 'APPLIED' },
      { studentProfileId, companyName: 'B', role: 'Dev', status: 'INTERVIEWING' },
      { studentProfileId, companyName: 'C', role: 'Dev', status: 'OFFERED' },
    ]
  });

  // Academic
  const semester = await prisma.semester.create({
    data: {
      studentProfileId,
      name: 'Fall 2026',
      startDate: new Date(),
      endDate: new Date(),
    }
  });

  const subject = await prisma.subject.create({
    data: {
      semesterId: semester.id,
      name: 'CS 101',
      totalClasses: 10,
      attendedClasses: 8,
    }
  });

  await prisma.assignment.createMany({
    data: [
      { subjectId: subject.id, title: 'HW 1', status: 'GRADED' },
      { subjectId: subject.id, title: 'HW 2', status: 'PENDING' },
    ]
  });

  await prisma.studyPlan.create({
    data: {
      studentProfileId,
      title: 'Finals Prep',
      progressPercentage: 50.0,
    }
  });

  try {
    // 3. Test Retrieval
    console.log('\nTesting Analytics Retrieval...');
    const dashboard = await analyticsService.getStudentDashboard(studentProfileId);

    // Productivity Assertions
    assert.strictEqual(dashboard.productivity.totalTasks, 3);
    assert.strictEqual(dashboard.productivity.completedTasks, 1);
    assert.strictEqual(dashboard.productivity.pendingTasks, 2);
    // 1/3 = 33.33...
    assert(dashboard.productivity.taskCompletionRate > 33 && dashboard.productivity.taskCompletionRate < 34);
    assert.strictEqual(dashboard.productivity.totalReminders, 2);
    assert.strictEqual(dashboard.productivity.completedReminders, 1);

    // Career Assertions
    assert.strictEqual(dashboard.career.totalApplications, 3);
    assert.strictEqual(dashboard.career.interviewCount, 1);
    assert.strictEqual(dashboard.career.offerCount, 1);
    assert.strictEqual(dashboard.career.applicationsByStatus['APPLIED'], 1);

    // Academic Assertions
    assert.strictEqual(dashboard.academic.totalAssignments, 2);
    assert.strictEqual(dashboard.academic.completedAssignments, 1);
    assert.strictEqual(dashboard.academic.assignmentCompletionRate, 50);
    assert.strictEqual(dashboard.academic.attendancePercentage, 80);
    assert.strictEqual(dashboard.academic.totalStudyPlans, 1);
    assert.strictEqual(dashboard.academic.averageStudyPlanProgress, 50);

    // Score assertion
    assert(dashboard.overallScore > 0 && dashboard.overallScore <= 100);

    // DB Update check
    const dbAnalytics = await prisma.studentAnalytics.findUnique({
      where: { studentProfileId }
    });
    assert.ok(dbAnalytics);
    assert.strictEqual(dbAnalytics.attendancePercentage, 80);

    console.log('✅ Analytics retrieved and aggregated successfully');

    // 4. Empty-data handling
    console.log('\nTesting Empty Data Handling...');
    const emptyUser = await prisma.user.create({
      data: {
        email: 'analytics2@example.com',
        passwordHash: 'dummy',
        role: 'STUDENT',
        studentProfile: {
          create: {
            id: otherProfileId,
            firstName: 'Empty',
            lastName: 'Student',
          },
        },
      },
    });

    const emptyDashboard = await analyticsService.getStudentDashboard(otherProfileId);
    assert.strictEqual(emptyDashboard.productivity.totalTasks, 0);
    assert.strictEqual(emptyDashboard.career.totalApplications, 0);
    assert.strictEqual(emptyDashboard.academic.totalAssignments, 0);
    assert.strictEqual(emptyDashboard.overallScore, 0);
    
    console.log('✅ Empty data handled gracefully');

    console.log('\n🎉 All Analytics Hub tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup mock users
    await prisma.user.deleteMany({
      where: { email: { in: ['analytics1@example.com', 'analytics2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
