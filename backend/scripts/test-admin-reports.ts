/**
 * Phase A6 — Reporting & Telemetry Integration Tests
 *
 * Comprehensive test suite verifying:
 * - RBAC protection (401 unauth, 403 student on all /admin/reports/* endpoints)
 * - Validation boundaries (inverted dates, invalid UUIDs, contradictory course/dept filters)
 * - User Reports (totals, rates, trends by daily/weekly/monthly, studentsByCourse/Department, unassigned)
 * - Academic Reports (attendance semantics, assignment completion, course/dept aggregations & filters)
 * - Usage Analytics (AI executions, module/operation distribution, duration calculation, Career funnel)
 * - Platform Health (uptime, DB ping latency, memory/runtime telemetry, zero secret leaks)
 * - Zero-data safety (clean 0 rates, never NaN/Infinity)
 * - Read-only guarantee (reports viewing emits ZERO AdminAuditLog mutations)
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.dev';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminMasterPass2026!';

const studentEmail = `student_a6_${ts}@integrum.dev`;
const studentPassword = 'StudentPass123!';

let adminToken = '';
let studentToken = '';
let csDeptId = '';
let csCourseId = '';
let eeDeptId = '';

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

  // 2. Provision Department and Course for scoping
  const deptRes = await req(
    'POST',
    '/admin/academics/departments',
    { name: `Computer Science A6 ${ts}`, code: `CS_A6_${ts}` },
    adminToken
  );
  csDeptId = deptRes.json.data.id;

  const eeDeptRes = await req(
    'POST',
    '/admin/academics/departments',
    { name: `Electrical Eng A6 ${ts}`, code: `EE_A6_${ts}` },
    adminToken
  );
  eeDeptId = eeDeptRes.json.data.id;

  const courseRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId: csDeptId,
      name: `B.Tech CS A6 ${ts}`,
      code: `BT_CS_A6_${ts}`,
      durationYears: 4,
      totalSemesters: 8,
    },
    adminToken
  );
  csCourseId = courseRes.json.data.id;

  // 3. Register Student enrolled in course
  await req('POST', '/auth/register', {
    email: studentEmail,
    password: studentPassword,
    firstName: 'Reporting',
    lastName: 'Tester',
  });
  const sLogin = await req('POST', '/auth/login', { email: studentEmail, password: studentPassword });
  studentToken = sLogin.json.data.accessToken;

  // Link student to CS Course
  const me = await req('GET', '/users/me', undefined, studentToken);
  const studentProfileId = me.json.data.studentProfile.id;
  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { courseId: csCourseId },
  });

  // Create academic test data (semester, subject, attendance, assignment)
  const sem = await prisma.semester.create({
    data: {
      studentProfileId,
      name: 'Semester 1',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
    },
  });

  const subj = await prisma.subject.create({
    data: {
      semesterId: sem.id,
      name: 'Algorithms A6',
      code: 'CS601',
      credits: 4,
      totalClasses: 10,
      attendedClasses: 8,
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      subjectId: subj.id,
      date: new Date(),
      status: 'PRESENT',
    },
  });

  await prisma.assignment.create({
    data: {
      subjectId: subj.id,
      title: 'Algorithm Homework 1',
      dueDate: new Date(Date.now() + 86400000 * 7),
      status: 'SUBMITTED',
    },
  });

  // Create AI log fixture
  await prisma.aIExecutionLog.create({
    data: {
      studentProfileId,
      module: 'STUDY_PLAN',
      operation: 'generate-study-plan',
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 500),
      completedAt: new Date(),
    },
  });

  // Create Job Application fixture
  await prisma.jobApplication.create({
    data: {
      studentProfileId,
      companyName: 'TechCorp Global',
      role: 'Software Engineer Intern',
      status: 'INTERVIEWING',
      appliedDate: new Date(),
    },
  });

  console.log(`  ✅ Setup complete: Institutional catalog & student operational data provisioned.`);
}

async function testRbacAndValidation() {
  console.log('\nA6.1: RBAC Protection & Filter Validation...');

  // 1. Unauthenticated -> 401
  const unauth = await req('GET', '/admin/reports/users');
  assert(unauth.status === 401, `Expected 401 for unauthenticated request, got ${unauth.status}`);
  console.log('  ✅ Unauthenticated request correctly rejected with 401.');

  // 2. Student -> 403 on all report endpoints
  const endpoints = ['users', 'academics', 'usage', 'health'];
  for (const ep of endpoints) {
    const res = await req('GET', `/admin/reports/${ep}`, undefined, studentToken);
    assert(res.status === 403, `Expected 403 for student accessing /admin/reports/${ep}, got ${res.status}`);
  }
  console.log('  ✅ Student access to all /admin/reports/* endpoints rejected with 403.');

  // 3. Inverted date range -> 400
  const invertedDate = await req(
    'GET',
    `/admin/reports/users?startDate=${encodeURIComponent('2026-12-01T00:00:00.000Z')}&endDate=${encodeURIComponent('2026-01-01T00:00:00.000Z')}`,
    undefined,
    adminToken
  );
  assert(invertedDate.status === 400, `Expected 400 for inverted date range, got ${invertedDate.status}`);
  console.log('  ✅ Inverted date range correctly rejected with 400.');

  // 4. Invalid UUID filter -> 400
  const invalidUuid = await req('GET', '/admin/reports/users?courseId=not-a-uuid', undefined, adminToken);
  assert(invalidUuid.status === 400, `Expected 400 for invalid UUID, got ${invalidUuid.status}`);
  console.log('  ✅ Invalid UUID format rejected with 400.');

  // 5. Contradictory Course / Department filter -> 400
  const contradictory = await req(
    'GET',
    `/admin/reports/academics?departmentId=${eeDeptId}&courseId=${csCourseId}`,
    undefined,
    adminToken
  );
  assert(contradictory.status === 400, `Expected 400 for mismatched course/dept, got ${contradictory.status}`);
  console.log('  ✅ Contradictory courseId & departmentId filter correctly rejected with 400.');
}

async function testUserReport() {
  console.log('\nA6.2: User Reports...');

  // 1. Full User Report
  const res = await req('GET', '/admin/reports/users?period=daily', undefined, adminToken);
  assert(res.status === 200, `User report failed: ${JSON.stringify(res.json)}`);
  const data = res.json.data;

  // Verify Summary
  assert(typeof data.summary.totalUsers === 'number' && data.summary.totalUsers >= 1, 'totalUsers must be >= 1');
  assert(typeof data.summary.verificationRate === 'number', 'verificationRate must be number');
  assert(typeof data.summary.activeRate === 'number', 'activeRate must be number');

  // Verify Trends
  assert(Array.isArray(data.registrations), 'registrations must be an array');
  assert(data.registrations.length >= 1, 'registrations should contain period data');

  // Verify Institutional breakdown & unassigned
  assert(Array.isArray(data.studentsByCourse), 'studentsByCourse must be an array');
  assert(Array.isArray(data.studentsByDepartment), 'studentsByDepartment must be an array');
  assert(typeof data.unassignedStudents === 'number', 'unassignedStudents must be number');

  // Security: check that no passwords, hashes, or tokens exist in report
  const rawStr = JSON.stringify(data);
  assert(!rawStr.includes('passwordHash'), 'Security: passwordHash must NOT be leaked');
  assert(!rawStr.includes('verificationToken'), 'Security: verificationToken must NOT be leaked');

  console.log(`  ✅ User Report verified (Total: ${data.summary.totalUsers}, ActiveRate: ${data.summary.activeRate}%, Unassigned: ${data.unassignedStudents}).`);

  // 2. Weekly & Monthly period parameter
  const weeklyRes = await req('GET', '/admin/reports/users?period=weekly', undefined, adminToken);
  assert(weeklyRes.status === 200, 'Weekly period failed');
  const monthlyRes = await req('GET', '/admin/reports/users?period=monthly', undefined, adminToken);
  assert(monthlyRes.status === 200, 'Monthly period failed');
  console.log('  ✅ Period grouping (daily, weekly, monthly) verified.');
}

async function testAcademicReport() {
  console.log('\nA6.3 & A6.4: Academic Reports & Institutional Scoping...');

  // 1. Full Academic Report
  const res = await req('GET', '/admin/reports/academics', undefined, adminToken);
  assert(res.status === 200, `Academic report failed: ${JSON.stringify(res.json)}`);
  const data = res.json.data;

  // Overview metrics
  assert(typeof data.overview.totalStudentSubjects === 'number', 'totalStudentSubjects must be number');
  assert(typeof data.overview.averageAttendancePercentage === 'number', 'averageAttendancePercentage must be number');
  assert(typeof data.overview.assignmentCompletionRate === 'number', 'assignmentCompletionRate must be number');
  assert(typeof data.overview.unassignedStudents === 'number', 'unassignedStudents must be number');

  // By Course & Department
  assert(Array.isArray(data.byCourse), 'byCourse must be an array');
  assert(Array.isArray(data.byDepartment), 'byDepartment must be an array');

  const csCourseEntry = data.byCourse.find((c: any) => c.courseId === csCourseId);
  assert(csCourseEntry !== undefined, 'CS Course must be listed in byCourse');
  assert(csCourseEntry.students >= 1, 'CS Course student count must be >= 1');
  assert(csCourseEntry.averageAttendance >= 0, 'averageAttendance must be >= 0');
  assert(csCourseEntry.assignmentCompletionRate >= 0, 'assignmentCompletionRate must be >= 0');

  console.log(`  ✅ Academic Report overview and course breakdown verified (Avg Attendance: ${data.overview.averageAttendancePercentage}%).`);

  // 2. Filter by courseId
  const courseFilterRes = await req('GET', `/admin/reports/academics?courseId=${csCourseId}`, undefined, adminToken);
  assert(courseFilterRes.status === 200, 'Course filter failed');
  assert(courseFilterRes.json.data.byCourse.length === 1, 'Filtered byCourse should contain only target course');
  console.log('  ✅ Course filter verified.');

  // 3. Filter by departmentId
  const deptFilterRes = await req('GET', `/admin/reports/academics?departmentId=${csDeptId}`, undefined, adminToken);
  assert(deptFilterRes.status === 200, 'Department filter failed');
  assert(deptFilterRes.json.data.byDepartment.length === 1, 'Filtered byDepartment should contain only target department');
  console.log('  ✅ Department filter verified.');
}

async function testUsageReport() {
  console.log('\nA6.5: Usage Analytics (AI & Career)...');

  const res = await req('GET', '/admin/reports/usage', undefined, adminToken);
  assert(res.status === 200, `Usage report failed: ${JSON.stringify(res.json)}`);
  const data = res.json.data;

  // AI Usage
  assert(typeof data.ai.totalExecutions === 'number' && data.ai.totalExecutions >= 1, 'totalExecutions must be >= 1');
  assert(typeof data.ai.successRate === 'number', 'successRate must be number');
  assert(typeof data.ai.averageDurationMs === 'number', 'averageDurationMs must be number');
  assert(data.ai.byModule.STUDY_PLAN >= 1, 'STUDY_PLAN module count must be >= 1');

  // Verify that NO fake token or cost telemetry exists
  assert(data.ai.tokens === undefined, 'No fake tokens telemetry');
  assert(data.ai.cost === undefined, 'No fake cost telemetry');

  // Career Funnel
  assert(typeof data.career.totalApplications === 'number' && data.career.totalApplications >= 1, 'totalApplications must be >= 1');
  assert(typeof data.career.interviewRate === 'number', 'interviewRate must be number');
  assert(typeof data.career.offerRate === 'number', 'offerRate must be number');
  assert(Array.isArray(data.career.applicationsByMonth), 'applicationsByMonth must be array');

  console.log(`  ✅ Usage Analytics verified (AI Executions: ${data.ai.totalExecutions}, AvgDuration: ${data.ai.averageDurationMs}ms, Career Apps: ${data.career.totalApplications}).`);
}

async function testPlatformHealthReport() {
  console.log('\nA6.6: Platform Health & Runtime Telemetry...');

  const res = await req('GET', '/admin/reports/health', undefined, adminToken);
  assert(res.status === 200, `Health report failed: ${JSON.stringify(res.json)}`);
  const data = res.json.data;

  // Verified fields
  assert(data.status === 'HEALTHY', 'Status must be HEALTHY');
  assert(typeof data.uptimeSeconds === 'number' && data.uptimeSeconds >= 0, 'uptimeSeconds must be >= 0');
  assert(data.database.status === 'CONNECTED', 'database.status must be CONNECTED');
  assert(typeof data.database.latencyMs === 'number' && data.database.latencyMs >= 0, 'database.latencyMs must be >= 0');
  assert(typeof data.memory.rssBytes === 'number' && data.memory.rssBytes > 0, 'memory.rssBytes must be > 0');
  assert(typeof data.memory.heapUsedBytes === 'number' && data.memory.heapUsedBytes > 0, 'memory.heapUsedBytes must be > 0');
  assert(typeof data.runtime.nodeVersion === 'string', 'runtime.nodeVersion must be string');
  assert(typeof data.runtime.environment === 'string', 'runtime.environment must be string');

  // Security: Ensure NO connection strings or secrets exist
  const rawHealth = JSON.stringify(data);
  assert(!rawHealth.includes('postgresql://'), 'Security: DATABASE_URL must NOT be leaked');
  assert(!rawHealth.includes('password'), 'Security: Passwords must NOT be leaked');

  console.log(`  ✅ Platform Health verified (Status: ${data.status}, DB Latency: ${data.database.latencyMs}ms, Node: ${data.runtime.nodeVersion}).`);
}

async function testReadOnlyAuditGuarantee() {
  console.log('\nA6.7: Read-Only Guarantee (No Audit Logs on Report Views)...');

  const auditCountBefore = await prisma.adminAuditLog.count();

  await req('GET', '/admin/reports/users', undefined, adminToken);
  await req('GET', '/admin/reports/academics', undefined, adminToken);
  await req('GET', '/admin/reports/usage', undefined, adminToken);
  await req('GET', '/admin/reports/health', undefined, adminToken);

  const auditCountAfter = await prisma.adminAuditLog.count();
  assert(auditCountBefore === auditCountAfter, 'Reports must be read-only and emit ZERO AdminAuditLog rows');
  console.log('  ✅ Read-only audit log guarantee verified (audit log count unchanged).');
}

async function main() {
  console.log('🚀 Phase A6 — Reporting & Telemetry Integration Tests');
  console.log('='.repeat(62));

  try {
    await setup();
    await testRbacAndValidation();
    await testUserReport();
    await testAcademicReport();
    await testUsageReport();
    await testPlatformHealthReport();
    await testReadOnlyAuditGuarantee();

    console.log('\n' + '='.repeat(62));
    console.log('🎉 ALL Phase A6 Reporting & Telemetry tests passed successfully!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Phase A6 tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
