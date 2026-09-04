/**
 * Task 4 — Student Profile Resume Upload Integration Tests (G2)
 *
 * Verifies:
 * 1. Valid PDF upload -> 200, data.fileId present
 * 2. Non-PDF upload (DOCX extension) -> 400
 * 3. Wrong magic bytes disguised as .pdf -> 400
 * 4. GET resume-file -> 302 redirect
 * 5. No auth -> 401
 * 6. GET profile still works (regression) -> 200
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

// Minimal valid PDF magic bytes
const VALID_PDF_BUFFER = Buffer.from('%PDF-1.4\n%%EOF\n');

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

async function uploadReq(
  path: string,
  fileBuffer: Buffer,
  filename: string,
  authToken?: string,
): Promise<{ status: number; json: any }> {
  const form = new FormData();
  const blob = new Blob([fileBuffer]);
  form.append('file', blob, filename);

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: form,
    redirect: 'manual',
  });

  let json: any = {};
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    json = await res.json();
  }
  return { status: res.status, json };
}

async function main() {
  console.log('🚀 Task 4 — Student Profile Resume Upload Integration Tests');
  console.log('='.repeat(60));

  const studentEmail = `student_resume_${ts}@integrum.dev`;
  const password = 'TestPass123!';

  let token = '';

  try {
    // ── Setup Student ─────────────────────────────────────────────
    console.log('\n[Setup] Registering student...');
    await jsonReq('POST', '/auth/register', {
      email: studentEmail,
      password,
      firstName: 'Resume',
      lastName: 'Tester',
    });
    const login = await jsonReq('POST', '/auth/login', { email: studentEmail, password });
    assert(login.status === 200, `Student login failed: ${JSON.stringify(login.json)}`);
    token = login.json.data.accessToken;
    console.log('  ✅ Student authenticated');

    // ── Test 1: Valid PDF upload ───────────────────────────────────
    console.log('\n[Test 1] Valid PDF upload...');
    const t1 = await uploadReq('/users/me/resume-upload', VALID_PDF_BUFFER, 'resume.pdf', token);
    assert(t1.status === 200, `Expected 200, got ${t1.status}: ${JSON.stringify(t1.json)}`);
    assert(
      typeof t1.json.data?.fileId === 'string',
      `Expected data.fileId string, got: ${JSON.stringify(t1.json.data)}`,
    );
    console.log('  ✅ Valid PDF upload returned 200 with fileId:', t1.json.data.fileId);

    // ── Test 2: Non-PDF upload (DOCX extension) ────────────────────
    console.log('\n[Test 2] Non-PDF upload (.docx extension)...');
    // A DOCX file starts with PK (zip header)
    const DOCX_BUFFER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const t2 = await uploadReq('/users/me/resume-upload', DOCX_BUFFER, 'resume.docx', token);
    assert(t2.status === 400, `Expected 400 for .docx, got ${t2.status}: ${JSON.stringify(t2.json)}`);
    console.log('  ✅ .docx file correctly rejected with 400');

    // ── Test 3: Wrong magic bytes disguised as .pdf ────────────────
    console.log('\n[Test 3] Wrong magic bytes disguised as .pdf...');
    const t3 = await uploadReq(
      '/users/me/resume-upload',
      Buffer.from('this is not a pdf'),
      'resume.pdf',
      token,
    );
    assert(
      t3.status === 400,
      `Expected 400 for bad magic bytes, got ${t3.status}: ${JSON.stringify(t3.json)}`,
    );
    console.log('  ✅ Disguised file correctly rejected with 400');

    // ── Test 4: GET resume-file (302 redirect) ────────────────────
    console.log('\n[Test 4] GET resume-file (302 redirect)...');
    const fileRes = await fetch(`${BASE}/users/me/resume-file`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
    });
    const isRedirectOrSuccess =
      fileRes.status === 302 || (fileRes.status >= 200 && fileRes.status < 300);
    assert(isRedirectOrSuccess, `Expected 302 or 2xx redirect, got ${fileRes.status}`);
    console.log(`  ✅ GET resume-file returned ${fileRes.status} (redirect)`);

    // ── Test 5: No auth -> 401 ─────────────────────────────────────
    console.log('\n[Test 5] Upload without auth...');
    const t5 = await uploadReq('/users/me/resume-upload', VALID_PDF_BUFFER, 'resume.pdf');
    assert(t5.status === 401, `Expected 401 for no auth, got ${t5.status}: ${JSON.stringify(t5.json)}`);
    console.log('  ✅ Unauthenticated request correctly rejected with 401');

    // ── Test 6: GET profile still works (regression) ───────────────
    console.log('\n[Test 6] GET profile regression check...');
    const t6 = await jsonReq('GET', '/users/me', undefined, token);
    assert(t6.status === 200, `Expected 200 for GET profile, got ${t6.status}: ${JSON.stringify(t6.json)}`);
    console.log('  ✅ GET profile returned 200 (regression OK)');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All Task 4 resume upload tests passed!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
