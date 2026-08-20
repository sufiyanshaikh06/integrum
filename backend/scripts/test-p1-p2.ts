/**
 * P1 + P2 Vertical Integration Tests
 * Tests: Profile Update, Forgot Password, Email Verification, Upcoming Tasks,
 *        Task Priority, Attendance Goal, Attendance Report
 */

import 'dotenv/config';

const BASE = 'http://localhost:5000/api/v1';
let accessToken = '';
let studentEmail = `test_gaps_${Date.now()}@integrum.dev`;
let studentPassword = 'TestPass123!';
let verificationToken = ''; // captured from server console
let resetToken = '';
let subjectId = '';
let semesterId = '';
let taskId = '';

// ─── Helpers ────────────────────────────────────────────────────
async function req(method: string, path: string, body?: any, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ─── Tests ───────────────────────────────────────────────────────

async function testRegisterAndLogin() {
  console.log('\nSetting up student...');
  const reg = await req('POST', '/auth/register', {
    email: studentEmail,
    password: studentPassword,
    firstName: 'TestP1',
    lastName: 'User',
  });
  assert(reg.status === 201, `Register failed: ${JSON.stringify(reg.json)}`);
  console.log('  ✅ Register: verification token emitted to console above ^');

  const login = await req('POST', '/auth/login', {
    email: studentEmail,
    password: studentPassword,
  });
  assert(login.status === 200, `Login failed: ${JSON.stringify(login.json)}`);
  accessToken = login.json.data.accessToken;
  assert(accessToken, 'No access token returned');
  console.log('  ✅ Login successful');
}

async function testI3UpdateProfile() {
  console.log('\nI-3: Update Profile (PATCH /users/me)...');
  const res = await req('PATCH', '/users/me', {
    university: 'MIT',
    enrollmentYear: 2022,
    graduationYear: 2026,
    careerGoals: 'Become a full-stack engineer at a leading tech company',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/testuser',
      github: 'https://github.com/testuser',
      portfolio: 'https://testuser.dev',
    },
  }, accessToken);

  assert(res.status === 200, `Profile update failed: ${JSON.stringify(res.json)}`);
  assert(res.json.data.university === 'MIT', 'university not updated');
  assert(res.json.data.careerGoals !== undefined, 'careerGoals not returned');
  assert(res.json.data.socialLinks !== null, 'socialLinks not returned');
  console.log('  ✅ Profile updated with careerGoals + socialLinks');

  // Verify via GET
  const get = await req('GET', '/users/me', undefined, accessToken);
  assert(get.status === 200, 'GET /users/me failed');
  assert(get.json.data.studentProfile.university === 'MIT', 'university not persisted');
  assert(get.json.data.studentProfile.careerGoals !== null, 'careerGoals not persisted');
  assert(get.json.data.studentProfile.socialLinks !== null, 'socialLinks not persisted');
  console.log('  ✅ Profile verified via GET');
}

async function testI1ForgotPassword() {
  console.log('\nI-1: Forgot Password...');
  const res = await req('POST', '/auth/forgot-password', { email: studentEmail });
  assert(res.status === 200, `Forgot password failed: ${JSON.stringify(res.json)}`);
  // Generic message regardless of email existence
  assert(
    res.json.message.includes('instructions have been sent') || res.json.message.includes('If an account'),
    'Expected generic response message'
  );
  console.log('  ✅ Forgot password: generic response (no account enumeration)');
  console.log('  ℹ️  Reset token emitted to server console — check server log');

  // Test with unknown email — should return same generic message (no enumeration)
  const unknownRes = await req('POST', '/auth/forgot-password', { email: 'nobody@noemail.com' });
  assert(unknownRes.status === 200, 'Unknown email should still return 200');
  console.log('  ✅ Unknown email: same 200 response (no enumeration)');
}

async function testI2ResendVerification() {
  console.log('\nI-2: Resend Verification Email...');
  const res = await req('POST', '/auth/resend-verification', undefined, accessToken);
  assert(res.status === 200, `Resend failed: ${JSON.stringify(res.json)}`);
  console.log('  ✅ Verification email resent (token in server console)');
}

async function testI6UpcomingTasks() {
  console.log('\nI-6 / A-1: Task Priority + Upcoming Tasks...');

  // First create a semester + subject for context
  const semRes = await req('POST', '/semesters', {
    name: 'Test Semester',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
  }, accessToken);
  assert(semRes.status === 201, `Semester create failed: ${JSON.stringify(semRes.json)}`);
  semesterId = semRes.json.data.id;

  // Create a task with priority HIGH due in the future
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const taskRes = await req('POST', '/tasks', {
    title: 'Upcoming Task with Priority',
    description: 'Test task',
    dueDate: futureDate,
    priority: 'HIGH',
    status: 'TODO',
  }, accessToken);
  assert(taskRes.status === 201, `Task create failed: ${JSON.stringify(taskRes.json)}`);
  taskId = taskRes.json.data.id;
  assert(taskRes.json.data.priority === 'HIGH', 'Priority not stored');
  console.log('  ✅ Task created with priority HIGH');

  // Create a DONE task — should NOT appear in upcoming
  const doneTask = await req('POST', '/tasks', {
    title: 'Done Task',
    dueDate: futureDate,
    priority: 'LOW',
    status: 'DONE',
  }, accessToken);
  assert(doneTask.status === 201, 'Done task create failed');

  // Create a past-due task — should NOT appear in upcoming
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await req('POST', '/tasks', {
    title: 'Past Task',
    dueDate: pastDate,
    priority: 'MEDIUM',
    status: 'TODO',
  }, accessToken);

  // GET /tasks/upcoming
  const upcomingRes = await req('GET', '/tasks/upcoming', undefined, accessToken);
  assert(upcomingRes.status === 200, `Upcoming tasks failed: ${JSON.stringify(upcomingRes.json)}`);
  const tasks: any[] = upcomingRes.json.data;
  assert(Array.isArray(tasks), 'Expected array');
  assert(tasks.every((t: any) => t.status !== 'DONE'), 'DONE tasks should not appear in upcoming');
  assert(tasks.every((t: any) => new Date(t.dueDate) > new Date()), 'Past-due tasks should not appear');
  assert(tasks.some((t: any) => t.id === taskId), 'Our HIGH priority task should appear');
  console.log(`  ✅ Upcoming tasks: ${tasks.length} returned (DONE + past-due correctly excluded)`);

  // Update task priority
  const updateRes = await req('PATCH', `/tasks/${taskId}`, { priority: 'LOW' }, accessToken);
  assert(updateRes.status === 200, 'Task update failed');
  assert(updateRes.json.data.priority === 'LOW', 'Priority not updated');
  console.log('  ✅ Task priority updated to LOW');
}

async function testA3AttendanceGoal() {
  console.log('\nA-3: Attendance Goal on Subject...');

  const subjectRes = await req('POST', '/subjects', {
    semesterId,
    name: 'Operating Systems',
    code: 'CS301',
    attendanceGoal: 75.0,
  }, accessToken);
  assert(subjectRes.status === 201, `Subject create failed: ${JSON.stringify(subjectRes.json)}`);
  subjectId = subjectRes.json.data.id;
  assert(subjectRes.json.data.attendanceGoal === 75.0, 'attendanceGoal not stored');
  console.log('  ✅ Subject created with attendanceGoal = 75%');

  // Update the goal
  const updateRes = await req('PATCH', `/subjects/${subjectId}`, { attendanceGoal: 85.0 }, accessToken);
  assert(updateRes.status === 200, `Subject update failed: ${JSON.stringify(updateRes.json)}`);
  assert(updateRes.json.data.attendanceGoal === 85.0, 'attendanceGoal not updated');
  console.log('  ✅ Attendance goal updated to 85%');
}

async function testA4AttendanceReport() {
  console.log('\nA-4: Attendance Report (GET /attendance/report)...');

  // Add some attendance records to give meaningful data
  const today = new Date().toISOString();
  await req('POST', '/attendance', {
    subjectId,
    date: today,
    status: 'PRESENT',
  }, accessToken);
  await req('POST', '/attendance', {
    subjectId,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'ABSENT',
  }, accessToken);

  const reportRes = await req('GET', '/attendance/report', undefined, accessToken);
  assert(reportRes.status === 200, `Attendance report failed: ${JSON.stringify(reportRes.json)}`);
  const report: any[] = reportRes.json.data;
  assert(Array.isArray(report), 'Expected array');

  const osSubject = report.find((r: any) => r.subjectId === subjectId);
  assert(osSubject !== undefined, 'Subject not in report');
  assert(osSubject.totalClasses === 2, `Expected 2 total classes, got ${osSubject.totalClasses}`);
  assert(osSubject.attendedClasses === 1, `Expected 1 attended class, got ${osSubject.attendedClasses}`);
  assert(osSubject.attendancePercentage === 50.0, `Expected 50%, got ${osSubject.attendancePercentage}`);
  assert(osSubject.attendanceGoal === 85.0, 'Goal not in report');
  assert(osSubject.goalDelta === -35.0, `Expected delta -35, got ${osSubject.goalDelta}`);
  console.log('  ✅ Attendance report: subject, %,  goal, and delta all correct');
}

async function testOwnershipIsolation() {
  console.log('\nSecurity: Cross-user isolation check...');

  // Register a second student
  const email2 = `test_isolated_${Date.now()}@integrum.dev`;
  await req('POST', '/auth/register', {
    email: email2,
    password: studentPassword,
    firstName: 'Other',
    lastName: 'Student',
  });
  const login2 = await req('POST', '/auth/login', { email: email2, password: studentPassword });
  const token2 = login2.json.data.accessToken;

  // Student 2 tries to update Student 1's task
  const badUpdate = await req('PATCH', `/tasks/${taskId}`, { title: 'Hacked' }, token2);
  assert(badUpdate.status === 404, `Cross-user task update should return 404, got ${badUpdate.status}`);
  console.log('  ✅ Cross-user task modification: correctly blocked with 404');

  // Student 2 tries to get Student 1's task
  const badGet = await req('GET', `/tasks/${taskId}`, undefined, token2);
  assert(badGet.status === 404, `Cross-user task read should return 404, got ${badGet.status}`);
  console.log('  ✅ Cross-user task read: correctly blocked with 404');
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 P1 + P2 Integration Tests — Core Gap Closure');
  console.log('='.repeat(55));

  try {
    await testRegisterAndLogin();
    await testI3UpdateProfile();
    await testI1ForgotPassword();
    await testI2ResendVerification();
    await testI6UpcomingTasks();
    await testA3AttendanceGoal();
    await testA4AttendanceReport();
    await testOwnershipIsolation();

    console.log('\n' + '='.repeat(55));
    console.log('🎉 All P1 + P2 tests passed!');
  } catch (err: any) {
    console.error('\n❌ Tests failed:', err.message);
    process.exit(1);
  }
}

main();
