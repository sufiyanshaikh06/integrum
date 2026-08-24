/**
 * Phase A3 — Admin Academic Management & Catalog Integration Tests
 *
 * Comprehensive test suite verifying:
 * - RBAC protection (403 for student on /admin/academics/*)
 * - Department CRUD & code/name uniqueness (409)
 * - Course CRUD & duration/semester boundary validations (400)
 * - MasterSubject CRUD, parent semester bounds validation (400), unique code per course (409)
 * - AcademicTerm CRUD with date boundary checks (startDate < endDate)
 * - Restrictive deletion guards:
 *     - Department deletion blocked if Courses exist (409)
 *     - Course deletion blocked if MasterSubjects exist (409)
 *     - Course deletion blocked if Students are linked (409)
 *     - MasterSubject deletion blocked if student Subjects reference it (409)
 *     - AcademicTerm deletion blocked if student Semesters reference it (409)
 * - Authenticated Student Catalog Feeds (/api/v1/catalog/*) with query filters
 * - Unauthenticated catalog request rejection (401)
 * - Atomic AdminAuditLog emissions for all academic mutations
 * - Existing student Academic Hub autonomy & optional catalog linkage
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.dev';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminMasterPass2026!';

const studentEmail = `student_a3_${ts}@integrum.dev`;
const studentPassword = 'StudentPass123!';

let adminToken = '';
let studentToken = '';
let studentProfileId = '';

let departmentId = '';
let secondaryDeptId = '';
let courseId = '';
let secondaryCourseId = '';
let masterSubjectId = '';
let academicTermId = '';

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
  // 1. Login Seeded Admin
  const aLogin = await req('POST', '/auth/login', {
    email: adminEmail,
    password: adminPassword,
  });
  assert(aLogin.status === 200, `Admin login failed: ${JSON.stringify(aLogin.json)}`);
  adminToken = aLogin.json.data.accessToken;
  console.log('  ✅ Admin authenticated.');

  // 2. Register & Login Student
  await req('POST', '/auth/register', {
    email: studentEmail,
    password: studentPassword,
    firstName: 'Academic',
    lastName: 'Tester',
  });
  const sLogin = await req('POST', '/auth/login', {
    email: studentEmail,
    password: studentPassword,
  });
  assert(sLogin.status === 200, `Student login failed: ${JSON.stringify(sLogin.json)}`);
  studentToken = sLogin.json.data.accessToken;

  const meRes = await req('GET', '/users/me', undefined, studentToken);
  studentProfileId = meRes.json.data.studentProfile.id;
  console.log(`  ✅ Student authenticated (Profile ID: ${studentProfileId}).`);
}

async function testDepartmentManagement() {
  console.log('\nA3.2: Department Management CRUD & Guards...');

  // 1. RBAC Check: Student cannot create department
  const studentCreateRes = await req(
    'POST',
    '/admin/academics/departments',
    { name: `Computer Science ${ts}`, code: `CS${ts.toString().slice(-4)}` },
    studentToken
  );
  assert(studentCreateRes.status === 403, `Expected 403 for student creating dept, got ${studentCreateRes.status}`);
  console.log('  ✅ Student creating department rejected with 403.');

  // 2. Admin creates Department
  const deptCode = `CSE_${ts.toString().slice(-4)}`;
  const createRes = await req(
    'POST',
    '/admin/academics/departments',
    {
      name: `Computer Science & Engineering ${ts}`,
      code: deptCode,
      description: 'Department of Computer Science',
      headOfDepartment: 'Dr. Alan Turing',
    },
    adminToken
  );
  assert(createRes.status === 201, `Dept create failed: ${JSON.stringify(createRes.json)}`);
  departmentId = createRes.json.data.id;
  assert(createRes.json.data.code === deptCode.toUpperCase(), 'Dept code must be normalized to uppercase');
  console.log(`  ✅ Department created successfully (ID: ${departmentId}, Code: ${deptCode}).`);

  // 3. Duplicate code conflict -> 409
  const dupCodeRes = await req(
    'POST',
    '/admin/academics/departments',
    {
      name: `Another CS Dept ${ts}`,
      code: deptCode,
    },
    adminToken
  );
  assert(dupCodeRes.status === 409, `Expected 409 for duplicate dept code, got ${dupCodeRes.status}`);
  console.log('  ✅ Duplicate department code correctly rejected with 409 Conflict.');

  // 4. Update Department
  const updateRes = await req(
    'PATCH',
    `/admin/academics/departments/${departmentId}`,
    { headOfDepartment: 'Dr. Grace Hopper' },
    adminToken
  );
  assert(updateRes.status === 200, `Dept update failed: ${JSON.stringify(updateRes.json)}`);
  assert(updateRes.json.data.headOfDepartment === 'Dr. Grace Hopper', 'headOfDepartment mismatch');
  console.log('  ✅ Department updated successfully.');

  // Create a secondary empty department for clean deletion test
  const secDeptRes = await req(
    'POST',
    '/admin/academics/departments',
    {
      name: `Temporary Department ${ts}`,
      code: `TEMP_${ts.toString().slice(-4)}`,
    },
    adminToken
  );
  secondaryDeptId = secDeptRes.json.data.id;

  // 5. Verify atomic audit log
  const deptAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: departmentId, action: 'DEPARTMENT_CREATED' },
  });
  assert(deptAudit !== null, 'AdminAuditLog must record DEPARTMENT_CREATED');
  console.log('  ✅ Atomic AdminAuditLog verified for department creation.');
}

async function testCourseManagement() {
  console.log('\nA3.2: Course Management CRUD & Guards...');

  // 1. Create Course under non-existent department -> 404
  const invalidDeptRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId: '00000000-0000-0000-0000-000000000000',
      name: 'B.Tech CSE',
      code: `BTECH_CSE_${ts.toString().slice(-4)}`,
    },
    adminToken
  );
  assert(invalidDeptRes.status === 404, `Expected 404 for invalid departmentId, got ${invalidDeptRes.status}`);
  console.log('  ✅ Invalid departmentId correctly rejected with 404.');

  // 2. Validation: durationYears < 1 -> 400
  const invalidDurationRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId,
      name: 'B.Tech CSE',
      code: `BTECH_CSE_${ts.toString().slice(-4)}`,
      durationYears: 0,
    },
    adminToken
  );
  assert(invalidDurationRes.status === 400, `Expected 400 for durationYears=0, got ${invalidDurationRes.status}`);
  console.log('  ✅ Invalid durationYears=0 correctly rejected with 400.');

  // 3. Create valid Course
  const courseCode = `BTECH_CSE_${ts.toString().slice(-4)}`;
  const createRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId,
      name: 'B.Tech in Computer Science and Engineering',
      code: courseCode,
      durationYears: 4,
      totalSemesters: 8,
    },
    adminToken
  );
  assert(createRes.status === 201, `Course creation failed: ${JSON.stringify(createRes.json)}`);
  courseId = createRes.json.data.id;
  assert(createRes.json.data.totalSemesters === 8, 'totalSemesters mismatch');
  console.log(`  ✅ Course created successfully (ID: ${courseId}, Code: ${courseCode}).`);

  // 4. Duplicate course code -> 409
  const dupCourseRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId,
      name: 'Duplicate Course',
      code: courseCode,
    },
    adminToken
  );
  assert(dupCourseRes.status === 409, `Expected 409 for duplicate course code, got ${dupCourseRes.status}`);
  console.log('  ✅ Duplicate course code correctly rejected with 409 Conflict.');

  // Create a secondary course under secondary department for independent tests
  const secCourseRes = await req(
    'POST',
    '/admin/academics/courses',
    {
      departmentId: secondaryDeptId,
      name: 'BCA Program',
      code: `BCA_${ts.toString().slice(-4)}`,
      durationYears: 3,
      totalSemesters: 6,
    },
    adminToken
  );
  secondaryCourseId = secCourseRes.json.data.id;

  // 5. Verify atomic audit log
  const courseAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: courseId, action: 'COURSE_CREATED' },
  });
  assert(courseAudit !== null, 'AdminAuditLog must record COURSE_CREATED');
  console.log('  ✅ Atomic AdminAuditLog verified for course creation.');
}

async function testMasterSubjectManagement() {
  console.log('\nA3.2: MasterSubject Catalog Management...');

  // 1. Invariant: semesterNumber > course.totalSemesters (8) -> 400
  const invalidSemRes = await req(
    'POST',
    '/admin/academics/master-subjects',
    {
      courseId,
      name: 'Advanced Systems',
      code: 'CS999',
      credits: 4,
      semesterNumber: 9, // Course has only 8 semesters
    },
    adminToken
  );
  assert(invalidSemRes.status === 400, `Expected 400 for semesterNumber=9 on 8-sem course, got ${invalidSemRes.status}`);
  console.log('  ✅ Out-of-bounds semesterNumber correctly rejected with 400.');

  // 2. Create valid MasterSubject
  const createRes = await req(
    'POST',
    '/admin/academics/master-subjects',
    {
      courseId,
      name: 'Operating Systems & Architecture',
      code: 'CS401',
      credits: 4,
      semesterNumber: 4,
      description: 'Core concepts of CPU scheduling, memory management and file systems',
    },
    adminToken
  );
  assert(createRes.status === 201, `MasterSubject create failed: ${JSON.stringify(createRes.json)}`);
  masterSubjectId = createRes.json.data.id;
  assert(createRes.json.data.credits === 4, 'credits mismatch');
  console.log(`  ✅ MasterSubject created successfully (ID: ${masterSubjectId}, Code: CS401).`);

  // 3. Duplicate subject code within the same Course -> 409 Conflict
  const dupSubjRes = await req(
    'POST',
    '/admin/academics/master-subjects',
    {
      courseId,
      name: 'Operating Systems Lab',
      code: 'CS401', // duplicate in same course
      credits: 2,
      semesterNumber: 4,
    },
    adminToken
  );
  assert(dupSubjRes.status === 409, `Expected 409 for duplicate subject code in course, got ${dupSubjRes.status}`);
  console.log('  ✅ Duplicate subject code in same course correctly rejected with 409 Conflict.');

  // 4. Same subject code in different Course -> Allowed
  const diffCourseRes = await req(
    'POST',
    '/admin/academics/master-subjects',
    {
      courseId: secondaryCourseId,
      name: 'Intro to OS',
      code: 'CS401', // same code in different course
      credits: 3,
      semesterNumber: 3,
    },
    adminToken
  );
  assert(diffCourseRes.status === 201, `Expected 201 for same code in different course, got ${diffCourseRes.status}`);
  console.log('  ✅ Same subject code across distinct courses correctly allowed.');

  // 5. Verify atomic audit log
  const msAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: masterSubjectId, action: 'MASTER_SUBJECT_CREATED' },
  });
  assert(msAudit !== null, 'AdminAuditLog must record MASTER_SUBJECT_CREATED');
  console.log('  ✅ Atomic AdminAuditLog verified for master subject creation.');
}

async function testAcademicTermManagement() {
  console.log('\nA3.2: AcademicTerm Management...');

  // 1. Invariant: startDate >= endDate -> 400
  const invalidDateRes = await req(
    'POST',
    '/admin/academics/terms',
    {
      name: 'Invalid Term Dates',
      academicYear: 2026,
      termType: 'ODD',
      startDate: new Date(Date.now() + 100 * 86400000).toISOString(),
      endDate: new Date().toISOString(), // End date before start date
    },
    adminToken
  );
  assert(invalidDateRes.status === 400, `Expected 400 for startDate >= endDate, got ${invalidDateRes.status}`);
  console.log('  ✅ Inverted term dates correctly rejected with 400.');

  // 2. Create valid AcademicTerm
  const start = new Date();
  const end = new Date(Date.now() + 120 * 86400000);
  const createRes = await req(
    'POST',
    '/admin/academics/terms',
    {
      name: `Fall ${ts.toString().slice(-4)}`,
      academicYear: 2026,
      termType: 'ODD',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isActive: true,
    },
    adminToken
  );
  assert(createRes.status === 201, `AcademicTerm create failed: ${JSON.stringify(createRes.json)}`);
  academicTermId = createRes.json.data.id;
  assert(createRes.json.data.termType === 'ODD', 'termType mismatch');
  console.log(`  ✅ AcademicTerm created successfully (ID: ${academicTermId}).`);

  // 3. Verify atomic audit log
  const termAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: academicTermId, action: 'ACADEMIC_TERM_CREATED' },
  });
  assert(termAudit !== null, 'AdminAuditLog must record ACADEMIC_TERM_CREATED');
  console.log('  ✅ Atomic AdminAuditLog verified for academic term creation.');
}

async function testRestrictiveDeletionGuards() {
  console.log('\nA3.2: Restrictive Deletion Guards...');

  // 1. Department deletion blocked if Courses exist -> 409
  const deleteDeptWithCoursesRes = await req(
    'DELETE',
    `/admin/academics/departments/${departmentId}`,
    undefined,
    adminToken
  );
  assert(
    deleteDeptWithCoursesRes.status === 409,
    `Expected 409 deleting department with courses, got ${deleteDeptWithCoursesRes.status}`
  );
  console.log('  ✅ Department deletion with active courses correctly blocked with 409 Conflict.');

  // 2. Course deletion blocked if MasterSubjects exist -> 409
  const deleteCourseWithSubjectsRes = await req(
    'DELETE',
    `/admin/academics/courses/${courseId}`,
    undefined,
    adminToken
  );
  assert(
    deleteCourseWithSubjectsRes.status === 409,
    `Expected 409 deleting course with master subjects, got ${deleteCourseWithSubjectsRes.status}`
  );
  console.log('  ✅ Course deletion with master subjects correctly blocked with 409 Conflict.');

  // 3. Course deletion blocked if Students reference it -> 409
  // Link student to secondaryCourseId (which we will clear master subjects from)
  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { courseId: secondaryCourseId },
  });
  // Delete the master subject in secondaryCourseId first
  const secMs = await prisma.masterSubject.findFirst({ where: { courseId: secondaryCourseId } });
  if (secMs) {
    await prisma.masterSubject.delete({ where: { id: secMs.id } });
  }

  const deleteCourseWithStudentsRes = await req(
    'DELETE',
    `/admin/academics/courses/${secondaryCourseId}`,
    undefined,
    adminToken
  );
  assert(
    deleteCourseWithStudentsRes.status === 409,
    `Expected 409 deleting course with linked students, got ${deleteCourseWithStudentsRes.status}`
  );
  console.log('  ✅ Course deletion with enrolled students correctly blocked with 409 Conflict.');

  // Unlink student from secondaryCourseId and delete secondary course & secondary dept cleanly
  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { courseId: null },
  });
  const deleteSecCourse = await req('DELETE', `/admin/academics/courses/${secondaryCourseId}`, undefined, adminToken);
  assert(deleteSecCourse.status === 200, 'Delete unreferenced secondary course should succeed');
  const deleteSecDept = await req('DELETE', `/admin/academics/departments/${secondaryDeptId}`, undefined, adminToken);
  assert(deleteSecDept.status === 200, 'Delete unreferenced secondary department should succeed');
  console.log('  ✅ Clean unreferenced course & department deletions succeeded with 200.');

  // 4. MasterSubject deletion blocked if student personal Subject references it -> 409
  // Create a student semester & personal subject referencing masterSubjectId
  const semRes = await req(
    'POST',
    '/semesters',
    {
      name: 'Linked Semester',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 120 * 86400000).toISOString(),
    },
    studentToken
  );
  const semId = semRes.json.data.id;

  const subjRes = await req(
    'POST',
    '/subjects',
    {
      semesterId: semId,
      name: 'Operating Systems (Personal)',
      code: 'CS401',
    },
    studentToken
  );
  const personalSubjId = subjRes.json.data.id;

  // Link personal subject to masterSubjectId in DB
  await prisma.subject.update({
    where: { id: personalSubjId },
    data: { masterSubjectId },
  });

  const deleteMasterSubjWithStudentsRes = await req(
    'DELETE',
    `/admin/academics/master-subjects/${masterSubjectId}`,
    undefined,
    adminToken
  );
  assert(
    deleteMasterSubjWithStudentsRes.status === 409,
    `Expected 409 deleting master subject with personal student subjects, got ${deleteMasterSubjWithStudentsRes.status}`
  );
  console.log('  ✅ MasterSubject deletion with linked student subjects correctly blocked with 409 Conflict.');

  // 5. AcademicTerm deletion blocked if personal student Semester references it -> 409
  // Link student semester to academicTermId in DB
  await prisma.semester.update({
    where: { id: semId },
    data: { academicTermId },
  });

  const deleteTermWithSemestersRes = await req(
    'DELETE',
    `/admin/academics/terms/${academicTermId}`,
    undefined,
    adminToken
  );
  assert(
    deleteTermWithSemestersRes.status === 409,
    `Expected 409 deleting academic term with linked student semesters, got ${deleteTermWithSemestersRes.status}`
  );
  console.log('  ✅ AcademicTerm deletion with linked student semesters correctly blocked with 409 Conflict.');
}

async function testStudentCatalogFeeds() {
  console.log('\nA3.5: Authenticated Student Catalog Feeds (/api/v1/catalog/*)...');

  // 1. Unauthenticated request -> 401
  const unauthRes = await req('GET', '/catalog/departments');
  assert(unauthRes.status === 401, `Expected 401 for unauthenticated catalog request, got ${unauthRes.status}`);
  console.log('  ✅ Unauthenticated catalog request correctly rejected with 401.');

  // 2. Student reads departments -> 200
  const deptsRes = await req('GET', '/catalog/departments', undefined, studentToken);
  assert(deptsRes.status === 200, `Student get departments failed: ${JSON.stringify(deptsRes.json)}`);
  assert(Array.isArray(deptsRes.json.data), 'departments data must be an array');
  const foundDept = deptsRes.json.data.some((d: any) => d.id === departmentId);
  assert(foundDept, 'Created department must be in catalog feed');
  console.log(`  ✅ Student read departments returned 200 (${deptsRes.json.data.length} depts).`);

  // 3. Student reads courses filtered by departmentId -> 200
  const coursesRes = await req('GET', `/catalog/courses?departmentId=${departmentId}`, undefined, studentToken);
  assert(coursesRes.status === 200, 'Student get courses failed');
  const foundCourse = coursesRes.json.data.some((c: any) => c.id === courseId);
  assert(foundCourse, 'Created course must be in courses feed');
  console.log('  ✅ Student read courses filtered by departmentId verified.');

  // 4. Student reads master subjects filtered by courseId -> 200
  const subjectsRes = await req(`GET`, `/catalog/subjects?courseId=${courseId}`, undefined, studentToken);
  assert(subjectsRes.status === 200, 'Student get subjects failed');
  const foundSubj = subjectsRes.json.data.some((s: any) => s.id === masterSubjectId);
  assert(foundSubj, 'Created master subject must be in subjects feed');
  console.log('  ✅ Student read master subjects filtered by courseId verified.');

  // 5. Student reads active academic terms -> 200
  const termsRes = await req('GET', '/catalog/terms?isActive=true', undefined, studentToken);
  assert(termsRes.status === 200, 'Student get terms failed');
  const foundTerm = termsRes.json.data.some((t: any) => t.id === academicTermId);
  assert(foundTerm, 'Created active term must be in terms feed');
  console.log('  ✅ Student read active academic terms verified.');
}

async function testStudentAcademicHubAutonomyRegression() {
  console.log('\nA3.6: Existing Student Academic Hub Autonomy & Linkage Regression...');

  // 1. Student creates Semester WITHOUT academicTermId (master catalog is 100% optional)
  const unlinkedSemRes = await req(
    'POST',
    '/semesters',
    {
      name: 'Custom Autonomous Semester',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 120 * 86400000).toISOString(),
    },
    studentToken
  );
  assert(unlinkedSemRes.status === 201, `Autonomous semester create failed: ${JSON.stringify(unlinkedSemRes.json)}`);
  const customSemId = unlinkedSemRes.json.data.id;

  // 2. Student creates Subject WITHOUT masterSubjectId
  const unlinkedSubjRes = await req(
    'POST',
    '/subjects',
    {
      semesterId: customSemId,
      name: 'Custom Robotics Elective',
      code: 'ROB-900',
      credits: 3,
    },
    studentToken
  );
  assert(unlinkedSubjRes.status === 201, `Autonomous subject create failed: ${JSON.stringify(unlinkedSubjRes.json)}`);
  const customSubjId = unlinkedSubjRes.json.data.id;

  // 3. Student creates Assignment on custom subject
  const assignRes = await req(
    'POST',
    '/assignments',
    {
      subjectId: customSubjId,
      title: 'Robotics Kinematics Homework',
      priority: 'HIGH',
    },
    studentToken
  );
  assert(assignRes.status === 201, `Assignment creation failed: ${JSON.stringify(assignRes.json)}`);

  // 4. Student creates Note on custom subject
  const noteRes = await req(
    'POST',
    '/notes',
    {
      subjectId: customSubjId,
      title: 'Robotics Matrix Kinematics Notes',
      content: 'Forward kinematics uses DH parameters for joint transformations.',
    },
    studentToken
  );
  assert(noteRes.status === 201, `Note creation failed: ${JSON.stringify(noteRes.json)}`);

  // 5. Student records Attendance on custom subject
  const attRes = await req(
    'POST',
    '/attendance',
    {
      subjectId: customSubjId,
      date: new Date().toISOString(),
      status: 'PRESENT',
    },
    studentToken
  );
  assert(attRes.status === 201, `Attendance recording failed: ${JSON.stringify(attRes.json)}`);

  console.log('  ✅ Student autonomous Academic Hub operations (Semesters, Subjects, Assignments, Notes, Attendance) verified 100% functional.');
}

async function main() {
  console.log('🚀 Phase A3 — Academic Management Subsystem Integration Tests');
  console.log('='.repeat(62));

  try {
    await setup();
    await testDepartmentManagement();
    await testCourseManagement();
    await testMasterSubjectManagement();
    await testAcademicTermManagement();
    await testRestrictiveDeletionGuards();
    await testStudentCatalogFeeds();
    await testStudentAcademicHubAutonomyRegression();

    console.log('\n' + '='.repeat(62));
    console.log('🎉 ALL Phase A3 Academic Management tests passed successfully!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Phase A3 tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
