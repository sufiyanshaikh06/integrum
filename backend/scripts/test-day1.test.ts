import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { z } from 'zod';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { validateRequest } from '../src/middleware/validateRequest.js';
import { LocalStorageProvider } from '../src/services/storage/local.storage.js';
import { withTimeout } from '../src/utils/withTimeout.js';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { noteService } from '../src/services/note.service.js';
import { userService } from '../src/services/user.service.js';

// Fail closed before creating fixtures on a working database.
assert(new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'));
assert.equal(process.env.NODE_ENV, 'test');

test('day-one HTTP and persistence regressions', async t => {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
  const prefix = `closure_${randomUUID()}`;
  const users: any[] = [];
  const pdf = Buffer.from('%PDF-1.4\nclosure bytes\n%%EOF\n');
  async function req(method: string, route: string, token = '', body?: unknown) {
    return fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }
  async function create(route: string, token: string, body: unknown) {
    const r = await req('POST', route, token, body), j = await r.json() as any;
    assert.equal(r.status, 201, JSON.stringify(j)); return j.data;
  }
  async function student(suffix: string) {
    const email = `${prefix}_${suffix}@integrum.test`, password = 'ClosurePass123!';
    const u = await create('/auth/register', '', { email, password, firstName: 'Closure', lastName: suffix });
    users.push(u);
    const login = await req('POST', '/auth/login', '', { email, password }); assert.equal(login.status, 200);
    u.token = (await login.json() as any).data.accessToken;
    u.profileId = (await (await req('GET', '/users/me', u.token)).json() as any).data.studentProfile.id;
    return u;
  }
  async function upload(route: string, token: string) {
    const f = new FormData(); f.append('file', new Blob([pdf]), 'document.pdf');
    return fetch(base + route, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: f });
  }
  const files = (id: string, folder = 'notes') => readdir(path.resolve('uploads', folder, id)).catch(() => []);
  try {
    const a = await student('A'), b = await student('B');
    const sem = await create('/semesters', a.token, { name: prefix, startDate: '2026-09-01T00:00:00Z', endDate: '2026-12-31T00:00:00Z' });
    const subject = await create('/subjects', a.token, { semesterId: sem.id, name: 'Closure', code: 'CL' });
    const note = await create('/notes', a.token, { subjectId: subject.id, title: 'Private document' });
    const own = await create('/study-plans', a.token, { title: 'Own plan' });
    const other = await create('/study-plans', b.token, { title: 'Other plan' });
    await t.test('career classification, history, validation and ownership', async () => {
      const route = '/job-applications';
      const internship = await create(route, a.token, { companyName: 'Legacy', role: 'Intern' });
      assert.equal(internship.applicationType, 'INTERNSHIP');
      assert.equal(internship.eligibilityStatus, 'UNKNOWN');
      const history = [{ date: '2026-09-19T10:00:00Z', round: 'Technical', outcome: 'Passed' }];
      const placement = await create(route, a.token, { companyName: 'Graduate', role: 'Engineer', applicationType: 'PLACEMENT', eligibilityStatus: 'ELIGIBLE', interviewHistory: history, interviewRound: 'HR' });
      await create(route, b.token, { companyName: 'Foreign', role: 'Engineer', applicationType: 'PLACEMENT' });
      for (const suffix of ['/placements', '?applicationType=PLACEMENT']) {
        const r = await req('GET', route + suffix, a.token);
        assert.equal(r.status, 200);
        assert.deepEqual((await r.json() as any).data.map((v: any) => v.id), [placement.id]);
      }
      const list = await req('GET', route + '/internships', a.token);
      assert.deepEqual((await list.json() as any).data.map((v: any) => v.id), [internship.id]);
      assert.deepEqual(placement.interviewHistory, history);
      assert.equal(placement.interviewRound, 'HR');
      for (const method of ['GET', 'PATCH', 'DELETE']) {
        assert.equal((await req(method, `${route}/${placement.id}`, b.token, method === 'PATCH' ? { eligibilityStatus: 'NOT_ELIGIBLE' } : undefined)).status, 404);
      }
      assert.equal((await req('GET', route + '/placements')).status, 401);
      assert.equal((await req('GET', route + '?applicationType=INVALID', a.token)).status, 400);
      for (const payload of [{ applicationType: 'INVALID' }, { eligibilityStatus: 'INVALID' }, { interviewHistory: [{ date: 'bad', round: '' }] }]) {
        assert.equal((await req('PATCH', `${route}/${placement.id}`, a.token, payload)).status, 400);
      }
      const updated = await req('PATCH', `${route}/${placement.id}`, a.token, { applicationType: 'INTERNSHIP', eligibilityStatus: 'NOT_ELIGIBLE', interviewHistory: [] });
      assert.equal(updated.status, 200);
      const saved = await prisma.jobApplication.findUniqueOrThrow({ where: { id: placement.id } });
      assert.equal(saved.applicationType, 'INTERNSHIP');
      assert.equal(saved.eligibilityStatus, 'NOT_ELIGIBLE');
      assert.deepEqual(saved.interviewHistory, []);
      assert.equal(saved.interviewRound, 'HR');
    });
    await t.test('analytics formulas, empty accounts and student isolation', async () => {
      const empty = await student('Empty');
      async function data(route: string, token: string) {
        const response = await req('GET', '/analytics/' + route, token);
        assert.equal(response.status, 200);
        return (await response.json() as any).data;
      }
      const dashboard = await data('dashboard', empty.token);
      assert.equal(dashboard.career.resumeCompletionScore, 0);
      assert.equal(dashboard.academic.studyPlanGoalAchievementRate, 0);
      assert.deepEqual(await data('subject-performance', empty.token), []);
      assert.equal((await data('internship-stats', empty.token)).totalApplications, 0);
      for (const route of ['subject-performance', 'internship-stats']) {
        assert.equal((await req('GET', '/analytics/' + route)).status, 401);
      }
      await prisma.subject.update({ where: { id: subject.id }, data: { totalClasses: 4, attendedClasses: 3 } });
      await prisma.assignment.createMany({ data: [
        { subjectId: subject.id, title: 'Submitted', status: 'SUBMITTED' },
        { subjectId: subject.id, title: 'Pending', status: 'PENDING' },
      ] });
      await prisma.studyPlan.update({ where: { id: own.id }, data: { status: 'COMPLETED' } });
      await create('/study-plans', a.token, { title: 'Still active' });
      const resume = await create('/resumes', a.token, { title: 'Active resume', isActive: true,
        content: { personalInfo: { name: 'Student' }, education: [{ institution: 'College' }],
          experience: [{}], skills: ['TypeScript'], projects: [{ title: '   ' }] } });
      // A newer inactive resume must not silently replace the selected active one.
      await create('/resumes', a.token, { title: 'Unused draft', content: {} });
      const subjectStats = await data('subject-performance', a.token);
      assert.equal(subjectStats.length, 1);
      assert.equal(subjectStats[0].subjectId, subject.id);
      assert.equal(subjectStats[0].attendancePercentage, 75);
      assert.equal(subjectStats[0].assignmentCompletionRate, 50);
      const populated = await data('dashboard', a.token);
      assert.equal(populated.academic.attendancePercentage, 75);
      assert.equal(populated.academic.assignmentCompletionRate, 50);
      assert.equal(populated.academic.studyPlanGoalAchievementRate, 50);
      assert.equal(populated.career.resumeCompletionScore, 60);
      assert.equal(populated.career.resumeCompletion.resumeId, resume.id);
      assert.deepEqual(populated.career.resumeCompletion.missingSections, ['experience', 'projects']);
      // Latest version, not any historical complete version, determines completion.
      assert.equal((await req('PATCH', '/resumes/' + resume.id, a.token, { content: {} })).status, 200);
      assert.equal((await data('dashboard', a.token)).career.resumeCompletionScore, 0);
      await create('/job-applications', a.token, { companyName: 'Offer', role: 'Intern', status: 'OFFERED' });
      await create('/job-applications', a.token, { companyName: 'Placement', role: 'Graduate', status: 'OFFERED', applicationType: 'PLACEMENT' });
      await create('/job-applications', b.token, { companyName: 'Foreign offer', role: 'Intern', status: 'OFFERED' });
      const stats = await data('internship-stats', a.token);
      assert.equal(stats.totalApplications, 3);
      assert.equal(stats.offerCount, 1);
      assert(Math.abs(stats.offerRate - 100 / 3) < 1e-9);
      assert.deepEqual(await data('subject-performance', b.token), []);
      assert.equal((await data('dashboard', b.token)).career.resumeCompletionScore, 0);
    });
    await t.test('real department endpoint persists normalized values', async () => {
      const login = await req('POST', '/auth/login', '', {
        email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD,
      });
      assert.equal(login.status, 200);
      const token = (await login.json() as any).data.accessToken;
      const department = await create('/admin/academics/departments', token, {
        name: '  Closure department  ', code: `  ${prefix}  `,
      });
      try {
        const saved = await prisma.department.findUniqueOrThrow({ where: { id: department.id } });
        assert.equal(saved.name, 'Closure department'); assert.equal(saved.code, prefix.toUpperCase());
      } finally {
        await prisma.department.delete({ where: { id: department.id } });
        await prisma.adminAuditLog.deleteMany({ where: { targetId: department.id } });
      }
    });
    await t.test('foreign study-plan links rejected on create/update with no mutation', async () => {
      const count = await prisma.task.count({ where: { studentProfileId: a.profileId } });
      assert.equal((await req('POST', '/tasks', a.token, { title: 'Foreign', studyPlanId: other.id })).status, 404);
      assert.equal(await prisma.task.count({ where: { studentProfileId: a.profileId } }), count);
      const task = await create('/tasks', a.token, { title: 'Own task', studyPlanId: own.id });
      assert.equal((await req('PATCH', `/tasks/${task.id}`, a.token, { title: 'Changed', studyPlanId: other.id })).status, 404);
      const saved = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
      assert.equal(saved.studyPlanId, own.id); assert.equal(saved.title, 'Own task');
    });
    await t.test('private note bytes, access isolation and replacement cleanup', async () => {
      const r = await upload(`/notes/${note.id}/upload`, a.token); assert.equal(r.status, 200);
      const old = (await r.json() as any).data.fileId;
      const downloaded = await req('GET', `/notes/${note.id}/file`, a.token);
      assert.equal(downloaded.status, 200); assert.equal(downloaded.headers.get('cache-control'), 'private, no-store');
      assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), pdf);
      assert.equal((await req('GET', `/notes/${note.id}/file`, b.token)).status, 404);
      assert.equal((await req('GET', `/notes/${note.id}/file`)).status, 401);
      assert.equal((await upload(`/notes/${note.id}/upload`, a.token)).status, 200);
      await assert.rejects(readFile(path.resolve('uploads', old)), { code: 'ENOENT' });
    });
    await t.test('foreign upload and failed database attachment leave no extra storage objects', async () => {
      const before = await files(b.profileId);
      assert.equal((await upload(`/notes/${note.id}/upload`, b.token)).status, 404);
      assert.deepEqual(await files(b.profileId), before);
      const existing = await files(a.profileId), original = noteService.attachFile;
      noteService.attachFile = async () => { throw new Error('Injected database failure'); };
      try { assert.equal((await upload(`/notes/${note.id}/upload`, a.token)).status, 500); }
      finally { noteService.attachFile = original; }
      assert.deepEqual(await files(a.profileId), existing);
    });
    await t.test('profile resume bytes, replacement cleanup and readable attachment metadata', async () => {
      const r = await upload('/users/me/resume-upload', a.token); assert.equal(r.status, 200);
      const old = (await r.json() as any).data.fileId;
      const downloaded = await req('GET', '/users/me/resume-file', a.token);
      assert.equal(downloaded.status, 200); assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), pdf);
      assert.equal((await req('GET', '/users/me/resume-file', b.token)).status, 404);
      assert.equal((await upload('/users/me/resume-upload', a.token)).status, 200);
      await assert.rejects(readFile(path.resolve('uploads', old)), { code: 'ENOENT' });
      const profile = (await (await req('GET', '/users/me', a.token)).json() as any).data.studentProfile;
      assert(profile.uploadedResumeFileId && profile.uploadedResumeFileId !== old);
    });
    await t.test('stale concurrent attachment updates rejected', async () => {
      await assert.rejects(noteService.attachFile(a.profileId, note.id, 'stale', null), { statusCode: 409 });
      await assert.rejects(userService.attachResume(a.id, 'stale', null), { statusCode: 409 });
    });
    await t.test('note deletion cleans current attachment', async () => {
      const id = await noteService.getFileId(a.profileId, note.id);
      assert.equal((await req('DELETE', `/notes/${note.id}`, a.token)).status, 204);
      await assert.rejects(readFile(path.resolve('uploads', id)), { code: 'ENOENT' });
    });
  } finally {
    for (const u of users) {
      await prisma.user.delete({ where: { id: u.id } });
      if (u.profileId) for (const folder of ['notes', 'profiles']) await rm(path.resolve('uploads', folder, u.profileId), { recursive: true, force: true });
    }
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    await prisma.$disconnect();
  }
});
test('Express receives parsed body, query defaults and params', async () => {
  const probe = express(); probe.use(express.json());
  probe.post('/:id', validateRequest(z.object({ body: z.object({ code: z.string().trim().toUpperCase(), count: z.coerce.number() }), query: z.object({ page: z.coerce.number().default(1) }), params: z.object({ id: z.coerce.number() }) })), (req, res) => res.json({ body: req.body, query: req.query, params: req.params }));
  const s = probe.listen(0, '127.0.0.1'); await once(s, 'listening');
  try {
    const r = await fetch(`http://127.0.0.1:${(s.address() as any).port}/42`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: ' cs ', count: '3', ignored: true }) });
    assert.deepEqual(await r.json(), { body: { code: 'CS', count: 3 }, query: { page: 1 }, params: { id: 42 } });
  } finally { s.close(); }
});
test('path traversal blocked and local public URL prohibited', async () => {
  const p = new LocalStorageProvider();
  assert.throws(() => p.getLocalPath('../outside.pdf'), { statusCode: 400 });
  assert.throws(() => p.getLocalPath('/etc/passwd'), { statusCode: 400 });
  await assert.rejects(p.getSignedUrl('file.pdf', 60), { statusCode: 500 });
});
test('timeout maps to 503; success and provider rejection preserved', async () => {
  assert.equal(await withTimeout(1000, Promise.resolve('ok')), 'ok');
  await assert.rejects(withTimeout(1000, Promise.reject(new Error('provider failure'))), /provider failure/);
  await assert.rejects(withTimeout(5, new Promise(() => {})), { statusCode: 503 });
});
