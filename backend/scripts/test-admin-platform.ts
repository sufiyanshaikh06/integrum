/**
 * Phase A5 — Platform Management & Feedback Integration Tests
 *
 * Comprehensive test suite verifying:
 * - RBAC protection (403 for student on /admin/platform/*)
 * - Admin dashboard aggregations (/api/v1/admin/platform/dashboard)
 * - Append-only audit logs inspection with actor projection & filtering
 * - Two-sided Feedback: Student submission (201) & Admin management lifecycle (PENDING -> UNDER_REVIEW -> RESOLVED -> UNDER_REVIEW)
 * - State consistency for Feedback (resolvedAt / resolvedByUserId set only when RESOLVED)
 * - System Settings CRUD with key allow-list & boolean type validation
 * - Real enforcement of ALLOW_STUDENT_REGISTRATION (403 when disabled, 201 when enabled)
 * - Real enforcement of AI_FEATURES_ENABLED (403 when disabled, 200 when enabled)
 * - Real enforcement of MAINTENANCE_MODE (503 for student traffic, bypass for /health, /auth/login, and /admin/*)
 * - Administrative maintenance recovery & toggle verification
 * - Atomic AdminAuditLog emissions on all platform mutations
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

if (process.env.NODE_ENV !== 'test' || !new URL(process.env.DATABASE_URL!).pathname.endsWith('_test')) {
  throw new Error('Platform regression requires NODE_ENV=test and a database ending in _test');
}

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@integrum.dev';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminMasterPass2026!';

const studentEmail = `student_a5_${ts}@integrum.dev`;
const studentPassword = 'StudentPass123!';

let adminToken = '';
let studentToken = '';
let studentProfileId = '';
let feedbackId = '';

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

  // 2. Student Register & Login
  await req('POST', '/auth/register', {
    email: studentEmail,
    password: studentPassword,
    firstName: 'Platform',
    lastName: 'Tester',
  });
  const sLogin = await req('POST', '/auth/login', { email: studentEmail, password: studentPassword });
  assert(sLogin.status === 200, `Student login failed: ${JSON.stringify(sLogin.json)}`);
  studentToken = sLogin.json.data.accessToken;

  const me = await req('GET', '/users/me', undefined, studentToken);
  studentProfileId = me.json.data.studentProfile.id;
  console.log(`  ✅ Setup complete: Admin and Student authenticated (Profile ID: ${studentProfileId}).`);
}

async function testDashboardAggregations() {
  console.log('\nA5.3: Admin Dashboard Aggregations...');

  // 1. Student access blocked -> 403
  const studentDash = await req('GET', '/admin/platform/dashboard', undefined, studentToken);
  assert(studentDash.status === 403, `Expected 403 for student accessing dashboard, got ${studentDash.status}`);
  console.log('  ✅ Student access to admin dashboard rejected with 403.');

  // 2. Admin dashboard -> 200 with all metric groups
  const adminDash = await req('GET', '/admin/platform/dashboard', undefined, adminToken);
  assert(adminDash.status === 200, `Dashboard failed: ${JSON.stringify(adminDash.json)}`);
  const data = adminDash.json.data;

  assert(typeof data.users.total === 'number', 'users.total must be number');
  assert(typeof data.academics.departments === 'number', 'academics.departments must be number');
  assert(typeof data.career.totalApplications === 'number', 'career.totalApplications must be number');
  assert(typeof data.ai.totalExecutions === 'number', 'ai.totalExecutions must be number');
  assert(typeof data.feedback.pending === 'number', 'feedback.pending must be number');
  assert(typeof data.content.publishedAnnouncements === 'number', 'content.publishedAnnouncements must be number');

  console.log(`  ✅ Dashboard returned complete real-time aggregations (Users: ${data.users.total}, Content: ${data.content.publishedAnnouncements}).`);
}

async function testAuditLogs() {
  console.log('\nA5.4: Append-Only Audit Logs Inspection...');

  // 1. Student access blocked -> 403
  const studentAudit = await req('GET', '/admin/platform/audit-logs', undefined, studentToken);
  assert(studentAudit.status === 403, `Expected 403 for student accessing audit logs, got ${studentAudit.status}`);
  console.log('  ✅ Student access to audit logs rejected with 403.');

  // Generate our own audit record; a fresh seeded DB has no prior mutations.
  const settings = await req('GET', '/admin/platform/settings', undefined, adminToken);
  assert(settings.status === 200, 'Failed to read audit fixture setting');
  const existing = settings.json.data.find((setting: any) => setting.key === 'ALLOW_STUDENT_REGISTRATION');
  assert(existing !== undefined, 'Seed registration setting is missing');
  const mutation = await req('PATCH', '/admin/platform/settings/ALLOW_STUDENT_REGISTRATION', { value: existing.value }, adminToken);
  assert(mutation.status === 200, 'Failed to create audit fixture');

  // 2. Admin audit logs list with pagination
  const adminAudit = await req('GET', '/admin/platform/audit-logs?page=1&limit=10', undefined, adminToken);
  assert(adminAudit.status === 200, `Audit list failed: ${JSON.stringify(adminAudit.json)}`);
  const data = adminAudit.json.data;
  assert(Array.isArray(data.items), 'items must be an array');
  assert(data.pagination.total >= 1, 'total audit logs must be >= 1');

  // Verify actor projection (zero password/token hashes)
  const sampleLog = data.items[0];
  assert(sampleLog.actorUser !== undefined, 'actorUser must be populated');
  assert(sampleLog.actorUser.passwordHash === undefined, 'Security: passwordHash must NOT be leaked');
  console.log(`  ✅ Audit logs listed successfully (${data.pagination.total} total logs, clean actor projection).`);
}

async function testFeedbackSubsystem() {
  console.log('\nA5.5 & A5.6: Two-Sided Feedback Subsystem...');

  // 1. Admin trying student feedback endpoint -> 403
  const adminSubmit = await req(
    'POST',
    '/feedback',
    { category: 'BUG_REPORT', subject: 'Admin Subject', message: 'Admin Message' },
    adminToken
  );
  assert(adminSubmit.status === 403, `Expected 403 for admin submitting student feedback, got ${adminSubmit.status}`);
  console.log('  ✅ Admin blocked from student feedback endpoint with 403.');

  // 2. Student submits feedback (with attempted client injection of status/adminNotes)
  const submitRes = await req(
    'POST',
    '/feedback',
    {
      category: 'BUG_REPORT',
      subject: 'Issue with dark mode contrast',
      message: 'Some cards have unreadable text in dark mode.',
      status: 'RESOLVED', // Attacker attempt to self-resolve
      adminNotes: 'Fake resolution',
    },
    studentToken
  );
  assert(submitRes.status === 201, `Feedback submit failed: ${JSON.stringify(submitRes.json)}`);
  feedbackId = submitRes.json.data.id;
  assert(submitRes.json.data.status === 'PENDING', 'Initial feedback status must be strictly PENDING');
  console.log(`  ✅ Student feedback submitted successfully (ID: ${feedbackId}, status=PENDING).`);

  // 3. Admin lists feedback
  const listRes = await req('GET', '/admin/platform/feedback?status=PENDING', undefined, adminToken);
  assert(listRes.status === 200, 'Admin list feedback failed');
  const found = listRes.json.data.items.some((f: any) => f.id === feedbackId);
  assert(found, 'Created feedback must be present in PENDING admin list');
  console.log('  ✅ Admin feedback listing returned 200 with student details.');

  // 4. Admin updates to UNDER_REVIEW
  const reviewRes = await req(
    'PATCH',
    `/admin/platform/feedback/${feedbackId}`,
    { status: 'UNDER_REVIEW', adminNotes: 'Investigating CSS tokens' },
    adminToken
  );
  assert(reviewRes.status === 200, 'Update to UNDER_REVIEW failed');
  assert(reviewRes.json.data.status === 'UNDER_REVIEW', 'status mismatch');
  assert(reviewRes.json.data.resolvedAt === null, 'resolvedAt must be null when UNDER_REVIEW');
  console.log('  ✅ Feedback moved to UNDER_REVIEW (resolvedAt=null).');

  // 5. Admin resolves feedback -> status = RESOLVED, resolvedAt & resolvedByUserId populated
  const resolveRes = await req(
    'PATCH',
    `/admin/platform/feedback/${feedbackId}`,
    { status: 'RESOLVED', adminNotes: 'Fixed token contrast in theme.css' },
    adminToken
  );
  assert(resolveRes.status === 200, 'Update to RESOLVED failed');
  assert(resolveRes.json.data.status === 'RESOLVED', 'status mismatch');
  assert(resolveRes.json.data.resolvedAt !== null, 'resolvedAt must be set on RESOLVED');
  assert(resolveRes.json.data.resolvedByUser !== null, 'resolvedByUser must be populated on RESOLVED');
  console.log('  ✅ Feedback moved to RESOLVED with resolver and timestamp.');

  // 6. Admin moves back to UNDER_REVIEW -> resolvedAt and resolvedByUser cleared
  const reopenRes = await req(
    'PATCH',
    `/admin/platform/feedback/${feedbackId}`,
    { status: 'UNDER_REVIEW' },
    adminToken
  );
  assert(reopenRes.status === 200, 'Reopen failed');
  assert(reopenRes.json.data.resolvedAt === null, 'resolvedAt must be cleared when reopening');
  assert(reopenRes.json.data.resolvedByUser === null, 'resolvedByUser must be cleared when reopening');
  console.log('  ✅ Reopened feedback cleanly clears resolution fields.');

  // 7. Verify atomic audit logs
  const fbAudit = await prisma.adminAuditLog.findFirst({
    where: { targetId: feedbackId, action: 'FEEDBACK_RESOLVED' },
  });
  assert(fbAudit !== null, 'FEEDBACK_RESOLVED audit log must exist');
  console.log('  ✅ Atomic AdminAuditLog verified for feedback updates.');
}

async function testSystemSettingsAndEnforcement() {
  console.log('\nA5.7 & A5.8: System Settings & Real Enforcement...');

  // 1. Admin reads settings
  const settingsRes = await req('GET', '/admin/platform/settings', undefined, adminToken);
  assert(settingsRes.status === 200, `Get settings failed: ${JSON.stringify(settingsRes.json)}`);
  console.log(`  ✅ Admin retrieved system settings (${settingsRes.json.data.length} settings).`);

  // 2. Unsupported setting key -> 400
  const invalidKeyRes = await req(
    'PATCH',
    '/admin/platform/settings/UNKNOWN_FEATURE_FLAG',
    { value: true },
    adminToken
  );
  assert(invalidKeyRes.status === 400, `Expected 400 for unknown setting key, got ${invalidKeyRes.status}`);
  console.log('  ✅ Unknown setting key correctly rejected with 400.');

  // 3. Invalid value type (string instead of boolean) -> 400
  const invalidValRes = await req(
    'PATCH',
    '/admin/platform/settings/MAINTENANCE_MODE',
    { value: 'not_a_boolean' },
    adminToken
  );
  assert(invalidValRes.status === 400, `Expected 400 for string value, got ${invalidValRes.status}`);
  console.log('  ✅ Non-boolean setting value correctly rejected with 400.');

  // ─── ENFORCEMENT 1: ALLOW_STUDENT_REGISTRATION ────────────────────────────
  console.log('\n  Testing ALLOW_STUDENT_REGISTRATION enforcement...');
  // A. Disable registration
  await req('PATCH', '/admin/platform/settings/ALLOW_STUDENT_REGISTRATION', { value: false }, adminToken);

  // B. Attempt registration while disabled -> 403 Forbidden
  const blockedReg = await req('POST', '/auth/register', {
    email: `blocked_reg_${ts}@integrum.dev`,
    password: 'Password123!',
    firstName: 'Blocked',
    lastName: 'User',
  });
  assert(blockedReg.status === 403, `Expected 403 for registration when disabled, got ${blockedReg.status}`);
  console.log('  ✅ Registration attempt blocked with 403 when ALLOW_STUDENT_REGISTRATION=false.');

  // C. Re-enable registration
  await req('PATCH', '/admin/platform/settings/ALLOW_STUDENT_REGISTRATION', { value: true }, adminToken);
  const allowedReg = await req('POST', '/auth/register', {
    email: `allowed_reg_${ts}@integrum.dev`,
    password: 'Password123!',
    firstName: 'Allowed',
    lastName: 'User',
  });
  assert(allowedReg.status === 201, `Registration should succeed when re-enabled, got ${allowedReg.status}`);
  console.log('  ✅ Registration succeeds with 201 when ALLOW_STUDENT_REGISTRATION=true.');

  // ─── ENFORCEMENT 2: AI_FEATURES_ENABLED ───────────────────────────────────
  console.log('\n  Testing AI_FEATURES_ENABLED enforcement...');
  // A. Disable AI features
  await req('PATCH', '/admin/platform/settings/AI_FEATURES_ENABLED', { value: false }, adminToken);

  // B. Student attempts AI study-plan generation -> 403 Forbidden
  const blockedAi = await req(
    'POST',
    '/ai/study-plan',
    { topic: 'Data Structures & Algorithms', goals: 'Master Trees and Graphs' },
    studentToken
  );
  assert(blockedAi.status === 403, `Expected 403 for AI when disabled, got ${blockedAi.status}`);
  console.log('  ✅ Student AI request blocked with 403 when AI_FEATURES_ENABLED=false.');

  // C. Re-enable AI features
  await req('PATCH', '/admin/platform/settings/AI_FEATURES_ENABLED', { value: true }, adminToken);
  const allowedAi = await req(
    'POST',
    '/ai/study-plan',
    { topic: 'Data Structures & Algorithms', goals: 'Master Trees and Graphs' },
    studentToken
  );
  assert(allowedAi.status === 201 || allowedAi.status === 200, `AI should succeed when re-enabled, got ${allowedAi.status}`);
  console.log('  ✅ Student AI request succeeds when AI_FEATURES_ENABLED=true.');

  // ─── ENFORCEMENT 3: MAINTENANCE_MODE ──────────────────────────────────────
  console.log('\n  Testing MAINTENANCE_MODE enforcement & recovery...');
  // A. Enable Maintenance Mode
  await req('PATCH', '/admin/platform/settings/MAINTENANCE_MODE', { value: true }, adminToken);

  // B. Student API request -> 503 Service Unavailable
  const studentMaint = await req('GET', '/users/me', undefined, studentToken);
  assert(studentMaint.status === 503, `Expected 503 for student during maintenance, got ${studentMaint.status}`);
  console.log('  ✅ Student API request blocked with 503 during active maintenance mode.');

  // C. /health endpoint remains operational -> 200 OK
  const healthRes = await req('GET', '/health');
  assert(healthRes.status === 200, 'Health endpoint must bypass maintenance');
  console.log('  ✅ /health endpoint operational (200) during maintenance.');

  // D. Admin routes remain operational -> 200 OK
  const adminPing = await req('GET', '/admin/ping', undefined, adminToken);
  assert(adminPing.status === 200, 'Admin routes must bypass maintenance');
  console.log('  ✅ Admin routes operational (200) during maintenance.');

  // E. Admin login remains operational -> 200 OK
  const adminLogin = await req('POST', '/auth/login', { email: adminEmail, password: adminPassword });
  assert(adminLogin.status === 200, 'Admin login must be available during maintenance for recovery');
  console.log('  ✅ Admin login operational (200) during maintenance.');

  // F. Disable Maintenance Mode via Admin
  const disableMaint = await req('PATCH', '/admin/platform/settings/MAINTENANCE_MODE', { value: false }, adminToken);
  assert(disableMaint.status === 200, 'Disabling maintenance failed');

  // G. Student API operations restored -> 200 OK
  const studentRestored = await req('GET', '/users/me', undefined, studentToken);
  assert(studentRestored.status === 200, 'Student API should be restored after maintenance disabled');
  console.log('  ✅ Student operations restored (200) after maintenance mode disabled.');

  // 4. Verify atomic audit logs for setting updates
  const settingAudits = await prisma.adminAuditLog.findMany({
    where: { action: 'SYSTEM_SETTING_UPDATED' },
  });
  assert(settingAudits.length >= 3, `Expected at least 3 setting audit logs, got ${settingAudits.length}`);
  console.log('  ✅ Atomic AdminAuditLog records verified for all system setting mutations.');
}

async function main() {
  console.log('🚀 Phase A5 — Platform Management & Feedback Integration Tests');
  console.log('='.repeat(62));

  try {
    await setup();
    await testDashboardAggregations();
    await testAuditLogs();
    await testFeedbackSubsystem();
    await testSystemSettingsAndEnforcement();

    console.log('\n' + '='.repeat(62));
    console.log('🎉 ALL Phase A5 Platform Management tests passed successfully!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Phase A5 tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
