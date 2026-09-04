/**
 * Task 5 — Resume PDF Binary Export Integration Tests (G3)
 *
 * Verifies:
 * 1. PDF export returns 200 with Content-Type: application/pdf
 * 2. Response header contains Content-Disposition: attachment
 * 3. First 4 bytes of body are %PDF (0x25 0x50 0x44 0x46)
 * 4. All 5 templates produce valid PDF
 * 5. Cross-student access → 404
 * 6. No auth → 401
 * 7. Resume with no versions → 400
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function jsonReq(
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

async function rawReq(
  method: string,
  path: string,
  authToken?: string,
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
}

async function registerAndLogin(email: string, password: string): Promise<string> {
  await jsonReq('POST', '/auth/register', {
    email,
    password,
    firstName: 'PDF',
    lastName: 'Tester',
  });
  const login = await jsonReq('POST', '/auth/login', { email, password });
  assert(login.status === 200, `Login failed: ${JSON.stringify(login.json)}`);
  return login.json.data.accessToken;
}

async function main() {
  console.log('🚀 Task 5 — Resume PDF Binary Export Integration Tests');
  console.log('='.repeat(57));

  const email1 = `student_pdf_${ts}@integrum.dev`;
  const email2 = `student_pdf2_${ts}@integrum.dev`;
  const password = 'TestPass123!';

  let token1 = '';
  let token2 = '';
  let resumeId = '';

  try {
    // ── Setup Student 1 ──────────────────────────────────────────────
    console.log('\n[Setup] Registering & authenticating student 1...');
    token1 = await registerAndLogin(email1, password);
    console.log('  ✅ Student 1 authenticated');

    // ── Create Resume (with content, creates a version automatically) ─
    console.log('\n[Setup] Creating resume with version content...');
    const createRes = await jsonReq(
      'POST',
      '/resumes',
      {
        title: 'PDF Test Resume',
        content: {
          personalInfo: { email: 'test@test.com', phone: '555-0000' },
          skills: ['TypeScript', 'Node.js'],
          education: [{ degree: 'BSc', institution: 'Test University', year: 2024 }],
          experience: [{ role: 'Developer', company: 'Acme', description: 'Built things' }],
          projects: [{ name: 'Project A', description: 'A great project' }],
        },
        templateId: 'classic',
      },
      token1,
    );
    assert(createRes.status === 201, `Create resume failed: ${JSON.stringify(createRes.json)}`);
    resumeId = createRes.json.data.id;
    console.log('  ✅ Resume created:', resumeId);

    // ── Test 1: PDF export returns 200 with correct Content-Type ─────
    console.log('\n[Test 1] PDF export — status 200 & Content-Type: application/pdf...');
    const t1Res = await rawReq('GET', `/resumes/${resumeId}/pdf`, token1);
    assert(t1Res.status === 200, `Expected 200, got ${t1Res.status}`);
    const ct = t1Res.headers.get('content-type') ?? '';
    assert(ct.includes('application/pdf'), `Expected content-type application/pdf, got: ${ct}`);
    console.log('  ✅ Status 200, Content-Type:', ct);

    // ── Test 2: Content-Disposition includes "attachment" ─────────────
    console.log('\n[Test 2] PDF export — Content-Disposition includes "attachment"...');
    const cd = t1Res.headers.get('content-disposition') ?? '';
    assert(cd.includes('attachment'), `Expected attachment in content-disposition, got: ${cd}`);
    console.log('  ✅ Content-Disposition:', cd);

    // ── Test 3: First 4 bytes are %PDF ───────────────────────────────
    console.log('\n[Test 3] PDF export — first 4 bytes are %PDF...');
    const buf = await t1Res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    assert(bytes[0] === 0x25, `Byte[0] expected 0x25 ('%'), got 0x${bytes[0].toString(16)}`);
    assert(bytes[1] === 0x50, `Byte[1] expected 0x50 ('P'), got 0x${bytes[1].toString(16)}`);
    assert(bytes[2] === 0x44, `Byte[2] expected 0x44 ('D'), got 0x${bytes[2].toString(16)}`);
    assert(bytes[3] === 0x46, `Byte[3] expected 0x46 ('F'), got 0x${bytes[3].toString(16)}`);
    console.log(`  ✅ First 4 bytes: %PDF (total ${buf.byteLength} bytes)`);

    // ── Test 4: All 5 templates produce valid PDF ─────────────────────
    console.log('\n[Test 4] All 5 templates produce valid PDF...');
    const templates = ['classic', 'modern', 'minimal', 'executive', 'compact'];
    for (const templateId of templates) {
      // Update resume to use this template (creates a new version)
      const patchRes = await jsonReq(
        'PATCH',
        `/resumes/${resumeId}`,
        { templateId },
        token1,
      );
      assert(patchRes.status === 200, `PATCH template ${templateId} failed: ${JSON.stringify(patchRes.json)}`);

      const pdfRes = await rawReq('GET', `/resumes/${resumeId}/pdf`, token1);
      assert(pdfRes.status === 200, `Template ${templateId}: Expected 200, got ${pdfRes.status}`);
      const pdfBuf = await pdfRes.arrayBuffer();
      const pdfBytes = new Uint8Array(pdfBuf);
      assert(
        pdfBytes[0] === 0x25 && pdfBytes[1] === 0x50 && pdfBytes[2] === 0x44 && pdfBytes[3] === 0x46,
        `Template ${templateId}: First 4 bytes are not %PDF`,
      );
      console.log(`  ✅ Template '${templateId}': valid PDF (${pdfBuf.byteLength} bytes)`);
    }

    // ── Setup Student 2 ───────────────────────────────────────────────
    console.log('\n[Setup] Registering student 2...');
    token2 = await registerAndLogin(email2, password);
    console.log('  ✅ Student 2 authenticated');

    // ── Test 5: Cross-student → 404 ───────────────────────────────────
    console.log('\n[Test 5] Cross-student PDF export → 404...');
    const t5 = await rawReq('GET', `/resumes/${resumeId}/pdf`, token2);
    const t5Body = (await t5.json()) as any;
    assert(t5.status === 404, `Expected 404 for cross-student, got ${t5.status}: ${JSON.stringify(t5Body)}`);
    console.log(`  ✅ Cross-student correctly rejected with ${t5.status}`);

    // ── Test 6: No auth → 401 ─────────────────────────────────────────
    console.log('\n[Test 6] No auth → 401...');
    const t6 = await rawReq('GET', `/resumes/${resumeId}/pdf`);
    const t6Body = (await t6.json()) as any;
    assert(t6.status === 401, `Expected 401 for no auth, got ${t6.status}: ${JSON.stringify(t6Body)}`);
    console.log('  ✅ Unauthenticated correctly rejected with 401');

    // ── Test 7: Resume with no versions → 400 ────────────────────────
    console.log('\n[Test 7] Resume with no versions → 400...');
    // Directly insert a bare resume (no versions) via Prisma
    // First get the student 1 profile id
    const student1User = await prisma.user.findUnique({
      where: { email: email1 },
      include: { studentProfile: true },
    });
    assert(!!student1User?.studentProfile?.id, 'Student 1 profile not found');
    const profileId = student1User!.studentProfile!.id;

    const bareResume = await prisma.resume.create({
      data: {
        studentProfileId: profileId,
        title: 'No Versions Resume',
        isActive: false,
      },
    });
    console.log('  Created bare resume (no versions) via Prisma:', bareResume.id);

    const t7 = await rawReq('GET', `/resumes/${bareResume.id}/pdf`, token1);
    const t7Body = (await t7.json()) as any;
    assert(t7.status === 400, `Expected 400 for no versions, got ${t7.status}: ${JSON.stringify(t7Body)}`);
    console.log(`  ✅ No-versions resume correctly rejected with 400`);

    console.log('\n' + '='.repeat(57));
    console.log('🎉 All Task 5 PDF export tests passed!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
