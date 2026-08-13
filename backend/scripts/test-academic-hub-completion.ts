import { PrismaClient } from '@prisma/client';
import { studyPlanService } from '../src/services/studyplan.service.js';
import { noteService } from '../src/services/note.service.js';
import { attendanceService } from '../src/services/attendance.service.js';
import { calendarService } from '../src/services/calendar.service.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Academic Hub Completion Tests (Study Planner, Notes, Attendance, Calendar)...');

  // Test data setup
  const user1ProfileId = 'c1fbd9a7-8f5b-4c00-bb65-1d4e0b0b8d01';
  const user2ProfileId = 'd2fbd9a7-8f5b-4c00-bb65-1d4e0b0b8d02';

  // Cleanup before tests
  await prisma.calendarEvent.deleteMany({ where: { studentProfileId: { in: [user1ProfileId, user2ProfileId] } } });
  await prisma.attendanceRecord.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.studyPlan.deleteMany({ where: { studentProfileId: { in: [user1ProfileId, user2ProfileId] } } });
  
  await prisma.subject.deleteMany({ where: { semester: { studentProfileId: { in: [user1ProfileId, user2ProfileId] } } } });
  await prisma.semester.deleteMany({ where: { studentProfileId: { in: [user1ProfileId, user2ProfileId] } } });

  // Ensure mock student profiles exist
  await prisma.user.upsert({
    where: { email: 'academic1@example.com' },
    update: {},
    create: {
      email: 'academic1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: { id: user1ProfileId, firstName: 'Academic', lastName: 'User1' },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'academic2@example.com' },
    update: {},
    create: {
      email: 'academic2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: { id: user2ProfileId, firstName: 'Academic', lastName: 'User2' },
      },
    },
  });

  const sem = await prisma.semester.create({
    data: { studentProfileId: user1ProfileId, name: 'Fall 2026', startDate: new Date(), endDate: new Date() }
  });
  const sub = await prisma.subject.create({
    data: { semesterId: sem.id, name: 'Math' }
  });

  try {
    // ==========================================
    // 1. STUDY PLANNER
    // ==========================================
    console.log('\n--- Testing Study Planner ---');
    const plan = await studyPlanService.createStudyPlan(user1ProfileId, {
      title: 'Finals Prep',
      goals: 'Get A+',
    });
    assert.strictEqual(plan.title, 'Finals Prep');
    console.log('✅ Study plan creation successful');

    try {
      await studyPlanService.getStudyPlanById(user2ProfileId, plan.id);
      assert.fail('Should prevent cross-user access');
    } catch (e: any) {
      assert.strictEqual(e.statusCode, 404);
      console.log('✅ Cross-user data isolation verified');
    }

    // ==========================================
    // 2. NOTES MANAGER
    // ==========================================
    console.log('\n--- Testing Notes Manager ---');
    const note = await noteService.createNote(user1ProfileId, {
      subjectId: sub.id,
      title: 'Lecture 1',
      tags: ['intro']
    });
    assert.strictEqual(note.title, 'Lecture 1');
    console.log('✅ Note creation successful');

    try {
      await noteService.getNoteById(user2ProfileId, note.id);
      assert.fail('Should prevent cross-user access');
    } catch (e: any) {
      assert.strictEqual(e.statusCode, 404);
      console.log('✅ Cross-user data isolation verified');
    }

    // ==========================================
    // 3. ATTENDANCE TRACKER
    // ==========================================
    console.log('\n--- Testing Attendance Tracker ---');
    const attendance = await attendanceService.createAttendanceRecord(user1ProfileId, {
      subjectId: sub.id,
      date: new Date().toISOString(),
      status: 'PRESENT',
    });
    assert.strictEqual(attendance.status, 'PRESENT');
    console.log('✅ Attendance record creation successful');

    const updatedSub = await prisma.subject.findUnique({ where: { id: sub.id } });
    assert.strictEqual(updatedSub?.totalClasses, 1);
    assert.strictEqual(updatedSub?.attendedClasses, 1);
    console.log('✅ Subject attendance counters updated');

    try {
      await attendanceService.getAttendanceRecordById(user2ProfileId, attendance.id);
      assert.fail('Should prevent cross-user access');
    } catch (e: any) {
      assert.strictEqual(e.statusCode, 404);
      console.log('✅ Cross-user data isolation verified');
    }

    // ==========================================
    // 4. ACADEMIC CALENDAR
    // ==========================================
    console.log('\n--- Testing Academic Calendar ---');
    const event = await calendarService.createCalendarEvent(user1ProfileId, {
      title: 'Midterm',
      date: new Date().toISOString(),
      eventType: 'EXAM',
    });
    assert.strictEqual(event.title, 'Midterm');
    console.log('✅ Calendar event creation successful');

    try {
      await calendarService.getCalendarEventById(user2ProfileId, event.id);
      assert.fail('Should prevent cross-user access');
    } catch (e: any) {
      assert.strictEqual(e.statusCode, 404);
      console.log('✅ Cross-user data isolation verified');
    }

    console.log('\n🎉 All Academic Hub Completion tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: ['academic1@example.com', 'academic2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
