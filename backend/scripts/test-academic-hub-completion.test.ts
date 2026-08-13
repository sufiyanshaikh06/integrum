import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let authCookie1: string;
let authCookie2: string;
let student1Id: string;
let student2Id: string;
let subjectId1: string;

beforeAll(async () => {
  // Clean up
  await prisma.calendarEvent.deleteMany({});
  await prisma.attendanceRecord.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.studyPlan.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.semester.deleteMany({});
  await prisma.user.deleteMany({
    where: { email: { in: ['test-academic-1@integrum.com', 'test-academic-2@integrum.com'] } },
  });

  // Create User 1
  const user1 = await request(app).post('/api/v1/auth/register').send({
    email: 'test-academic-1@integrum.com',
    password: 'Password123!',
    firstName: 'Academic',
    lastName: 'One',
    role: 'STUDENT',
  });
  authCookie1 = user1.headers['set-cookie'][0];

  const profile1 = await prisma.user.findUnique({
    where: { email: 'test-academic-1@integrum.com' },
    include: { studentProfile: true },
  });
  student1Id = profile1!.studentProfile!.id;

  // Create User 2
  const user2 = await request(app).post('/api/v1/auth/register').send({
    email: 'test-academic-2@integrum.com',
    password: 'Password123!',
    firstName: 'Academic',
    lastName: 'Two',
    role: 'STUDENT',
  });
  authCookie2 = user2.headers['set-cookie'][0];

  const profile2 = await prisma.user.findUnique({
    where: { email: 'test-academic-2@integrum.com' },
    include: { studentProfile: true },
  });
  student2Id = profile2!.studentProfile!.id;

  // Create a Semester and Subject for User 1 to use for Notes/Attendance
  const sem = await prisma.semester.create({
    data: {
      studentProfileId: student1Id,
      name: 'Fall 2026',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
    },
  });

  const sub = await prisma.subject.create({
    data: {
      semesterId: sem.id,
      name: 'Advanced Programming',
      code: 'CS400',
    },
  });
  subjectId1 = sub.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Academic Hub Completion - Study Planner', () => {
  let studyPlanId: string;

  it('should create a study plan', async () => {
    const res = await request(app)
      .post('/api/v1/study-plans')
      .set('Cookie', authCookie1)
      .send({
        title: 'Finals Prep',
        goals: 'Study hard',
        targetDate: new Date('2026-12-10').toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Finals Prep');
    studyPlanId = res.body.data.id;
  });

  it('should prevent cross-user access to study plan', async () => {
    const res = await request(app)
      .get(`/api/v1/study-plans/${studyPlanId}`)
      .set('Cookie', authCookie2);
    expect(res.status).toBe(404);
  });
});

describe('Academic Hub Completion - Notes Manager', () => {
  let noteId: string;

  it('should create a note', async () => {
    const res = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', authCookie1)
      .send({
        subjectId: subjectId1,
        title: 'Lecture 1 Notes',
        content: 'Intro to pointers',
      });
    expect(res.status).toBe(201);
    noteId = res.body.data.id;
  });

  it('should prevent cross-user access to note', async () => {
    const res = await request(app)
      .get(`/api/v1/notes/${noteId}`)
      .set('Cookie', authCookie2);
    expect(res.status).toBe(404);
  });
});

describe('Academic Hub Completion - Attendance Tracker', () => {
  let attendanceId: string;

  it('should log attendance and update subject stats', async () => {
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Cookie', authCookie1)
      .send({
        subjectId: subjectId1,
        date: new Date().toISOString(),
        status: 'PRESENT',
      });
    expect(res.status).toBe(201);
    attendanceId = res.body.data.id;

    const sub = await prisma.subject.findUnique({ where: { id: subjectId1 } });
    expect(sub!.totalClasses).toBe(1);
    expect(sub!.attendedClasses).toBe(1);
  });

  it('should prevent cross-user access to attendance', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/${attendanceId}`)
      .set('Cookie', authCookie2);
    expect(res.status).toBe(404);
  });
});

describe('Academic Hub Completion - Academic Calendar', () => {
  let eventId: string;

  it('should create a calendar event', async () => {
    const res = await request(app)
      .post('/api/v1/calendar')
      .set('Cookie', authCookie1)
      .send({
        title: 'Midterm Exam',
        date: new Date('2026-10-15').toISOString(),
        eventType: 'EXAM',
      });
    expect(res.status).toBe(201);
    eventId = res.body.data.id;
  });

  it('should prevent cross-user access to calendar event', async () => {
    const res = await request(app)
      .get(`/api/v1/calendar/${eventId}`)
      .set('Cookie', authCookie2);
    expect(res.status).toBe(404);
  });
});
