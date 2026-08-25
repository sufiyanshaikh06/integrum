import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminSecretPass123!';

async function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ ${message}`);
}

async function run() {
  console.log('🚀 Final Administration E2E Integration Suite\n=======================================================\n');

  console.log('--- Setup ---');
  
  // Seed DB if necessary, but assume it's running for tests
  let adminToken = '';
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.accessToken;
  } catch(e) {}
  
  if (!adminToken) {
     console.error('Could not authenticate admin. Make sure server is running and seeded.');
     process.exit(1);
  }
  await assert(!!adminToken, 'Admin authenticated.');

  // Create test student
  const studentEmail = `a7-student-${Date.now()}@integrum.dev`;
  const studentPassword = 'Password123!';
  const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: studentPassword,
      firstName: 'A7',
      lastName: 'Student'
    })
  });
  const registerData = await registerRes.json();
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: studentPassword })
  });
  const loginData = await loginRes.json();
  const studentToken = loginData.data?.accessToken;
  await assert(registerRes.status === 201, 'Student registered.');
  const studentProfileRes = await fetch(`${BASE_URL}/api/v1/users/me`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentProfileData = await studentProfileRes.json();
  const studentUserId = studentProfileData.data.id;
  await assert(studentProfileRes.status === 200, 'Student profile fetched.');

  console.log('\n--- Cross-Module Flow ---');
  
  // 1. Create Department
  const deptRes = await fetch(`${BASE_URL}/api/v1/admin/academics/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `A7 Department ${Date.now()}`, code: `A7_DEPT_${Date.now()}` })
  });
  const deptData = await deptRes.json();
  await assert(deptRes.status === 201, `Department created: ${JSON.stringify(deptData)}`);
  const deptId = deptData.data.id;

  // 2. Create Course
  const courseRes = await fetch(`${BASE_URL}/api/v1/admin/academics/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      departmentId: deptId,
      name: `A7 Course ${Date.now()}`,
      code: `A7_COURSE_${Date.now()}`,
      durationYears: 4,
      totalSemesters: 8
    })
  });
  const courseData = await courseRes.json();
  await assert(courseRes.status === 201, 'Course created.');
  const courseId = courseData.data.id;

  // 3. Create MasterSubject + AcademicTerm
  const msRes = await fetch(`${BASE_URL}/api/v1/admin/academics/master-subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      courseId: courseId,
      name: `A7 Master Subject ${Date.now()}`,
      code: `A7_MS_${Date.now()}`,
      credits: 3,
      semesterNumber: 1
    })
  });
  await assert(msRes.status === 201, 'MasterSubject created.');
  const termRes = await fetch(`${BASE_URL}/api/v1/admin/academics/terms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: `A7 Term ${Date.now()}`,
      termType: 'ODD',
      academicYear: 2026,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      isActive: true
    })
  });
  const termData = await termRes.json();
  await assert(termRes.status === 201, `AcademicTerm created: ${JSON.stringify(termData)}`);

  // 4. Assign student to Course (Direct DB update for tests)
  const { prisma } = await import('../src/config/prisma.js');
  await prisma.studentProfile.update({
    where: { id: studentProfileData.data.studentProfile.id },
    data: { courseId: courseId }
  });
  await assert(true, 'Student assigned to Course via Prisma.');

  // 5. Create scoped Announcement
  const annRes = await fetch(`${BASE_URL}/api/v1/admin/content/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      type: 'ANNOUNCEMENT',
      title: 'A7 Course Ann',
      content: 'This is A7 course only',
      priority: 'MEDIUM',
      targetScope: 'COURSE',
      courseId: courseId,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString()
    })
  });
  const annData = await annRes.json();
  await assert(annRes.status === 201, 'Scoped Announcement created.');
  
  const pubRes = await fetch(`${BASE_URL}/api/v1/admin/content/announcements/${annData.data.id}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  await assert(pubRes.status === 200, 'Announcement published.');

  // 6. Verify matching student sees them
  const studentFeedRes = await fetch(`${BASE_URL}/api/v1/content/announcements`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentFeedData = await studentFeedRes.json();
  const seesAnn = studentFeedData.data.some((a: any) => a.id === annData.data.id);
  await assert(seesAnn, 'Student sees the Course-scoped Announcement.');

  // 7. Student submits Feedback
  const fbRes = await fetch(`${BASE_URL}/api/v1/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({
      category: 'GENERAL',
      subject: 'A7 Test Feedback',
      message: 'Does this work?'
    })
  });
  const fbData = await fbRes.json();
  await assert(fbRes.status === 201, `Student submitted Feedback: ${JSON.stringify(fbData)}`);

  // 8. Admin resolves Feedback
  const resFbRes = await fetch(`${BASE_URL}/api/v1/admin/platform/feedback/${fbData.data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'RESOLVED', adminNotes: 'Yes, it works.' })
  });
  await assert(resFbRes.status === 200, 'Admin resolved Feedback.');

  // 9. Toggle SystemSetting (AI_FEATURES_ENABLED)
  const sysGetRes = await fetch(`${BASE_URL}/api/v1/admin/platform/settings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const sysGetData = await sysGetRes.json();
  const originalAiSetting = sysGetData.data.find((s: any) => s.key === 'AI_FEATURES_ENABLED')?.value === 'true';

  const sysUpdateRes = await fetch(`${BASE_URL}/api/v1/admin/platform/settings/AI_FEATURES_ENABLED`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ value: false })
  });
  await assert(sysUpdateRes.status === 200, 'Admin toggled AI_FEATURES_ENABLED to false.');

  // 10. Verify enforcement
  const studentAiRes = await fetch(`${BASE_URL}/api/v1/ai/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
    body: JSON.stringify({ title: 'A', content: 'B', tags: [] })
  });
  await assert(studentAiRes.status === 403, 'System setting properly enforced on student.');

  // Restore
  await fetch(`${BASE_URL}/api/v1/admin/platform/settings/AI_FEATURES_ENABLED`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ value: true })
  });

  // 11. Inspect Dashboard
  const dashRes = await fetch(`${BASE_URL}/api/v1/admin/platform/dashboard`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  await assert(dashRes.status === 200, 'Admin Dashboard returned 200.');

  // 12. Inspect Reports
  const reportRes = await fetch(`${BASE_URL}/api/v1/admin/reports/usage?period=daily`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  await assert(reportRes.status === 200, 'Admin Usage Report returned 200.');

  // 13. Verify Audit trail
  const auditRes = await fetch(`${BASE_URL}/api/v1/admin/platform/audit-logs?limit=50`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const auditData = await auditRes.json();
  const logs = auditData.data?.items || [];
  const recentAction = logs.some((l: any) => l.targetType === 'Feedback');
  await assert(recentAction, 'Audit trail logged the cross-module actions.');

  console.log('\n--- Role Transition Preservation ---');
  // 14. Verify STUDENT -> ADMIN -> STUDENT
  // Create student, record profile ID
  const s2Email = `a7-s2-${Date.now()}@integrum.dev`;
  const s2Res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: s2Email, password: 'Password123!', firstName: 'S2', lastName: 'Test' })
  });
  
  const s2LoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: s2Email, password: 'Password123!' })
  });
  const s2LoginData = await s2LoginRes.json();
  const s2Token = s2LoginData.data?.accessToken;
  
  const s2ProfileRes = await fetch(`${BASE_URL}/api/v1/users/me`, {
    headers: { 'Authorization': `Bearer ${s2Token}` }
  });
  const s2ProfileData = await s2ProfileRes.json();
  const s2Id = s2ProfileData.data.id;
  const s2ProfId = s2ProfileData.data.studentProfile.id;

  // Make ADMIN
  const makeAdminRes = await fetch(`${BASE_URL}/api/v1/admin/users/${s2Id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'ADMIN' })
  });
  await assert(makeAdminRes.status === 200, 'Student promoted to ADMIN.');

  // Make STUDENT
  const makeStudentRes = await fetch(`${BASE_URL}/api/v1/admin/users/${s2Id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'STUDENT' })
  });
  await assert(makeStudentRes.status === 200, 'Admin demoted back to STUDENT.');

  // Verify original profile
  const s2FinalRes = await fetch(`${BASE_URL}/api/v1/users/me`, {
    headers: { 'Authorization': `Bearer ${s2Token}` }
  });
  const s2FinalData = await s2FinalRes.json();
  await assert(s2FinalData.data.studentProfile.id === s2ProfId, 'Original student profile preserved successfully across transitions.');

  console.log('\n=======================================================');
  console.log('🎉 ALL Final Administration Integration Tests passed!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
