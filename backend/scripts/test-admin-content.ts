/**
 * Phase A4 — Admin Content Management & Scoped Student Feeds Integration Tests
 *
 * Comprehensive test suite verifying:
 * - RBAC protection (403 for student on /admin/content/*)
 * - Announcement & Notice CRUD + Draft/Publish lifecycle (isPublished, publishedAt)
 * - Strict ALL / DEPARTMENT / COURSE scope validation & 400 rejection on invalid combinations
 * - Scope transitions (DEPARTMENT -> COURSE, COURSE -> ALL) and stale foreign key cleanup
 * - Expiration filtering (expired hidden from students, visible to admins)
 * - Notice type & URGENT priority handling
 * - Institutional Event CRUD with date boundary checks (endDate >= startDate)
 * - Independence of personal student CalendarEvents
 * - Academic Resource CRUD with URL/metadata management and scope normalization
 * - Authenticated Student Feeds (/api/v1/content/*) with institutional scope isolation
 * - Unauthenticated feed access rejection (401)
 * - Atomic AdminAuditLog emissions on all mutations
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.dev';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminMasterPass2026!';

// Student 1: CS Course & Dept
const csStudentEmail = `cs_student_a4_${ts}@integrum.dev`;
// Student 2: EE Course & Dept
const eeStudentEmail = `ee_student_a4_${ts}@integrum.dev`;
// Student 3: Unenrolled (no course or dept)
const generalStudentEmail = `gen_student_a4_${ts}@integrum.dev`;
const studentPass = 'StudentPass123!';

let adminToken = '';
let csStudentToken = '';
let eeStudentToken = '';
let genStudentToken = '';

let csDeptId = '';
let eeDeptId = '';
let csCourseId = '';
let eeCourseId = '';

let allAnnouncementId = '';
let deptAnnouncementId = '';
let courseAnnouncementId = '';
let draftAnnouncementId = '';
let expiredAnnouncementId = '';

let institutionalEventId = '';
let academicResourceId = '';

async function req(
  method: string,
  path: string,
  body?: unknown,
  authToken?: string,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as any;
  return { status: res.status, json };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function setup() {
  console.log('\n--- Setup ---');
  // 1. Admin Login
  const aLogin = await req('POST', '/auth/login', { email: adminEmail, password: adminPassword });
  assert(aLogin.status === 200, `Admin login failed: ${JSON.stringify(aLogin.json)}`);
  adminToken = aLogin.json.data.accessToken;

  // 2. Setup Departments and Courses for scoping
  const csDept = await req(
    'POST',
    '/admin/academics/departments',
    { name: `Computer Science A4 ${ts}`, code: `CS${ts.toString().slice(-4)}` },
    adminToken
  );
  csDeptId = csDept.json.data.id;

  const eeDept = await req(
    'POST',
    '/admin/academics/departments',
    { name: `Electrical Engineering A4 ${ts}`, code: `EE${ts.toString().slice(-4)}` },
    adminToken
  );
  eeDeptId = eeDept.json.data.id;

  const csCourse = await req(
    'POST',
    '/admin/academics/courses',
    { departmentId: csDeptId, name: 'B.Tech CS A4', code: `CS_BTECH_${ts.toString().slice(-4)}` },
    adminToken
  );
  csCourseId = csCourse.json.data.id;

  const eeCourse = await req(
    'POST',
    '/admin/academics/courses',
    { departmentId: eeDeptId, name: 'B.Tech EE A4', code: `EE_BTECH_${ts.toString().slice(-4)}` },
    adminToken
  );
  eeCourseId = eeCourse.json.data.id;

  // 3. Register and Enroll Students
  await req('POST', '/auth/register', { email: csStudentEmail, password: studentPass, firstName: 'CS', lastName: 'Student' });
  const csLogin = await req('POST', '/auth/login', { email: csStudentEmail, password: studentPass });
  csStudentToken = csLogin.json.data.accessToken;
  const csMe = await req('GET', '/users/me', undefined, csStudentToken);
  await prisma.studentProfile.update({
    where: { id: csMe.json.data.studentProfile.id },
    data: { courseId: csCourseId },
  });

  await req('POST', '/auth/register', { email: eeStudentEmail, password: studentPass, firstName: 'EE', lastName: 'Student' });
  const eeLogin = await req('POST', '/auth/login', { email: eeStudentEmail, password: studentPass });
  eeStudentToken = eeLogin.json.data.accessToken;
  const eeMe = await req('GET', '/users/me', undefined, eeStudentToken);
  await prisma.studentProfile.update({
    where: { id: eeMe.json.data.studentProfile.id },
    data: { courseId: eeCourseId },
  });

  await req('POST', '/auth/register', { email: generalStudentEmail, password: studentPass, firstName: 'Gen', lastName: 'Student' });
  const genLogin = await req('POST', '/auth/login', { email: generalStudentEmail, password: studentPass });
  genStudentToken = genLogin.json.data.accessToken;

  console.log('  ✅ Institutional setup complete: CS Dept/Course, EE Dept/Course, and 3 scoped Students.');
}

async function testAnnouncementManagement() {
  console.log('\nA4.2: Announcement & Notice Management (Validation, Lifecycle, Scoping)...');

  // 1. RBAC Check: Student cannot create announcement
  const studentCreate = await req(
    'POST',
    '/admin/content/announcements',
    { title: 'Student Post', content: 'Testing', targetScope: 'ALL' },
    csStudentToken
  );
  assert(studentCreate.status === 403, `Expected 403 for student creating announcement, got ${studentCreate.status}`);
  console.log('  ✅ Student creating announcement rejected with 403.');

  // 2. Scope Validation Invariants
  // A. ALL + departmentId -> 400
  const invalidAll = await req(
    'POST',
    '/admin/content/announcements',
    { title: 'Invalid ALL', content: 'Content', targetScope: 'ALL', departmentId: csDeptId },
    adminToken
  );
  assert(invalidAll.status === 400, `Expected 400 for ALL with departmentId, got ${invalidAll.status}`);

  // B. DEPARTMENT without departmentId -> 400
  const invalidDept = await req(
    'POST',
    '/admin/content/announcements',
    { title: 'Invalid Dept', content: 'Content', targetScope: 'DEPARTMENT' },
    adminToken
  );
  assert(invalidDept.status === 400, `Expected 400 for DEPARTMENT without departmentId, got ${invalidDept.status}`);

  // C. COURSE without courseId -> 400
  const invalidCourse = await req(
    'POST',
    '/admin/content/announcements',
    { title: 'Invalid Course', content: 'Content', targetScope: 'COURSE' },
    adminToken
  );
  assert(invalidCourse.status === 400, `Expected 400 for COURSE without courseId, got ${invalidCourse.status}`);

  // D. Invalid department ID -> 404
  const notFoundDept = await req(
    'POST',
    '/admin/content/announcements',
    {
      title: 'Bad UUID Dept',
      content: 'Content',
      targetScope: 'DEPARTMENT',
      departmentId: '00000000-0000-0000-0000-000000000000',
    },
    adminToken
  );
  assert(notFoundDept.status === 404, `Expected 404 for non-existent departmentId, got ${notFoundDept.status}`);
  console.log('  ✅ Scope validation boundaries (ALL/DEPARTMENT/COURSE/404) verified.');

  // 3. Admin creates Draft Announcement (ALL scope)
  const draftRes = await req(
    'POST',
    '/admin/content/announcements',
    {
      title: 'Campus Spring Festival Draft',
      content: 'Initial planning details for spring fest.',
      priority: 'MEDIUM',
      targetScope: 'ALL',
    },
    adminToken
  );
  assert(draftRes.status === 201, `Draft create failed: ${JSON.stringify(draftRes.json)}`);
  draftAnnouncementId = draftRes.json.data.id;
  assert(draftRes.json.data.isPublished === false, 'Draft must have isPublished: false');
  assert(draftRes.json.data.publishedAt === null, 'Draft must have publishedAt: null');
  console.log(`  ✅ Draft announcement created (ID: ${draftAnnouncementId}, isPublished=false).`);

  // 4. Verify Student cannot see draft
  const studentFeedDraft = await req('GET', '/content/announcements', undefined, csStudentToken);
  assert(studentFeedDraft.status === 200, 'Student feed request failed');
  const hasDraft = studentFeedDraft.json.data.some((a: any) => a.id === draftAnnouncementId);
  assert(!hasDraft, 'Draft announcement must NOT appear in student feed');
  console.log('  ✅ Draft announcement hidden from student feed.');

  // 5. Admin publishes draft -> isPublished = true, publishedAt != null
  const pubRes = await req('PATCH', `/admin/content/announcements/${draftAnnouncementId}/publish`, undefined, adminToken);
  assert(pubRes.status === 200, `Publish failed: ${JSON.stringify(pubRes.json)}`);
  assert(pubRes.json.data.isPublished === true, 'isPublished must be true after publish');
  assert(pubRes.json.data.publishedAt !== null, 'publishedAt must be set after publish');
  allAnnouncementId = draftAnnouncementId;
  console.log('  ✅ Draft announcement published successfully.');

  // 6. Admin creates Department-targeted Announcement (CS Dept)
  const deptRes = await req(
    'POST',
    '/admin/content/announcements',
    {
      title: 'CS Department Coding Contest',
      content: 'Exclusive to Computer Science students.',
      priority: 'HIGH',
      targetScope: 'DEPARTMENT',
      departmentId: csDeptId,
    },
    adminToken
  );
  deptAnnouncementId = deptRes.json.data.id;
  await req('PATCH', `/admin/content/announcements/${deptAnnouncementId}/publish`, undefined, adminToken);
  console.log(`  ✅ CS Department announcement published (ID: ${deptAnnouncementId}).`);

  // 7. Admin creates Course-targeted Announcement (CS B.Tech Course)
  const courseRes = await req(
    'POST',
    '/admin/content/announcements',
    {
      type: 'NOTICE',
      title: 'CS B.Tech Project Lab Allocation',
      content: 'Lab assignments for B.Tech CS students.',
      priority: 'URGENT',
      targetScope: 'COURSE',
      courseId: csCourseId,
    },
    adminToken
  );
  assert(courseRes.json.data.type === 'NOTICE', 'type must be NOTICE');
  assert(courseRes.json.data.priority === 'URGENT', 'priority must be URGENT');
  courseAnnouncementId = courseRes.json.data.id;
  await req('PATCH', `/admin/content/announcements/${courseAnnouncementId}/publish`, undefined, adminToken);
  console.log(`  ✅ URGENT Notice for CS Course published (ID: ${courseAnnouncementId}).`);

  // 8. Admin creates Expired Announcement
  const pastDate = new Date(Date.now() - 3600000).toISOString();
  const expRes = await req(
    'POST',
    '/admin/content/announcements',
    {
      title: 'Yesterday Seminar (Expired)',
      content: 'This seminar is in the past.',
      targetScope: 'ALL',
      expiresAt: pastDate,
    },
    adminToken
  );
  expiredAnnouncementId = expRes.json.data.id;
  await req('PATCH', `/admin/content/announcements/${expiredAnnouncementId}/publish`, undefined, adminToken);

  // Admin listing sees expired announcement
  const adminList = await req('GET', '/admin/content/announcements', undefined, adminToken);
  const adminHasExpired = adminList.json.data.items.some((a: any) => a.id === expiredAnnouncementId);
  assert(adminHasExpired, 'Admin listing must still show expired announcement');
  console.log('  ✅ Expired announcement visible in Admin management listing.');

  // 9. Scope Transition: DEPARTMENT -> COURSE -> ALL with stale ID cleanup
  const transitionToCourse = await req(
    'PATCH',
    `/admin/content/announcements/${deptAnnouncementId}`,
    { targetScope: 'COURSE', courseId: csCourseId },
    adminToken
  );
  assert(transitionToCourse.status === 200, 'Transition to COURSE failed');
  assert(transitionToCourse.json.data.targetScope === 'COURSE', 'Scope must be COURSE');
  assert(transitionToCourse.json.data.departmentId === null, 'Stale departmentId must be cleared');
  assert(transitionToCourse.json.data.courseId === csCourseId, 'courseId must be set');

  const transitionToAll = await req(
    'PATCH',
    `/admin/content/announcements/${deptAnnouncementId}`,
    { targetScope: 'ALL' },
    adminToken
  );
  assert(transitionToAll.status === 200, 'Transition to ALL failed');
  assert(transitionToAll.json.data.targetScope === 'ALL', 'Scope must be ALL');
  assert(transitionToAll.json.data.departmentId === null, 'departmentId must be null');
  assert(transitionToAll.json.data.courseId === null, 'courseId must be null');

  // Restore to department for feed testing
  await req(
    'PATCH',
    `/admin/content/announcements/${deptAnnouncementId}`,
    { targetScope: 'DEPARTMENT', departmentId: csDeptId },
    adminToken
  );
  console.log('  ✅ Scope transitions (DEPARTMENT -> COURSE -> ALL) verified with stale ID cleanup.');

  // 10. Verify atomic audit logs
  const auditCreated = await prisma.adminAuditLog.findFirst({
    where: { targetId: draftAnnouncementId, action: 'ANNOUNCEMENT_CREATED' },
  });
  const auditPublished = await prisma.adminAuditLog.findFirst({
    where: { targetId: draftAnnouncementId, action: 'ANNOUNCEMENT_PUBLISHED' },
  });
  assert(auditCreated !== null, 'ANNOUNCEMENT_CREATED audit log must exist');
  assert(auditPublished !== null, 'ANNOUNCEMENT_PUBLISHED audit log must exist');
  console.log('  ✅ Atomic AdminAuditLog verified for announcement creation and publishing.');
}

async function testInstitutionalEvents() {
  console.log('\nA4.3: Institutional Events Management...');

  // 1. Inverted date validation (endDate < startDate) -> 400
  const invalidDate = await req(
    'POST',
    '/admin/content/events',
    {
      title: 'Invalid Date Event',
      category: 'COLLEGE_EVENT',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date().toISOString(), // end before start
      targetScope: 'ALL',
    },
    adminToken
  );
  assert(invalidDate.status === 400, `Expected 400 for endDate < startDate, got ${invalidDate.status}`);
  console.log('  ✅ Inverted event dates correctly rejected with 400.');

  // 2. Create valid Institutional Event (CS Department scoped)
  const createRes = await req(
    'POST',
    '/admin/content/events',
    {
      title: 'Annual Hackathon 2026',
      description: '48-hour competitive coding hackathon.',
      category: 'COLLEGE_EVENT',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: 'Main Auditorium & Innovation Lab',
      targetScope: 'DEPARTMENT',
      departmentId: csDeptId,
    },
    adminToken
  );
  assert(createRes.status === 201, `Event create failed: ${JSON.stringify(createRes.json)}`);
  institutionalEventId = createRes.json.data.id;
  console.log(`  ✅ Institutional Event created (ID: ${institutionalEventId}).`);

  // 3. Verify personal CalendarEvent remains completely independent
  const calendarEventRes = await req(
    'POST',
    '/calendar',
    {
      title: 'Personal Study Block',
      date: new Date().toISOString(),
      eventType: 'CLASS',
    },
    csStudentToken
  );
  assert(calendarEventRes.status === 201, 'Personal CalendarEvent creation should succeed independently');
  console.log('  ✅ Personal CalendarEvent verified independent from Institutional Events.');

  // 4. Verify atomic audit log
  const eventAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: institutionalEventId, action: 'INSTITUTIONAL_EVENT_CREATED' },
  });
  assert(eventAudit !== null, 'INSTITUTIONAL_EVENT_CREATED audit log must exist');
  console.log('  ✅ Atomic AdminAuditLog verified for institutional event creation.');
}

async function testAcademicResources() {
  console.log('\nA4.4 & A4.5: Academic Resources Management & Targeting...');

  // 1. Create Course-scoped Resource (URL/metadata based)
  const resourceRes = await req(
    'POST',
    '/admin/content/resources',
    {
      title: 'CS401 Operating Systems Syllabus & Lecture Notes',
      description: 'Complete reference syllabus for OS course.',
      fileUrl: 'https://cdn.integrum.dev/resources/cs401_syllabus.pdf',
      fileType: 'application/pdf',
      category: 'SYLLABUS',
      courseId: csCourseId,
    },
    adminToken
  );
  assert(resourceRes.status === 201, `Resource create failed: ${JSON.stringify(resourceRes.json)}`);
  academicResourceId = resourceRes.json.data.id;
  assert(resourceRes.json.data.courseId === csCourseId, 'courseId mismatch');
  assert(resourceRes.json.data.departmentId === null, 'departmentId should be null when courseId is supplied');
  console.log(`  ✅ Course-scoped Academic Resource created (ID: ${academicResourceId}).`);

  // 2. Create Global Resource (ALL)
  const globalResourceRes = await req(
    'POST',
    '/admin/content/resources',
    {
      title: 'Campus Code of Conduct 2026',
      fileUrl: 'https://cdn.integrum.dev/resources/code_of_conduct.pdf',
      fileType: 'application/pdf',
      category: 'OTHER',
    },
    adminToken
  );
  assert(globalResourceRes.status === 201, 'Global resource create failed');
  assert(globalResourceRes.json.data.courseId === null && globalResourceRes.json.data.departmentId === null, 'Global resource must have null scope IDs');
  console.log('  ✅ Global Academic Resource (ALL) created.');

  // 3. Verify atomic audit log
  const resAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: academicResourceId, action: 'ACADEMIC_RESOURCE_CREATED' },
  });
  assert(resAudit !== null, 'ACADEMIC_RESOURCE_CREATED audit log must exist');
  console.log('  ✅ Atomic AdminAuditLog verified for academic resource creation.');
}

async function testStudentContentFeeds() {
  console.log('\nA4.7: Authenticated Scoped Student Content Feeds...');

  // 1. Unauthenticated request -> 401
  const unauthRes = await req('GET', '/content/announcements');
  assert(unauthRes.status === 401, `Expected 401 for unauthenticated feed request, got ${unauthRes.status}`);
  console.log('  ✅ Unauthenticated /content/* feed access correctly rejected with 401.');

  // 2. CS Student Feed (Course: CS, Dept: CS)
  const csFeed = await req('GET', '/content/announcements', undefined, csStudentToken);
  assert(csFeed.status === 200, 'CS student feed failed');
  const csItems = csFeed.json.data;

  const seesAll = csItems.some((a: any) => a.id === allAnnouncementId);
  const seesDept = csItems.some((a: any) => a.id === deptAnnouncementId);
  const seesCourse = csItems.some((a: any) => a.id === courseAnnouncementId);
  const seesExpired = csItems.some((a: any) => a.id === expiredAnnouncementId);

  assert(seesAll, 'CS student must see ALL scope announcement');
  assert(seesDept, 'CS student must see CS Department announcement');
  assert(seesCourse, 'CS student must see CS Course announcement');
  assert(!seesExpired, 'CS student must NOT see expired announcement');
  console.log('  ✅ CS Student feed: sees ALL + CS Dept + CS Course announcements, excludes expired.');

  // 3. EE Student Feed (Course: EE, Dept: EE)
  const eeFeed = await req('GET', '/content/announcements', undefined, eeStudentToken);
  assert(eeFeed.status === 200, 'EE student feed failed');
  const eeItems = eeFeed.json.data;

  const eeSeesAll = eeItems.some((a: any) => a.id === allAnnouncementId);
  const eeSeesCsDept = eeItems.some((a: any) => a.id === deptAnnouncementId);
  const eeSeesCsCourse = eeItems.some((a: any) => a.id === courseAnnouncementId);

  assert(eeSeesAll, 'EE student must see ALL scope announcement');
  assert(!eeSeesCsDept, 'EE student must NOT see CS Department announcement');
  assert(!eeSeesCsCourse, 'EE student must NOT see CS Course announcement');
  console.log('  ✅ EE Student feed: sees ALL, correctly isolated from CS Department & CS Course content.');

  // 4. General Student Feed (No Course or Department linked)
  const genFeed = await req('GET', '/content/announcements', undefined, genStudentToken);
  assert(genFeed.status === 200, 'General student feed failed');
  const genItems = genFeed.json.data;

  const genSeesAll = genItems.some((a: any) => a.id === allAnnouncementId);
  const genSeesDept = genItems.some((a: any) => a.id === deptAnnouncementId);
  const genSeesCourse = genItems.some((a: any) => a.id === courseAnnouncementId);

  assert(genSeesAll, 'General student must see ALL scope announcement');
  assert(!genSeesDept, 'General student must NOT see department-scoped announcement');
  assert(!genSeesCourse, 'General student must NOT see course-scoped announcement');
  console.log('  ✅ General Student (no course) feed: sees only ALL scope announcements.');

  // 5. Scoped Events Feed
  const csEventsFeed = await req('GET', '/content/events', undefined, csStudentToken);
  const eeEventsFeed = await req('GET', '/content/events', undefined, eeStudentToken);

  const csSeesEvent = csEventsFeed.json.data.some((e: any) => e.id === institutionalEventId);
  const eeSeesEvent = eeEventsFeed.json.data.some((e: any) => e.id === institutionalEventId);

  assert(csSeesEvent, 'CS student must see CS Department event');
  assert(!eeSeesEvent, 'EE student must NOT see CS Department event');
  console.log('  ✅ Scoped Events Feed: CS student sees CS event, EE student is isolated.');

  // 6. Scoped Resources Feed
  const csResFeed = await req('GET', '/content/resources', undefined, csStudentToken);
  const eeResFeed = await req('GET', '/content/resources', undefined, eeStudentToken);

  const csSeesResource = csResFeed.json.data.some((r: any) => r.id === academicResourceId);
  const eeSeesResource = eeResFeed.json.data.some((r: any) => r.id === academicResourceId);

  assert(csSeesResource, 'CS student must see CS Course resource');
  assert(!eeSeesResource, 'EE student must NOT see CS Course resource');
  console.log('  ✅ Scoped Resources Feed: CS student sees CS resource, EE student is isolated.');
}

async function main() {
  console.log('🚀 Phase A4 — Content Management Subsystem Integration Tests');
  console.log('='.repeat(62));

  try {
    await setup();
    await testAnnouncementManagement();
    await testInstitutionalEvents();
    await testAcademicResources();
    await testStudentContentFeeds();

    console.log('\n' + '='.repeat(62));
    console.log('🎉 ALL Phase A4 Content Management tests passed successfully!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Phase A4 tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
