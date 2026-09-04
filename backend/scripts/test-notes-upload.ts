/**
 * Task 3 — Notes File Upload Integration Tests (G1)
 *
 * Verifies:
 * 1. Valid PDF upload -> 200, data.fileId present
 * 2. Invalid extension (.txt) -> 400
 * 3. Wrong magic bytes disguised as .pdf -> 400
 * 4. File too large (11 MB) -> 413
 * 5. GET file redirect -> 302 (or 2xx if redirect followed)
 * 6. No auth -> 401
 * 7. Cross-student -> 403 or 404
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();

// Minimal valid PDF magic bytes
const VALID_PDF_BUFFER = Buffer.from('%PDF-1.4 test\n%%EOF\n');

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
  redirect: boolean = false,
): Promise<{ status: number; json: any }> {
  const form = new FormData();
  const blob = new Blob([fileBuffer]);
  form.append('file', blob, filename);

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: form,
    redirect: redirect ? 'follow' : 'manual',
  });

  let json: any = {};
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    json = await res.json();
  }
  return { status: res.status, json };
}

async function main() {
  console.log('🚀 Task 3 — Notes File Upload Integration Tests');
  console.log('='.repeat(55));

  const studentEmail1 = `student_upload_${ts}@integrum.dev`;
  const studentEmail2 = `student_upload2_${ts}@integrum.dev`;
  const password = 'TestPass123!';

  let token1 = '';
  let token2 = '';
  let noteId = '';
  let semesterId = '';
  let subjectId = '';

  try {
    // ── Setup Student 1 ──────────────────────────────────────────────
    console.log('\n[Setup] Registering student 1...');
    await jsonReq('POST', '/auth/register', {
      email: studentEmail1,
      password,
      firstName: 'Upload',
      lastName: 'Tester',
    });
    const login1 = await jsonReq('POST', '/auth/login', { email: studentEmail1, password });
    assert(login1.status === 200, `Student 1 login failed: ${JSON.stringify(login1.json)}`);
    token1 = login1.json.data.accessToken;
    console.log('  ✅ Student 1 authenticated');

    // ── Create Semester -> Subject -> Note ────────────────────────────
    console.log('\n[Setup] Creating semester...');
    const semRes = await jsonReq('POST', '/semesters', {
      name: `Upload Test Sem ${ts}`,
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
    }, token1);
    assert(semRes.status === 201, `Create semester failed: ${JSON.stringify(semRes.json)}`);
    semesterId = semRes.json.data.id;
    console.log('  ✅ Semester created:', semesterId);

    console.log('[Setup] Creating subject...');
    const subRes = await jsonReq('POST', '/subjects', {
      semesterId,
      name: 'Advanced Upload Studies',
      code: 'AUS101',
    }, token1);
    assert(subRes.status === 201, `Create subject failed: ${JSON.stringify(subRes.json)}`);
    subjectId = subRes.json.data.id;
    console.log('  ✅ Subject created:', subjectId);

    console.log('[Setup] Creating note...');
    const noteRes = await jsonReq('POST', '/notes', {
      subjectId,
      title: 'Upload Test Note',
    }, token1);
    assert(noteRes.status === 201, `Create note failed: ${JSON.stringify(noteRes.json)}`);
    noteId = noteRes.json.data.id;
    console.log('  ✅ Note created:', noteId);

    // ── Test 1: Valid PDF upload ───────────────────────────────────────
    console.log('\n[Test 1] Valid PDF upload...');
    const t1 = await uploadReq(`/notes/${noteId}/upload`, VALID_PDF_BUFFER, 'test.pdf', token1);
    assert(t1.status === 200, `Expected 200, got ${t1.status}: ${JSON.stringify(t1.json)}`);
    assert(typeof t1.json.data?.fileId === 'string', `Expected data.fileId string, got: ${JSON.stringify(t1.json.data)}`);
    console.log('  ✅ Valid PDF upload returned 200 with fileId:', t1.json.data.fileId);

    // ── Test 2: Invalid extension (.txt) ──────────────────────────────
    console.log('\n[Test 2] Invalid extension (.txt) upload...');
    const t2 = await uploadReq(`/notes/${noteId}/upload`, Buffer.from('hello world'), 'test.txt', token1);
    assert(t2.status === 400, `Expected 400 for .txt, got ${t2.status}: ${JSON.stringify(t2.json)}`);
    console.log('  ✅ .txt file correctly rejected with 400');

    // ── Test 3: Wrong magic bytes (text in .pdf) ──────────────────────
    console.log('\n[Test 3] Wrong magic bytes disguised as .pdf...');
    const t3 = await uploadReq(`/notes/${noteId}/upload`, Buffer.from('this is not a pdf'), 'disguised.pdf', token1);
    assert(t3.status === 400, `Expected 400 for bad magic bytes, got ${t3.status}: ${JSON.stringify(t3.json)}`);
    console.log('  ✅ Disguised file correctly rejected with 400');

    // ── Test 4: File too large (11 MB) ────────────────────────────────
    console.log('\n[Test 4] File too large (11 MB)...');
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
    const t4 = await uploadReq(`/notes/${noteId}/upload`, bigBuffer, 'big.pdf', token1);
    assert(t4.status === 413, `Expected 413 for oversized file, got ${t4.status}: ${JSON.stringify(t4.json)}`);
    console.log('  ✅ Oversized file correctly rejected with 413');

    // ── Test 5: GET file redirect ─────────────────────────────────────
    console.log('\n[Test 5] GET file redirect...');
    const fileRes = await fetch(`${BASE}/notes/${noteId}/file`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token1}` },
      redirect: 'manual',
    });
    const isRedirectOrSuccess = fileRes.status === 302 || (fileRes.status >= 200 && fileRes.status < 300);
    assert(isRedirectOrSuccess, `Expected 302 or 2xx redirect, got ${fileRes.status}`);
    console.log(`  ✅ GET file returned ${fileRes.status} (redirect)`);

    // ── Test 6: No auth -> 401 ────────────────────────────────────────
    console.log('\n[Test 6] Upload without auth...');
    const t6 = await uploadReq(`/notes/${noteId}/upload`, VALID_PDF_BUFFER, 'test.pdf');
    assert(t6.status === 401, `Expected 401 for no auth, got ${t6.status}: ${JSON.stringify(t6.json)}`);
    console.log('  ✅ Unauthenticated request correctly rejected with 401');

    // ── Setup Student 2 ───────────────────────────────────────────────
    console.log('\n[Setup] Registering student 2 (cross-student test)...');
    await jsonReq('POST', '/auth/register', {
      email: studentEmail2,
      password,
      firstName: 'Other',
      lastName: 'Student',
    });
    const login2 = await jsonReq('POST', '/auth/login', { email: studentEmail2, password });
    assert(login2.status === 200, `Student 2 login failed: ${JSON.stringify(login2.json)}`);
    token2 = login2.json.data.accessToken;
    console.log('  ✅ Student 2 authenticated');

    // ── Test 7: Cross-student access -> 403 or 404 ───────────────────
    console.log('\n[Test 7] Cross-student upload (student 2 to student 1 note)...');
    const t7 = await uploadReq(`/notes/${noteId}/upload`, VALID_PDF_BUFFER, 'test.pdf', token2);
    assert(t7.status === 403 || t7.status === 404, `Expected 403 or 404 for cross-student, got ${t7.status}: ${JSON.stringify(t7.json)}`);
    console.log(`  ✅ Cross-student access correctly rejected with ${t7.status}`);

    console.log('\n' + '='.repeat(55));
    console.log('🎉 All Task 3 upload tests passed!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
