/**
 * Analytics Gaps Integration Tests
 *
 * Covers:
 *   AN-1 — GET /analytics/skills-progress
 *   AN-2 — GET /analytics/placement-readiness
 *   AN-3 — GET /analytics/activity?period=daily|weekly|custom
 *
 * Also verifies the existing dashboard endpoint still works (regression).
 */

import 'dotenv/config';

const BASE = 'http://localhost:5000/api/v1';
const ts = Date.now();
const email = `analytics_${ts}@integrum.dev`;
const password = 'TestPass123!';

let token = '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  body?: unknown,
  authToken?: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
  // Register + login
  await req('POST', '/auth/register', {
    email, password, firstName: 'Analytics', lastName: 'Student',
  });
  const login = await req('POST', '/auth/login', { email, password });
  token = (login.json.data as { accessToken: string }).accessToken;

  // Semester + subject
  const sem = await req('POST', '/semesters', {
    name: 'Analytics Test Semester',
    year: 2025,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
  }, token);
  const semesterId = (sem.json.data as { id: string }).id;

  const subj = await req('POST', '/subjects', {
    semesterId, name: 'Computer Science', code: 'CS101',
  }, token);
  const subjectId = (subj.json.data as { id: string }).id;

  // Skills
  await req('POST', '/skills', { name: 'TypeScript', category: 'TECHNICAL', proficiencyLevel: 4 }, token);
  await req('POST', '/skills', { name: 'Python', category: 'TECHNICAL', proficiencyLevel: 3 }, token);
  await req('POST', '/skills', { name: 'Communication', category: 'SOFT', proficiencyLevel: 5 }, token);

  // Resume
  const resume = await req('POST', '/resumes', {
    title: 'My Resume',
    content: { personalInfo: { name: 'Analytics Student' }, skills: ['TypeScript'] },
  }, token);
  const resumeId = (resume.json.data as { id: string }).id;


  // Job application
  await req('POST', '/job-applications', {
    companyName: 'TechCorp', role: 'Developer', status: 'APPLIED',
    applicationDate: new Date().toISOString(),
  }, token);

  // Certification (P3 model)
  await req('POST', '/certifications', {
    name: 'AWS Cloud Practitioner',
    issuer: 'Amazon',
    issueDate: new Date().toISOString(),
  }, token);

  // Project (P3 model)
  await req('POST', '/projects', {
    title: 'Portfolio Site',
    description: 'Personal website',
    technologies: ['React', 'TypeScript'],
  }, token);

  // Attendance record
  await req('POST', '/attendance', {
    subjectId,
    date: new Date().toISOString(),
    status: 'PRESENT',
  }, token);

  // Completed task
  const task = await req('POST', '/tasks', {
    title: 'Analytics Test Task', dueDate: new Date().toISOString(),
  }, token);
  const taskId = (task.json.data as { id: string }).id;
  await req('PATCH', `/tasks/${taskId}`, { status: 'DONE' }, token);

  console.log('  ✅ Setup complete: student with skills, resume, application, certification, project, attendance, task');
}

// ─── Dashboard regression ─────────────────────────────────────────────────────

async function testDashboardRegression() {
  console.log('\nRegression: GET /analytics/dashboard...');
  const res = await req('GET', '/analytics/dashboard', undefined, token);
  assert(res.status === 200, `dashboard returned ${res.status}`);
  const data = res.json.data as {
    academic: Record<string, unknown>;
    productivity: Record<string, unknown>;
    career: Record<string, unknown>;
    overallScore: number;
  };
  assert(typeof data.academic === 'object', 'academic section missing');
  assert(typeof data.productivity === 'object', 'productivity section missing');
  assert(typeof data.career === 'object', 'career section missing');
  assert(typeof data.overallScore === 'number', 'overallScore must be a number');
  console.log(`  ✅ Dashboard still works (overallScore: ${data.overallScore.toFixed(1)})`);
}

// ─── AN-1: Skills Progress ────────────────────────────────────────────────────

async function testSkillsProgress() {
  console.log('\nAN-1: GET /analytics/skills-progress...');
  const res = await req('GET', '/analytics/skills-progress', undefined, token);
  assert(res.status === 200, `skills-progress returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as {
    totalSkills: number;
    averageProficiency: number;
    byCategory: Record<string, { count: number; avgProficiency: number; skills: string[] }>;
  };
  assert(data.totalSkills === 3, `expected 3 skills, got ${data.totalSkills}`);
  assert(data.averageProficiency > 0, 'averageProficiency should be > 0');
  assert(typeof data.byCategory === 'object', 'byCategory missing');
  assert('TECHNICAL' in data.byCategory, 'TECHNICAL category missing');
  assert('SOFT' in data.byCategory, 'SOFT category missing');
  assert(data.byCategory['TECHNICAL'].count === 2, 'expected 2 TECHNICAL skills');
  assert(data.byCategory['SOFT'].count === 1, 'expected 1 SOFT skill');
  console.log(`  ✅ ${data.totalSkills} skills, avg proficiency ${data.averageProficiency}`);
}

// ─── AN-2: Placement Readiness ────────────────────────────────────────────────

async function testPlacementReadiness() {
  console.log('\nAN-2: GET /analytics/placement-readiness...');
  const res = await req('GET', '/analytics/placement-readiness', undefined, token);
  assert(res.status === 200, `placement-readiness returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as {
    readinessScore: number;
    note: string;
    breakdown: {
      skills: { score: number; count: number };
      resume: { score: number; hasResume: boolean };
      applications: { score: number; count: number };
      certifications: { score: number; count: number };
      projects: { score: number; count: number };
    };
    recommendations: string[];
  };

  assert(typeof data.readinessScore === 'number', 'readinessScore must be a number');
  assert(data.readinessScore >= 0 && data.readinessScore <= 100, `readinessScore out of range: ${data.readinessScore}`);
  assert(typeof data.note === 'string', 'note (heuristic disclaimer) must be present');
  assert(data.note.includes('heuristic'), 'note should mention heuristic nature of score');
  assert(data.breakdown.skills.count === 3, `expected 3 skills, got ${data.breakdown.skills.count}`);
  assert(data.breakdown.resume.hasResume === true, 'student has a resume');
  assert(data.breakdown.applications.count === 1, 'expected 1 application');
  assert(data.breakdown.certifications.count === 1, 'expected 1 certification');
  assert(data.breakdown.projects.count === 1, 'expected 1 project');
  assert(Array.isArray(data.recommendations), 'recommendations must be an array');
  console.log(`  ✅ readinessScore: ${data.readinessScore}, recommendations: ${data.recommendations.length}`);
}

// ─── AN-3: Activity Breakdown ─────────────────────────────────────────────────

async function testActivityBreakdown() {
  console.log('\nAN-3: GET /analytics/activity (weekly)...');
  const res = await req('GET', '/analytics/activity?period=weekly', undefined, token);
  assert(res.status === 200, `activity (weekly) returned ${res.status}: ${JSON.stringify(res.json)}`);

  const data = res.json.data as {
    period: string;
    from: string;
    to: string;
    tasks: { completed: number; note: string };
    attendance: { totalRecords: number; present: number; percentage: number };
  };
  assert(data.period === 'weekly', 'period should be weekly');
  assert(typeof data.from === 'string', 'from must be a string');
  assert(typeof data.to === 'string', 'to must be a string');
  assert(typeof data.tasks.completed === 'number', 'tasks.completed must be a number');
  assert(typeof data.tasks.note === 'string', 'tasks.note (limitation) must be present');
  assert(typeof data.attendance.percentage === 'number', 'attendance.percentage must be a number');
  console.log(`  ✅ weekly: ${data.tasks.completed} tasks completed, ${data.attendance.percentage}% attendance`);

  console.log('\nAN-3: GET /analytics/activity (daily)...');
  const res2 = await req('GET', '/analytics/activity?period=daily', undefined, token);
  assert(res2.status === 200, `activity (daily) returned ${res2.status}`);
  const data2 = res2.json.data as { period: string };
  assert(data2.period === 'daily', 'period should be daily');
  console.log('  ✅ daily activity endpoint works');

  console.log('\nAN-3: GET /analytics/activity (custom, valid range)...');
  const start = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date().toISOString();
  const res3 = await req(
    'GET',
    `/analytics/activity?period=custom&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`,
    undefined, token,
  );
  assert(res3.status === 200, `activity (custom) returned ${res3.status}: ${JSON.stringify(res3.json)}`);
  console.log('  ✅ custom range works');

  console.log('\nAN-3: GET /analytics/activity (custom, missing endDate) → 400...');
  const res4 = await req(
    'GET',
    `/analytics/activity?period=custom&startDate=${encodeURIComponent(start)}`,
    undefined, token,
  );
  assert(res4.status === 400, `expected 400 for missing endDate, got ${res4.status}`);
  console.log('  ✅ custom without endDate correctly rejected with 400');

  console.log('\nAN-3: GET /analytics/activity (custom, inverted range) → 400...');
  const res5 = await req(
    'GET',
    `/analytics/activity?period=custom&startDate=${encodeURIComponent(end)}&endDate=${encodeURIComponent(start)}`,
    undefined, token,
  );
  assert(res5.status === 400, `expected 400 for inverted range, got ${res5.status}`);
  console.log('  ✅ inverted custom range correctly rejected with 400');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Analytics Gap Integration Tests');
  console.log('='.repeat(45));

  try {
    console.log('\nSetup...');
    await setup();

    await testDashboardRegression();
    await testSkillsProgress();
    await testPlacementReadiness();
    await testActivityBreakdown();

    console.log('\n' + '='.repeat(45));
    console.log('🎉 All analytics tests passed!');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('\n❌ Tests failed:', e.message);
    process.exit(1);
  }
}

main();
