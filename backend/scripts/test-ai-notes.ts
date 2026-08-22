/**
 * AI Notes Assistant Integration Tests (mock provider)
 *
 * Tests all four capabilities:
 *   N2 — POST /ai/notes/:id/summarize
 *   N3 — POST /ai/notes/:id/key-points
 *   N4 — POST /ai/notes/:id/questions
 *   N5 — POST /ai/notes/:id/flashcards
 *
 * Prerequisites: AI_PROVIDER=mock in .env (no Gemini quota used)
 * After automated pass, manually test one endpoint with AI_PROVIDER=gemini to
 * confirm real provider works end-to-end.
 */

import 'dotenv/config';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();
const email1 = `ai_notes_${ts}@integrum.dev`;
const email2 = `ai_notes2_${ts}@integrum.dev`;
const password = 'TestPass123!';

let token1 = '';
let token2 = '';
let semesterId = '';
let subjectId = '';
let noteId = '';
let fileOnlyNoteId = '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

async function setup() {
  // Register two students
  await req('POST', '/auth/register', {
    email: email1, password, firstName: 'Notes', lastName: 'TestA',
  });
  await req('POST', '/auth/register', {
    email: email2, password, firstName: 'Notes', lastName: 'TestB',
  });

  const l1 = await req('POST', '/auth/login', { email: email1, password });
  const l2 = await req('POST', '/auth/login', { email: email2, password });

  const d1 = l1.json.data as Record<string, string>;
  const d2 = l2.json.data as Record<string, string>;
  token1 = d1.accessToken;
  token2 = d2.accessToken;

  // Student 1: semester → subject → note
  const sem = await req('POST', '/semesters', {
    name: 'Semester 1',
    year: 2025,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
  }, token1);
  semesterId = (sem.json.data as { id: string }).id;

  const subj = await req('POST', '/subjects', {
    semesterId,
    name: 'Data Structures',
    code: 'CS301',
  }, token1);
  subjectId = (subj.json.data as { id: string }).id;

  // Note with textual content
  const note = await req('POST', '/notes', {
    subjectId,
    title: 'Binary Search Trees',
    content: `
A Binary Search Tree (BST) is a node-based binary tree data structure where each node has:
- A key (value)
- Left subtree containing only nodes with keys less than the parent
- Right subtree containing only nodes with keys greater than the parent

Key operations:
1. Search: O(h) where h is tree height
2. Insert: O(h) — traverse to correct position and insert
3. Delete: Three cases — leaf node, one child, two children (replace with inorder successor)

Balanced BSTs like AVL trees and Red-Black trees guarantee O(log n) height.

Traversals:
- Inorder (Left-Root-Right): produces sorted output
- Preorder (Root-Left-Right): useful for copying tree
- Postorder (Left-Right-Root): useful for deletion
    `.trim(),
    tags: ['trees', 'algorithms', 'data-structures'],
  }, token1);
  noteId = (note.json.data as { id: string }).id;

  // File-only note (no content)
  const fileNote = await req('POST', '/notes', {
    subjectId,
    title: 'Lecture Slides',
    fileUrl: 'https://example.com/slides.pdf',
    // no content field
  }, token1);
  fileOnlyNoteId = (fileNote.json.data as { id: string }).id;

  console.log('  ✅ Setup: 2 students, semester, subject, 2 notes created');
}

// ─── N2: Summarize ────────────────────────────────────────────────────────────

async function testSummarize() {
  console.log('\nN2: Note Summarization...');

  const res = await req('POST', `/ai/notes/${noteId}/summarize`, undefined, token1);
  assert(res.status === 200, `summarize returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as { summary: string; keyPoints: string[] };
  assert(typeof data.summary === 'string' && data.summary.length > 0, 'summary must be non-empty string');
  assert(Array.isArray(data.keyPoints) && data.keyPoints.length > 0, 'keyPoints must be non-empty array');
  assert(data.keyPoints.every(kp => typeof kp === 'string'), 'each keyPoint must be a string');
  console.log(`  ✅ Summary returned (${data.keyPoints.length} key points)`);
}

// ─── N3: Key Points ───────────────────────────────────────────────────────────

async function testKeyPoints() {
  console.log('\nN3: Key Point Extraction...');

  const res = await req('POST', `/ai/notes/${noteId}/key-points`, undefined, token1);
  assert(res.status === 200, `key-points returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as { keyPoints: { point: string; importance: string }[] };
  assert(Array.isArray(data.keyPoints) && data.keyPoints.length > 0, 'keyPoints must be non-empty');

  for (const kp of data.keyPoints) {
    assert(typeof kp.point === 'string' && kp.point.length > 0, 'point must be non-empty');
    assert(['HIGH', 'MEDIUM', 'LOW'].includes(kp.importance), `invalid importance: ${kp.importance}`);
  }
  console.log(`  ✅ ${data.keyPoints.length} key points with valid importance levels`);
}

// ─── N4: Questions ────────────────────────────────────────────────────────────

async function testQuestions() {
  console.log('\nN4: Question Generation...');

  const res = await req('POST', `/ai/notes/${noteId}/questions`, undefined, token1);
  assert(res.status === 200, `questions returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as { questions: { question: string; answer: string; difficulty: string }[] };
  assert(Array.isArray(data.questions) && data.questions.length > 0, 'questions must be non-empty');

  for (const q of data.questions) {
    assert(typeof q.question === 'string' && q.question.length > 0, 'question must be non-empty');
    assert(typeof q.answer === 'string' && q.answer.length > 0, 'answer must be non-empty');
    assert(['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty), `invalid difficulty: ${q.difficulty}`);
  }
  console.log(`  ✅ ${data.questions.length} questions with valid difficulty levels`);
}

// ─── N5: Flashcards ───────────────────────────────────────────────────────────

async function testFlashcards() {
  console.log('\nN5: Flashcard Generation...');

  const res = await req('POST', `/ai/notes/${noteId}/flashcards`, undefined, token1);
  assert(res.status === 200, `flashcards returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as { flashcards: { front: string; back: string }[] };
  assert(Array.isArray(data.flashcards) && data.flashcards.length > 0, 'flashcards must be non-empty');

  for (const fc of data.flashcards) {
    assert(typeof fc.front === 'string' && fc.front.length > 0, 'front must be non-empty');
    assert(typeof fc.back === 'string' && fc.back.length > 0, 'back must be non-empty');
  }
  console.log(`  ✅ ${data.flashcards.length} flashcards with front and back`);
}

// ─── Edge case: file-only note → 400 ─────────────────────────────────────────

async function testFileOnlyNote() {
  console.log('\nEdge: File-only note (no content) → 400...');

  const res = await req('POST', `/ai/notes/${fileOnlyNoteId}/summarize`, undefined, token1);
  assert(res.status === 400, `expected 400 for file-only note, got ${res.status}`);
  console.log('  ✅ 400 returned for file-only note — correct V1 behavior');
}

// ─── Security: cross-user isolation ──────────────────────────────────────────

async function testCrossUserIsolation() {
  console.log('\nSecurity: Cross-user note AI isolation...');

  const res1 = await req('POST', `/ai/notes/${noteId}/summarize`, undefined, token2);
  assert(res1.status === 404 || res1.status === 403, `Student B summarize Student A's note: expected 404/403, got ${res1.status}`);
  console.log('  ✅ Student B cannot summarize Student A\'s note');

  const res2 = await req('POST', `/ai/notes/${noteId}/flashcards`, undefined, token2);
  assert(res2.status === 404 || res2.status === 403, `Student B flashcards Student A's note: expected 404/403, got ${res2.status}`);
  console.log('  ✅ Student B cannot generate flashcards from Student A\'s note');
}

// ─── Unauthenticated request ──────────────────────────────────────────────────

async function testUnauthenticated() {
  console.log('\nSecurity: Unauthenticated AI request → 401...');

  const res = await req('POST', `/ai/notes/${noteId}/summarize`);
  assert(res.status === 401, `expected 401 without token, got ${res.status}`);
  console.log('  ✅ Unauthenticated request correctly rejected');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 AI Notes Assistant Integration Tests (mock provider)');
  console.log('='.repeat(55));

  try {
    console.log('\nSetup...');
    await setup();

    await testSummarize();
    await testKeyPoints();
    await testQuestions();
    await testFlashcards();
    await testFileOnlyNote();
    await testCrossUserIsolation();
    await testUnauthenticated();

    console.log('\n' + '='.repeat(55));
    console.log('🎉 All AI Notes tests passed!');
    console.log('\n💡 Manual step: set AI_PROVIDER=gemini in .env and test one');
    console.log('   endpoint manually to confirm the real Gemini provider works.');
    console.log('   Example: POST /api/v1/ai/notes/:id/summarize');
    console.log('   Then restore AI_PROVIDER=mock.');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  }
}

main();
