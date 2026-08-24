/**
 * Real Gemini Provider End-to-End Verification Script
 * 
 * Verifies:
 * 1. Auth & Token generation
 * 2. Semester & Subject creation
 * 3. Note creation with detailed OS scheduling content
 * 4. Real Gemini Summarization (POST /ai/notes/:id/summarize)
 * 5. Real Gemini Flashcards (POST /ai/notes/:id/flashcards)
 * 6. Edge Case: File-only note returns 400 Bad Request
 * 7. Verification of database AIExecutionLog records
 */

import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();
const email = `gemini_live_${ts}@integrum.dev`;
const password = 'TestPass123!';

let token = '';
let studentProfileId = '';
let semesterId = '';
let subjectId = '';
let noteId = '';
let fileOnlyNoteId = '';

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
  console.log('🌟 REAL GEMINI LIVE E2E VERIFICATION 🌟');
  console.log('='.repeat(60));
  console.log(`Current AI_PROVIDER: ${process.env.AI_PROVIDER}`);
  console.log(`Current GEMINI_MODEL: ${process.env.GEMINI_MODEL}`);
  console.log('='.repeat(60));

  try {
    // 1. Register & Login
    console.log('\n1. Registering & Authenticating test student...');
    await req('POST', '/auth/register', {
      email,
      password,
      firstName: 'Gemini',
      lastName: 'LiveTester',
    });

    const loginRes = await req('POST', '/auth/login', { email, password });
    assert(loginRes.status === 200, `Login failed: ${JSON.stringify(loginRes.json)}`);
    token = loginRes.json.data.accessToken;

    const meRes = await req('GET', '/users/me', undefined, token);
    assert(meRes.status === 200, `Fetch profile failed: ${JSON.stringify(meRes.json)}`);
    studentProfileId = meRes.json.data.studentProfile.id;
    console.log(`  ✅ Logged in successfully. Token acquired. (Profile ID: ${studentProfileId})`);

    // 2. Create Semester & Subject
    console.log('\n2. Creating Semester and Subject...');
    const semRes = await req(
      'POST',
      '/semesters',
      {
        name: 'Fall 2026 Core Systems',
        year: 2026,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      },
      token,
    );
    assert(semRes.status === 201, `Semester creation failed: ${JSON.stringify(semRes.json)}`);
    semesterId = semRes.json.data.id;

    const subjRes = await req(
      'POST',
      '/subjects',
      {
        semesterId,
        name: 'Operating Systems',
        code: 'CS-401',
      },
      token,
    );
    assert(subjRes.status === 201, `Subject creation failed: ${JSON.stringify(subjRes.json)}`);
    subjectId = subjRes.json.data.id;
    console.log(`  ✅ Semester and Subject created (Subject ID: ${subjectId})`);

    // 3. Create Note with Real Technical Content
    console.log('\n3. Creating Note with real OS scheduling content...');
    const noteRes = await req(
      'POST',
      '/notes',
      {
        subjectId,
        title: 'Operating Systems — CPU Scheduling & Concurrency',
        content: `
CPU scheduling is the basis of multi-programmed operating systems. By switching the CPU among processes, the OS makes the computer more productive.

1. Process Scheduling Concepts:
- Context Switching: Saving the state of the old process and loading the saved state for the new process.
- CPU and I/O Burst Cycle: Process execution consists of a cycle of CPU execution and I/O wait.
- Preemptive vs Non-preemptive Scheduling: Under non-preemptive scheduling, once the CPU has been allocated to a process, the process keeps the CPU until it releases it, either by terminating or by switching to the waiting state.

2. Scheduling Algorithms:
- First-Come, First-Served (FCFS): Simple FIFO queue, but suffers from the Convoy Effect where short processes wait for one long process.
- Shortest-Job-First (SJF): Provably optimal in giving the minimum average waiting time, but difficult to know the length of the next CPU request in advance.
- Round Robin (RR): Designed for time-sharing systems. A small unit of time (time quantum / slice, generally 10 to 100 ms) is defined. The ready queue is treated as a circular queue. If time quantum is too large, RR behaves like FCFS; if too small, context switch overhead dominates.
- Priority Scheduling with Aging: Solves the starvation (indefinite blocking) problem of low-priority processes by gradually increasing priority over time.
        `.trim(),
        tags: ['operating-systems', 'cpu-scheduling', 'round-robin', 'concurrency'],
      },
      token,
    );
    assert(noteRes.status === 201, `Note creation failed: ${JSON.stringify(noteRes.json)}`);
    noteId = noteRes.json.data.id;
    console.log(`  ✅ Note created successfully (Note ID: ${noteId})`);

    // 4. Call Real Gemini Summarization
    console.log('\n4. Calling Real Gemini Summarization API (POST /ai/notes/:id/summarize)...');
    console.log('   Sending request to backend → AIService → GeminiProvider → Google Gemini API...');
    const summarizeRes = await req('POST', `/ai/notes/${noteId}/summarize`, undefined, token);
    assert(summarizeRes.status === 200, `Summarization failed (${summarizeRes.status}): ${JSON.stringify(summarizeRes.json)}`);
    
    console.log('\n  🎉 REAL GEMINI SUMMARIZATION OUTPUT:');
    console.log('  --------------------------------------------------');
    console.log(`  Summary:\n  ${summarizeRes.json.data.summary}\n`);
    console.log('  Key Points Extracted:');
    summarizeRes.json.data.keyPoints.forEach((kp: string, i: number) => {
      console.log(`   ${i + 1}. ${kp}`);
    });
    console.log('  --------------------------------------------------');

    // 5. Call Real Gemini Flashcard Generation
    console.log('\n5. Calling Real Gemini Flashcard Generation (POST /ai/notes/:id/flashcards)...');
    const flashcardsRes = await req('POST', `/ai/notes/${noteId}/flashcards`, undefined, token);
    assert(flashcardsRes.status === 200, `Flashcards failed (${flashcardsRes.status}): ${JSON.stringify(flashcardsRes.json)}`);
    
    console.log('\n  🎉 REAL GEMINI FLASHCARDS OUTPUT:');
    console.log('  --------------------------------------------------');
    flashcardsRes.json.data.flashcards.forEach((fc: { front: string; back: string }, i: number) => {
      console.log(`  Card ${i + 1}:`);
      console.log(`    Front: ${fc.front}`);
      console.log(`    Back:  ${fc.back}`);
    });
    console.log('  --------------------------------------------------');

    // 6. Test File-only Note (No text content) -> 400 Bad Request
    console.log('\n6. Testing Unsupported File-Only Note limitation (Expecting 400 Bad Request)...');
    const fileOnlyRes = await req(
      'POST',
      '/notes',
      {
        subjectId,
        title: 'Operating Systems PDF Slides',
        fileUrl: 'https://example.com/os_slides.pdf',
      },
      token,
    );
    fileOnlyNoteId = fileOnlyRes.json.data.id;

    const fileAiRes = await req('POST', `/ai/notes/${fileOnlyNoteId}/summarize`, undefined, token);
    assert(fileAiRes.status === 400, `Expected 400 Bad Request for file-only note, got ${fileAiRes.status}`);
    console.log(`  ✅ Correctly rejected with 400 Bad Request: "${fileAiRes.json.message}"`);

    // 7. Verify Database AIExecutionLog Records
    console.log('\n7. Inspecting Database AIExecutionLog records...');
    const executionLogs = await prisma.aIExecutionLog.findMany({
      where: { studentProfileId },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    console.log(`  Found ${executionLogs.length} AI execution log(s) for student:`);
    executionLogs.forEach((log) => {
      console.log(`  - [${log.status}] Module: ${log.module} | Op: ${log.operation} | Started: ${log.startedAt.toISOString()} | Completed: ${log.completedAt?.toISOString()}`);
    });

    const successLogs = executionLogs.filter(l => l.status === 'SUCCESS' && l.module === 'NOTES');
    assert(successLogs.length >= 2, `Expected at least 2 SUCCESS NOTES logs, found ${successLogs.length}`);
    console.log('  ✅ Database AIExecutionLog records verified with SUCCESS status!');

    console.log('\n' + '='.repeat(60));
    console.log('🏆 ALL REAL GEMINI LIVE E2E TESTS PASSED SUCCESSFULLY! 🏆');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
