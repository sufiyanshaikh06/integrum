/**
 * Phase A1 — Admin Foundation Integration Tests
 *
 * Verifies:
 * 1. Seeded Admin login & token generation
 * 2. Unauthenticated request to /admin/ping -> 401 Unauthorized
 * 3. Student request to /admin/ping -> 403 Forbidden
 * 4. Admin request to /admin/ping -> 200 OK with adminProfile metadata
 * 5. Database connectivity & queryability for all 10 new models & baseline SystemSettings
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();
const studentEmail = `student_a1_${ts}@integrum.dev`;
const studentPassword = 'TestPass123!';

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.dev';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminMasterPass2026!';

let studentToken = '';
let adminToken = '';

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

async function main() {
  console.log('🚀 Phase A1 — Admin Foundation Integration Tests');
  console.log('='.repeat(55));

  try {
    // 1. Setup Student
    console.log('\n1. Registering & Authenticating regular student...');
    await req('POST', '/auth/register', {
      email: studentEmail,
      password: studentPassword,
      firstName: 'Student',
      lastName: 'Foundation',
    });
    const sLogin = await req('POST', '/auth/login', {
      email: studentEmail,
      password: studentPassword,
    });
    assert(sLogin.status === 200, `Student login failed: ${JSON.stringify(sLogin.json)}`);
    studentToken = sLogin.json.data.accessToken;
    console.log('  ✅ Student registered and logged in.');

    // 2. Setup Seeded Admin Login
    console.log('\n2. Authenticating seeded Administrator...');
    const aLogin = await req('POST', '/auth/login', {
      email: adminEmail,
      password: adminPassword,
    });
    assert(aLogin.status === 200, `Admin login failed: ${JSON.stringify(aLogin.json)}`);
    adminToken = aLogin.json.data.accessToken;
    assert(aLogin.json.data.user.role === 'ADMIN', `Expected role ADMIN, got ${aLogin.json.data.user.role}`);
    console.log('  ✅ Admin authenticated successfully (Role: ADMIN).');

    // 3. Security: Unauthenticated access to /admin/ping -> 401
    console.log('\n3. Security: Unauthenticated GET /api/v1/admin/ping...');
    const unauthRes = await req('GET', '/admin/ping');
    assert(unauthRes.status === 401, `Expected 401 Unauthorized, got ${unauthRes.status}`);
    console.log('  ✅ Unauthenticated access correctly rejected with 401.');

    // 4. Security: Student access to /admin/ping -> 403 Forbidden
    console.log('\n4. Security: Student role accessing /api/v1/admin/ping...');
    const studentAdminRes = await req('GET', '/admin/ping', undefined, studentToken);
    assert(studentAdminRes.status === 403, `Expected 403 Forbidden for STUDENT, got ${studentAdminRes.status}`);
    console.log('  ✅ Student access correctly rejected with 403 Forbidden.');

    // 5. Admin access to /admin/ping -> 200 OK
    console.log('\n5. Access: Admin accessing /api/v1/admin/ping...');
    const adminPingRes = await req('GET', '/admin/ping', undefined, adminToken);
    assert(adminPingRes.status === 200, `Expected 200 OK for ADMIN, got ${adminPingRes.status}`);
    assert(adminPingRes.json.data.adminEmail === adminEmail, 'Admin email in response mismatch');
    assert(typeof adminPingRes.json.data.adminProfileId === 'string', 'adminProfileId must be present');
    assert(adminPingRes.json.data.permissionsLevel === 5, 'permissionsLevel must be 5');
    console.log(`  ✅ Admin ping returned 200 OK with adminProfile context (Profile ID: ${adminPingRes.json.data.adminProfileId}).`);

    // 6. Database Verification: 10 New Models & SystemSettings Queryability
    console.log('\n6. Database: Verifying new schema models...');
    const [
      departmentsCount,
      coursesCount,
      masterSubjectsCount,
      academicTermsCount,
      announcementsCount,
      eventsCount,
      resourcesCount,
      feedbacksCount,
      auditLogsCount,
      settingsCount,
    ] = await Promise.all([
      prisma.department.count(),
      prisma.course.count(),
      prisma.masterSubject.count(),
      prisma.academicTerm.count(),
      prisma.announcement.count(),
      prisma.institutionalEvent.count(),
      prisma.academicResource.count(),
      prisma.feedback.count(),
      prisma.adminAuditLog.count(),
      prisma.systemSetting.count(),
    ]);

    assert(settingsCount >= 3, `Expected at least 3 seeded SystemSettings, got ${settingsCount}`);
    console.log(`  ✅ All 10 models verified accessible. Seeded settings count: ${settingsCount}`);

    console.log('\n' + '='.repeat(55));
    console.log('🎉 Phase A1 Foundation tests passed successfully!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
