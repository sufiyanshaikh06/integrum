import { adminAcademicService } from '../src/services/admin/academic.service.js';
import { adminReportService } from '../src/services/admin/report.service.js';
import { retryStorageCleanup, processCleanup } from '../src/services/storage/cleanup.js';
import { adminUserService } from '../src/services/admin/user.service.js';
import { authService } from '../src/services/auth.service.js';
import { createHash } from 'node:crypto';
import { emailService } from '../src/services/email.service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiProvider } from '../src/services/ai/gemini.provider.js';
import { env } from '../src/config/env.js';
import { MockProvider } from '../src/services/ai/mock.provider.js';
import { generatedStudyPlanOutputSchema } from '../src/schemas/ai.schema.js';
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
  async function upload(route: string, token: string, customBuffer: Buffer = pdf, filename = 'document.pdf') {
    const f = new FormData(); f.append('file', new Blob([new Uint8Array(customBuffer)]), filename);
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
    await t.test('admin enrollment authorization, validation, profile visibility and atomic audit', async () => {
      const stamp = randomUUID();
      const dept = await prisma.department.create({ data: { name: `Enrollment ${stamp}`, code: `E${stamp}` } });
      const first = await prisma.course.create({ data: { departmentId: dept.id, name: 'First course', code: `F${stamp}` } });
      const second = await prisma.course.create({ data: { departmentId: dept.id, name: 'Second course', code: `S${stamp}` } });
      const master = await prisma.masterSubject.create({ data: { courseId: first.id, name: 'Catalog subject', code: stamp } });
      const foreignMaster = await prisma.masterSubject.create({ data: { courseId: second.id, name: 'Foreign syllabus', code: stamp } });
      const action = 'STUDENT_ENROLLMENT_UPDATED', route = `/admin/users/${a.id}/enrollment`;
      const countAudit = () => prisma.adminAuditLog.count({ where: { action, targetId: a.id } });
      try {
        const login = await req('POST', '/auth/login', '', { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
        assert.equal(login.status, 200);
        const admin = (await login.json() as any).data.accessToken;
        const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: process.env.SEED_ADMIN_EMAIL! } });
        assert.equal((await req('PATCH', route, '', { courseId: first.id })).status, 401);
        assert.equal((await req('PATCH', route, b.token, { courseId: first.id })).status, 403);
        for (const body of [{}, { courseId: 'invalid' }, { courseId: first.id, role: 'ADMIN' }]) {
          assert.equal((await req('PATCH', route, admin, body)).status, 400);
        }
        assert.equal((await req('PATCH', '/admin/users/invalid/enrollment', admin, { courseId: first.id })).status, 400);
        assert.equal((await req('PATCH', route, admin, { courseId: randomUUID() })).status, 404);
        assert.equal((await req('PATCH', `/admin/users/${randomUUID()}/enrollment`, admin, { courseId: first.id })).status, 404);
        assert.equal((await req('PATCH', `/admin/users/${adminUser.id}/enrollment`, admin, { courseId: first.id })).status, 400);
        assert.equal(await countAudit(), 0);
        const assigned = await req('PATCH', route, admin, { courseId: first.id });
        assert.equal(assigned.status, 200);
        assert.equal((await assigned.json() as any).data.course.department.id, dept.id);
        assert.equal(await countAudit(), 1);
        const audit = await prisma.adminAuditLog.findFirstOrThrow({ where: { action, targetId: a.id } });
        assert.equal(audit.actorUserId, adminUser.id);
        assert.deepEqual(audit.details, { studentProfileId: a.profileId, previousCourseId: null, courseId: first.id });
        assert.equal((await req('PATCH', route, admin, { courseId: first.id })).status, 200);
        assert.equal(await countAudit(), 1);
        const ownProfile = (await (await req('GET', '/users/me', a.token)).json() as any).data.studentProfile;
        assert.equal(ownProfile.courseId, first.id); assert.equal(ownProfile.course.code, first.code);
        assert.equal((await req('PATCH', '/users/me', a.token, { courseId: second.id })).status, 200);
        assert.equal((await prisma.studentProfile.findUniqueOrThrow({ where: { id: a.profileId } })).courseId, first.id);
        assert.equal((await req('GET', '/subjects/syllabus')).status, 401);
        assert.equal((await req('GET', '/subjects/syllabus?limit=101', a.token)).status, 400);
        const catalog = (await (await req('GET', '/subjects/syllabus', a.token)).json() as any).data;
        assert.deepEqual(catalog.items.map((item: any) => item.id), [master.id]);
        const empty = (await (await req('GET', '/subjects/syllabus', b.token)).json() as any).data;
        assert.deepEqual(empty.items, []);
        const subjectRoute = `/subjects/${subject.id}`;
        assert.equal((await req('PATCH', subjectRoute, b.token, { masterSubjectId: master.id })).status, 404);
        assert.equal((await req('PATCH', subjectRoute, a.token, { masterSubjectId: 'bad' })).status, 400);
        assert.equal((await req('PATCH', subjectRoute, a.token, { masterSubjectId: randomUUID() })).status, 404);
        assert.equal((await req('PATCH', subjectRoute, a.token, { masterSubjectId: foreignMaster.id })).status, 409);
        const linked = await req('PATCH', subjectRoute, a.token, { masterSubjectId: master.id });
        assert.equal(linked.status, 200); assert.equal((await linked.json() as any).data.masterSubject.id, master.id);
        assert.equal((await req('PATCH', subjectRoute, a.token, { attendanceGoal: 75 })).status, 200);
        assert.equal((await (await req('GET', subjectRoute, a.token)).json() as any).data.masterSubjectId, master.id);
        await assert.rejects(adminAcademicService.updateMasterSubject(adminUser.id, master.id, { courseId: second.id }), (e: any) => e.statusCode === 409);
        await assert.rejects(adminAcademicService.deleteMasterSubject(adminUser.id, master.id), (e: any) => e.statusCode === 409);
        const subjectBody = { semesterId: sem.id, name: 'Linked creation', masterSubjectId: master.id };
        const created = await create('/subjects', a.token, subjectBody);
        assert.equal(created.masterSubjectId, master.id);
        assert.equal((await req('POST', '/subjects', a.token, { ...subjectBody, masterSubjectId: foreignMaster.id })).status, 409);
        await prisma.subject.delete({ where: { id: created.id } });
        for (const courseId of [second.id, null]) {
          assert.equal((await req('PATCH', route, admin, { courseId })).status, 409);
        }
        assert.equal(await countAudit(), 1);
        await assert.rejects(adminAcademicService.deleteCourse(adminUser.id, first.id), (e: any) => e.statusCode === 409);
        assert.equal((await req('PATCH', `/subjects/${subject.id}`, a.token, { masterSubjectId: null })).status, 200);
        // A nonexistent audit actor forces the audit insert to fail after the enrollment write.
        await assert.rejects(adminUserService.updateStudentEnrollment(randomUUID(), a.id, { courseId: second.id }));
        assert.equal((await prisma.studentProfile.findUniqueOrThrow({ where: { id: a.profileId } })).courseId, first.id);
        assert.equal(await countAudit(), 1);
        assert.equal((await req('PATCH', route, admin, { courseId: second.id })).status, 200);
        assert.equal((await req('PATCH', route, admin, { courseId: null })).status, 200);
        assert.equal(await countAudit(), 3);
        assert.equal((await prisma.studentProfile.findUniqueOrThrow({ where: { id: a.profileId } })).courseId, null);
      } finally {
        await prisma.subject.update({ where: { id: subject.id }, data: { masterSubjectId: null } });
        await prisma.studentProfile.update({ where: { id: a.profileId }, data: { courseId: null } });
        await prisma.adminAuditLog.deleteMany({ where: { action, targetId: a.id } });
        await prisma.masterSubject.deleteMany({ where: { id: { in: [master.id, foreignMaster.id] } } });
        await prisma.course.deleteMany({ where: { id: { in: [first.id, second.id] } } });
        await prisma.department.delete({ where: { id: dept.id } });
      }
    });
    await t.test('student academic-term lookup, linking, ownership and date integrity', async () => {
      const term = await prisma.academicTerm.create({ data: { name: `Term ${prefix}`, academicYear: 2026, startDate: new Date('2026-09-01Z'), endDate: new Date('2026-12-31Z') } });
      const inactive = await prisma.academicTerm.create({ data: { name: `Inactive ${prefix}`, academicYear: 2026, startDate: term.startDate, endDate: term.endDate, isActive: false } });
      let linked: any;
      try {
        assert.equal((await req('GET', '/semesters/academic-terms')).status, 401);
        assert.equal((await req('GET', '/semesters/academic-terms?limit=101', a.token)).status, 400);
        const lookup = await req('GET', '/semesters/academic-terms?limit=100', a.token);
        assert.equal(lookup.status, 200);
        const catalog = (await lookup.json() as any).data;
        assert(catalog.items.some((item: any) => item.id === term.id));
        assert(!catalog.items.some((item: any) => item.id === inactive.id));
        assert(!('semesters' in catalog.items[0])); assert(!('_count' in catalog.items[0]));
        const body = { name: 'Linked semester', startDate: term.startDate.toISOString(), endDate: term.endDate.toISOString(), academicTermId: term.id };
        assert.equal((await req('POST', '/semesters', a.token, { ...body, academicTermId: randomUUID() })).status, 404);
        assert.equal((await req('POST', '/semesters', a.token, { ...body, academicTermId: inactive.id })).status, 409);
        assert.equal((await req('POST', '/semesters', a.token, { ...body, academicTermId: 'invalid' })).status, 400);
        linked = await create('/semesters', a.token, body);
        assert.equal(linked.academicTerm.id, term.id);
        const route = `/semesters/${linked.id}`;
        assert.equal((await req('PATCH', route, b.token, { academicTermId: null })).status, 404);
        assert.equal((await req('PATCH', route, a.token, { startDate: '2027-01-01T00:00:00Z' })).status, 400);
        assert.equal((await req('PATCH', route, a.token, { endDate: body.startDate })).status, 400);
        const race = await Promise.all([
          req('PATCH', route, a.token, { startDate: '2026-11-01T00:00:00Z' }),
          req('PATCH', route, a.token, { endDate: '2026-10-01T00:00:00Z' }),
        ]);
        assert.equal(race.filter(r => r.status === 200).length, 1);
        assert(race.some(r => r.status === 400 || r.status === 409));
        const after = await prisma.semester.findUniqueOrThrow({ where: { id: linked.id } });
        assert(after.startDate < after.endDate); assert.equal(after.academicTermId, term.id);
        await assert.rejects(adminAcademicService.deleteAcademicTerm(a.id, term.id), (e: any) => e.statusCode === 409);
        await prisma.academicTerm.update({ where: { id: term.id }, data: { isActive: false } });
        assert.equal((await req('PATCH', route, a.token, { name: 'Historical semester' })).status, 200);
        const historical = (await (await req('GET', route, a.token)).json() as any).data;
        assert.equal(historical.academicTerm.isActive, false);
        assert.equal((await req('PATCH', route, a.token, { academicTermId: inactive.id })).status, 409);
        assert.equal((await req('PATCH', route, a.token, { academicTermId: null })).status, 200);
        assert.equal((await prisma.semester.findUniqueOrThrow({ where: { id: linked.id } })).academicTermId, null);
        assert.equal((await req('PATCH', route, a.token, { academicTermId: term.id })).status, 409);
        await prisma.academicTerm.update({ where: { id: term.id }, data: { isActive: true } });
        assert.equal((await req('PATCH', route, a.token, { academicTermId: term.id })).status, 200);
      } finally {
        if (linked) await prisma.semester.delete({ where: { id: linked.id } });
        await prisma.academicTerm.deleteMany({ where: { id: { in: [term.id, inactive.id] } } });
      }
    });
    await t.test('catalog deletion cannot broaden targeted resource visibility and rolls back', async () => {
      const stamp = randomUUID();
      const login = await req('POST', '/auth/login', '', { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
      assert.equal(login.status, 200);
      const adminToken = (await login.json() as any).data.accessToken;
      const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: process.env.SEED_ADMIN_EMAIL! } });

      const deptA = await prisma.department.create({ data: { name: `Dept A ${stamp}`, code: `DA${stamp.slice(0, 8)}` } });
      const deptB = await prisma.department.create({ data: { name: `Dept B ${stamp}`, code: `DB${stamp.slice(0, 8)}` } });
      const courseA = await prisma.course.create({ data: { departmentId: deptA.id, name: `Course A ${stamp}`, code: `CA${stamp.slice(0, 8)}` } });
      const courseB = await prisma.course.create({ data: { departmentId: deptB.id, name: `Course B ${stamp}`, code: `CB${stamp.slice(0, 8)}` } });

      await req('PATCH', `/admin/users/${a.id}/enrollment`, adminToken, { courseId: courseA.id });
      await req('PATCH', `/admin/users/${b.id}/enrollment`, adminToken, { courseId: courseB.id });

      const resCourse = await prisma.academicResource.create({
        data: {
          title: `Course Resource ${stamp}`,
          fileUrl: `https://example.com/res-${stamp}.pdf`,
          fileType: 'PDF',
          category: 'SYLLABUS',
          courseId: courseA.id,
          departmentId: deptA.id,
          uploadedByUserId: adminUser.id,
        },
      });

      const resDept = await prisma.academicResource.create({
        data: {
          title: `Dept Resource ${stamp}`,
          fileUrl: `https://example.com/dept-${stamp}.pdf`,
          fileType: 'PDF',
          category: 'SYLLABUS',
          departmentId: deptA.id,
          uploadedByUserId: adminUser.id,
        },
      });

      try {
        const feedA = await req('GET', '/content/resources', a.token);
        assert.equal(feedA.status, 200);
        const itemsA = (await feedA.json() as any).data;
        assert(itemsA.some((r: any) => r.id === resCourse.id));
        assert(itemsA.some((r: any) => r.id === resDept.id));

        const feedB = await req('GET', '/content/resources', b.token);
        assert.equal(feedB.status, 200);
        const itemsB = (await feedB.json() as any).data;
        assert(!itemsB.some((r: any) => r.id === resCourse.id), 'Unrelated student must not see course resource');
        assert(!itemsB.some((r: any) => r.id === resDept.id), 'Unrelated student must not see dept resource');

        await req('PATCH', `/admin/users/${a.id}/enrollment`, adminToken, { courseId: null });

        const delCourseRes = await req('DELETE', `/admin/academics/courses/${courseA.id}`, adminToken);
        assert.equal(delCourseRes.status, 409, 'Deleting course with targeted resource must be rejected with 409');
        await assert.rejects(
          adminAcademicService.deleteCourse(adminUser.id, courseA.id),
          (err: any) => err.statusCode === 409 && err.message.includes('targeted academic resource'),
          'Service call must reject with 409 and descriptive message'
        );

        const courseCheck = await prisma.course.findUnique({ where: { id: courseA.id } });
        assert.notEqual(courseCheck, null, 'Course must not be deleted');
        const resCourseCheck = await prisma.academicResource.findUniqueOrThrow({ where: { id: resCourse.id } });
        assert.equal(resCourseCheck.courseId, courseA.id, 'Resource courseId must not be set to null');

        const feedBAfterCourse = await req('GET', '/content/resources', b.token);
        const itemsBAfterCourse = (await feedBAfterCourse.json() as any).data;
        assert(!itemsBAfterCourse.some((r: any) => r.id === resCourse.id), 'Unrelated student must not see resource after failed course deletion');

        // Delete resCourse and delete courseA cleanly
        await prisma.academicResource.delete({ where: { id: resCourse.id } });
        const delCourseSuccess = await req('DELETE', `/admin/academics/courses/${courseA.id}`, adminToken);
        assert.equal(delCourseSuccess.status, 200, 'Deleting course after its resource is removed must succeed');

        // Now deptA has 0 courses, but has resDept targeted to it. Deleting deptA MUST FAIL with 409
        const delDeptRes = await req('DELETE', `/admin/academics/departments/${deptA.id}`, adminToken);
        assert.equal(delDeptRes.status, 409, 'Deleting department with targeted resource must be rejected with 409');
        await assert.rejects(
          adminAcademicService.deleteDepartment(adminUser.id, deptA.id),
          (err: any) => err.statusCode === 409 && err.message.includes('targeted academic resource'),
          'Service call must reject with 409 and descriptive message'
        );

        const deptCheck = await prisma.department.findUnique({ where: { id: deptA.id } });
        assert.notEqual(deptCheck, null, 'Department must not be deleted');
        const resDeptCheck = await prisma.academicResource.findUniqueOrThrow({ where: { id: resDept.id } });
        assert.equal(resDeptCheck.departmentId, deptA.id, 'Resource departmentId must not be set to null');

        const feedBAfterDept = await req('GET', '/content/resources', b.token);
        const itemsBAfterDept = (await feedBAfterDept.json() as any).data;
        assert(!itemsBAfterDept.some((r: any) => r.id === resDept.id), 'Unrelated student must not see resource after failed dept deletion');

        // Now delete resDept
        await prisma.academicResource.delete({ where: { id: resDept.id } });

        // Deleting deptA should now succeed
        const delDeptSuccess = await req('DELETE', `/admin/academics/departments/${deptA.id}`, adminToken);
        assert.equal(delDeptSuccess.status, 200, 'Deleting department after resource removal must succeed');
      } finally {
        await req('PATCH', `/admin/users/${a.id}/enrollment`, adminToken, { courseId: null }).catch(() => {});
        await req('PATCH', `/admin/users/${b.id}/enrollment`, adminToken, { courseId: null }).catch(() => {});
        await prisma.academicResource.deleteMany({ where: { id: { in: [resCourse.id, resDept.id] } } }).catch(() => {});
        await prisma.course.deleteMany({ where: { id: { in: [courseA.id, courseB.id] } } }).catch(() => {});
        await prisma.department.deleteMany({ where: { id: { in: [deptA.id, deptB.id] } } }).catch(() => {});
      }
    });
    await t.test('last active admin invariant is protected under competing concurrent status and role operations', async () => {
      const stamp = randomUUID();
      const login = await req('POST', '/auth/login', '', { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
      assert.equal(login.status, 200);
      const adminToken = (await login.json() as any).data.accessToken;

      const admin1 = await adminUserService.createAdmin(a.id, {
        email: `adm1_${stamp}@integrum.test`,
        password: 'AdminPassword123!',
        firstName: 'AdmOne',
        lastName: 'Test',
        permissionsLevel: 1,
      });
      const admin2 = await adminUserService.createAdmin(a.id, {
        email: `adm2_${stamp}@integrum.test`,
        password: 'AdminPassword123!',
        firstName: 'AdmTwo',
        lastName: 'Test',
        permissionsLevel: 1,
      });

      const login1 = await req('POST', '/auth/login', '', { email: `adm1_${stamp}@integrum.test`, password: 'AdminPassword123!' });
      assert.equal(login1.status, 200);
      const token1 = (await login1.json() as any).data.accessToken;

      const login2 = await req('POST', '/auth/login', '', { email: `adm2_${stamp}@integrum.test`, password: 'AdminPassword123!' });
      assert.equal(login2.status, 200);
      const token2 = (await login2.json() as any).data.accessToken;

      const seedAdmin = await prisma.user.findUniqueOrThrow({ where: { email: process.env.SEED_ADMIN_EMAIL! } });
      try {
        await prisma.user.update({ where: { id: seedAdmin.id }, data: { isActive: false } });

        const [res1, res2] = await Promise.all([
          req('PATCH', `/admin/users/${admin2.id}/status`, token1, { isActive: false }),
          req('PATCH', `/admin/users/${admin1.id}/status`, token2, { isActive: false }),
        ]);

        const statuses = [res1.status, res2.status].sort();
        assert.deepEqual(statuses, [200, 400], 'One deactivation must succeed with 200 and one must fail with 400');
        const remainingAfterDeact = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true, id: { in: [admin1.id, admin2.id] } },
        });
        assert.equal(remainingAfterDeact, 1, 'Exactly one admin must remain active; never zero');

        await prisma.user.updateMany({ where: { id: { in: [admin1.id, admin2.id] } }, data: { isActive: true, role: 'ADMIN' } });

        const [login1Demote, login2Demote] = await Promise.all([
          req('POST', '/auth/login', '', { email: `adm1_${stamp}@integrum.test`, password: 'AdminPassword123!' }),
          req('POST', '/auth/login', '', { email: `adm2_${stamp}@integrum.test`, password: 'AdminPassword123!' }),
        ]);
        assert.equal(login1Demote.status, 200);
        assert.equal(login2Demote.status, 200);
        const demoteToken1 = (await login1Demote.json() as any).data.accessToken;
        const demoteToken2 = (await login2Demote.json() as any).data.accessToken;

        const [demote1, demote2] = await Promise.all([
          req('PATCH', `/admin/users/${admin2.id}/role`, demoteToken1, { role: 'STUDENT' }),
          req('PATCH', `/admin/users/${admin1.id}/role`, demoteToken2, { role: 'STUDENT' }),
        ]);

        const demoteStatuses = [demote1.status, demote2.status].sort();
        assert.deepEqual(demoteStatuses, [200, 400], 'One demotion must succeed with 200 and one must fail with 400');
        const remainingAfterDemote = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true, id: { in: [admin1.id, admin2.id] } },
        });
        assert.equal(remainingAfterDemote, 1, 'Exactly one admin must remain active after competing demotions');

        await prisma.user.updateMany({ where: { id: { in: [admin1.id, admin2.id] } }, data: { isActive: true, role: 'ADMIN' } });

        const [login1Mixed, login2Mixed] = await Promise.all([
          req('POST', '/auth/login', '', { email: `adm1_${stamp}@integrum.test`, password: 'AdminPassword123!' }),
          req('POST', '/auth/login', '', { email: `adm2_${stamp}@integrum.test`, password: 'AdminPassword123!' }),
        ]);
        assert.equal(login1Mixed.status, 200);
        assert.equal(login2Mixed.status, 200);
        const mixedToken1 = (await login1Mixed.json() as any).data.accessToken;
        const mixedToken2 = (await login2Mixed.json() as any).data.accessToken;

        const [mixed1, mixed2] = await Promise.all([
          req('PATCH', `/admin/users/${admin2.id}/status`, mixedToken1, { isActive: false }),
          req('PATCH', `/admin/users/${admin1.id}/role`, mixedToken2, { role: 'STUDENT' }),
        ]);

        const mixedStatuses = [mixed1.status, mixed2.status].sort();
        assert.deepEqual(mixedStatuses, [200, 400], 'One operation must succeed with 200 and one must fail with 400 in mixed race');
        const remainingAfterMixed = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true, id: { in: [admin1.id, admin2.id] } },
        });
        assert.equal(remainingAfterMixed, 1, 'Exactly one admin must remain active after mixed race');
      } finally {
        await prisma.user.update({ where: { id: seedAdmin.id }, data: { isActive: true } }).catch(() => {});
        await prisma.adminAuditLog.deleteMany({ where: { targetId: { in: [admin1.id, admin2.id] } } }).catch(() => {});
        await prisma.adminProfile.deleteMany({ where: { userId: { in: [admin1.id, admin2.id] } } }).catch(() => {});
        await prisma.studentProfile.deleteMany({ where: { userId: { in: [admin1.id, admin2.id] } } }).catch(() => {});
        await prisma.authSession.deleteMany({ where: { userId: { in: [admin1.id, admin2.id] } } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: { in: [admin1.id, admin2.id] } } }).catch(() => {});
      }
    });
    await t.test('report filters consistently scope cohorts, dates and UTC trends', async () => {
      const stamp = randomUUID();
      const inside = new Date('2001-01-01T00:30:00Z'), outside = new Date('2000-12-31T23:30:00Z');
      const originalA = await prisma.user.findUniqueOrThrow({ where: { id: a.id } });
      const originalB = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });
      const dept1 = await prisma.department.create({ data: { name: `Reports one ${stamp}`, code: `R1${stamp}` } });
      const dept2 = await prisma.department.create({ data: { name: `Reports two ${stamp}`, code: `R2${stamp}` } });
      const c1 = await prisma.course.create({ data: { departmentId: dept1.id, name: 'First', code: `C1${stamp}` } });
      const c2 = await prisma.course.create({ data: { departmentId: dept2.id, name: 'Second', code: `C2${stamp}` } });
      const target = await prisma.subject.create({ data: { semesterId: sem.id, name: 'Report activity', totalClasses: 2, attendedClasses: 1 } });
      const manual = await prisma.subject.create({ data: { semesterId: sem.id, name: 'Report manual', totalClasses: 10, attendedClasses: 8 } });
      const query = { departmentId: dept1.id, courseId: c1.id, startDate: inside.toISOString(), endDate: inside.toISOString() };
      try {
        await prisma.studentProfile.update({ where: { id: a.profileId }, data: { courseId: c1.id } });
        await prisma.studentProfile.update({ where: { id: b.profileId }, data: { courseId: c2.id } });
        await prisma.user.update({ where: { id: a.id }, data: { createdAt: inside } });
        await prisma.user.update({ where: { id: b.id }, data: { createdAt: outside } });
        await prisma.attendanceRecord.createMany({ data: [
          { subjectId: target.id, date: inside, status: 'PRESENT' },
          { subjectId: target.id, date: outside, status: 'ABSENT' },
        ] });
        await prisma.assignment.createMany({ data: [
          { subjectId: target.id, title: stamp, createdAt: inside, dueDate: inside, status: 'SUBMITTED' },
          { subjectId: target.id, title: stamp, createdAt: outside, dueDate: inside, status: 'PENDING' },
        ] });
        await prisma.aIExecutionLog.createMany({ data: [
          { studentProfileId: a.profileId, module: 'NOTES', operation: stamp, startedAt: inside, status: 'SUCCESS' },
          { studentProfileId: a.profileId, module: 'NOTES', operation: stamp, startedAt: outside, status: 'FAILED' },
          { studentProfileId: b.profileId, module: 'NOTES', operation: stamp, startedAt: inside, status: 'FAILED' },
        ] });
        await prisma.jobApplication.createMany({ data: [
          { studentProfileId: a.profileId, companyName: stamp, role: 'Intern', createdAt: inside, appliedDate: outside, status: 'OFFERED' },
          { studentProfileId: a.profileId, companyName: stamp, role: 'Intern', createdAt: outside },
          { studentProfileId: b.profileId, companyName: stamp, role: 'Intern', createdAt: inside },
        ] });
        const users = await adminReportService.getUserReport(query);
        assert.equal(users.summary.totalUsers, 1); assert.equal(users.summary.students, 1); assert.equal(users.summary.admins, 0);
        assert.deepEqual(users.registrations, [{ period: '2001-01-01', count: 1 }]);
        assert.deepEqual(users.studentsByCourse.map(c => [c.courseId, c.count]), [[c1.id, 1]]);
        assert.deepEqual(users.studentsByDepartment.map(d => [d.departmentId, d.count]), [[dept1.id, 1]]);
        assert.equal(users.unassignedStudents, 0);
        const noUsers = await adminReportService.getUserReport({ ...query, startDate: '2002-01-01T00:00:00Z', endDate: '2002-12-31T00:00:00Z' });
        assert.equal(noUsers.summary.totalUsers, 0); assert.equal(noUsers.studentsByCourse[0]!.count, 0);
        const academics = await adminReportService.getAcademicReport(query);
        assert.equal(academics.overview.totalStudentSubjects, 1);
        assert.equal(academics.overview.totalAttendanceRecords, 1);
        assert.equal(academics.overview.averageAttendancePercentage, 100);
        assert.equal(academics.overview.totalAssignments, 1); assert.equal(academics.overview.submittedAssignments, 1);
        assert.equal(academics.overview.unassignedStudents, 0);
        assert.equal(academics.dateScope.subjectsWithExcludedManualTotals, 1);
        assert.equal(academics.byCourse[0]!.averageAttendance, 100);
        const usage = await adminReportService.getUsageReport(query);
        assert.equal(usage.ai.totalExecutions, 1); assert.equal(usage.ai.successRate, 100);
        assert.equal(usage.career.totalApplications, 1); assert.equal(usage.career.offered, 1);
        assert.deepEqual(usage.career.applicationsByMonth, [{ month: '2001-01', count: 1 }]);
        for (const report of ['getUserReport', 'getAcademicReport', 'getUsageReport'] as const) {
          await assert.rejects(adminReportService[report]({ departmentId: dept2.id, courseId: c1.id }), (e: any) => e.statusCode === 400);
          await assert.rejects(adminReportService[report]({ courseId: randomUUID() }), (e: any) => e.statusCode === 404);
        }
        const deptUsage = await adminReportService.getUsageReport({ departmentId: dept2.id });
        assert.equal(deptUsage.ai.totalExecutions, 1); assert.equal(deptUsage.career.totalApplications, 1);
      } finally {
        await prisma.aIExecutionLog.deleteMany({ where: { operation: stamp } });
        await prisma.jobApplication.deleteMany({ where: { companyName: stamp } });
        await prisma.subject.deleteMany({ where: { id: { in: [target.id, manual.id] } } });
        await prisma.studentProfile.updateMany({ where: { id: { in: [a.profileId, b.profileId] } }, data: { courseId: null } });
        await prisma.user.update({ where: { id: a.id }, data: { createdAt: originalA.createdAt } });
        await prisma.user.update({ where: { id: b.id }, data: { createdAt: originalB.createdAt } });
        await prisma.course.deleteMany({ where: { id: { in: [c1.id, c2.id] } } });
        await prisma.department.deleteMany({ where: { id: { in: [dept1.id, dept2.id] } } });
      }
    });
    await t.test('attendance totals, mode conflicts, ownership and concurrent writes', async () => {
      const target = await create('/subjects', a.token, { semesterId: sem.id, name: 'Attendance integrity' });
      const route = `/subjects/${target.id}`;
      const recordBody = { subjectId: target.id, date: '2026-09-20T10:00:00Z', status: 'PRESENT' };
      async function totals(total: number, attended: number) {
        const row = await prisma.subject.findUniqueOrThrow({ where: { id: target.id } });
        assert.equal(row.totalClasses, total); assert.equal(row.attendedClasses, attended);
      }
      try {
        assert.equal((await req('POST', '/subjects', a.token, { semesterId: sem.id, name: 'Invalid attendance', attendedClasses: 1 })).status, 400);
        assert.equal((await req('PATCH', route, a.token, { totalClasses: 5, attendedClasses: 3 })).status, 200);
        assert.equal((await req('PATCH', route, a.token, { totalClasses: 2 })).status, 400);
        assert.equal((await req('PATCH', route, a.token, { attendedClasses: 6 })).status, 400);
        assert.equal((await req('POST', '/attendance', a.token, recordBody)).status, 409);
        await totals(5, 3);
        assert.equal(await prisma.attendanceRecord.count({ where: { subjectId: target.id } }), 0);
        assert.equal((await req('PATCH', route, a.token, { totalClasses: 0, attendedClasses: 0 })).status, 200);
        const records = await Promise.all(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => create('/attendance', a.token, { ...recordBody, status })));
        await totals(4, 2);
        assert.equal((await req('PATCH', route, a.token, { attendedClasses: 4 })).status, 409);
        assert.equal((await req('PATCH', route, a.token, { attendanceGoal: 80 })).status, 200);
        assert.equal((await req('POST', '/attendance', b.token, recordBody)).status, 404);
        for (const method of ['PATCH', 'DELETE']) {
          assert.equal((await req(method, `/attendance/${records[0].id}`, b.token, method === 'PATCH' ? { status: 'ABSENT' } : undefined)).status, 404);
        }
        const changed = await Promise.all([
          req('PATCH', `/attendance/${records[1].id}`, a.token, { status: 'PRESENT' }),
          req('DELETE', `/attendance/${records[0].id}`, a.token),
        ]);
        assert.equal(changed[0]!.status, 200); assert.equal(changed[1]!.status, 204);
        await totals(3, 2);
        for (const record of records.slice(1)) assert.equal((await req('DELETE', `/attendance/${record.id}`, a.token)).status, 204);
        await totals(0, 0);
        assert.equal((await req('PATCH', route, a.token, { totalClasses: 2, attendedClasses: 1 })).status, 200);
        await totals(2, 1);
      } finally { await prisma.subject.delete({ where: { id: target.id } }); }
    });
    await t.test('attendance create, update and delete roll back when aggregate persistence fails', async () => {
      const target = await create('/subjects', a.token, { semesterId: sem.id, name: 'Attendance rollback' });
      const body = { subjectId: target.id, date: '2026-09-20T10:00:00Z', status: 'PRESENT' };
      const record = await create('/attendance', a.token, body);
      // Test-only fault injection on this disposable database and this UUID fixture.
      assert.match(target.id, /^[0-9a-f-]{36}$/);
      await prisma.$executeRawUnsafe(`CREATE FUNCTION closure_attendance_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected attendance persistence failure'; END $$`);
      try {
        await prisma.$executeRawUnsafe(`CREATE TRIGGER closure_attendance_failure BEFORE UPDATE ON "Subject" FOR EACH ROW WHEN (OLD.id = '${target.id}') EXECUTE FUNCTION closure_attendance_failure()`);
        assert.equal((await req('POST', '/attendance', a.token, body)).status, 500);
        assert.equal((await req('PATCH', `/attendance/${record.id}`, a.token, { status: 'ABSENT' })).status, 500);
        assert.equal((await req('DELETE', `/attendance/${record.id}`, a.token)).status, 500);
        const rows = await prisma.attendanceRecord.findMany({ where: { subjectId: target.id } });
        assert.equal(rows.length, 1); assert.equal(rows[0]!.status, 'PRESENT'); assert.equal(rows[0]!.id, record.id);
        const row = await prisma.subject.findUniqueOrThrow({ where: { id: target.id } });
        assert.equal(row.totalClasses, 1); assert.equal(row.attendedClasses, 1);
      } finally {
        await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS closure_attendance_failure ON "Subject"');
        await prisma.$executeRawUnsafe('DROP FUNCTION closure_attendance_failure()');
        await prisma.subject.delete({ where: { id: target.id } });
      }
    });
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
    await t.test('expanded study-plan response and invalid provider output', async () => {
      const body = { topic: 'Database normalization', goals: 'Practice dependency analysis' };
      assert.equal((await req('POST', '/ai/study-plan', '', body)).status, 401);
      const response = await req('POST', '/ai/study-plan', a.token, body);
      assert.equal(response.status, 201);
      const plan = (await response.json() as any).data;
      assert(generatedStudyPlanOutputSchema.safeParse(plan).success);
      assert.equal(plan.weeklySchedule[0].topic, body.topic);
      assert.equal(plan.goalRecommendations[0], body.goals);
      assert(plan.suggestedTasks.length > 0 && plan.title && plan.overview && plan.recommendedTargetDate);
      const original = MockProvider.prototype.generateStudyPlan;
      // Deliberately violate the provider contract to exercise the real API boundary.
      MockProvider.prototype.generateStudyPlan = async () => ({ ...plan, weeklySchedule: [{ ...plan.weeklySchedule[0], durationMinutes: -1 }] });
      try {
        const failed = await req('POST', '/ai/study-plan', a.token, body);
        assert.equal(failed.status, 500);
        const failure = await prisma.aIExecutionLog.findFirst({
          where: { studentProfileId: a.profileId, module: 'STUDY_PLAN', status: 'FAILED' },
          orderBy: { startedAt: 'desc' },
        });
        assert.equal(failure?.errorMessage, 'AI generated invalid structure');
      } finally { MockProvider.prototype.generateStudyPlan = original; }
      for (const key of ['weeklySchedule', 'revisionPlan', 'topicPriorities', 'goalRecommendations']) {
        const incomplete = { ...plan }; delete incomplete[key];
        assert.equal(generatedStudyPlanOutputSchema.safeParse(incomplete).success, false);
        assert.equal(generatedStudyPlanOutputSchema.safeParse({ ...plan, [key]: [] }).success, false);
      }
      assert.equal(generatedStudyPlanOutputSchema.safeParse({ ...plan,
        topicPriorities: [{ topic: 'SQL', priority: 'URGENT', reason: 'Test' }] }).success, false);
      assert.equal(generatedStudyPlanOutputSchema.safeParse({ ...plan,
        goalRecommendations: ['   '] }).success, false);
    });
    await t.test('refresh rotation, logout and password reset revoke sessions', async () => {
      const account = await student('Sessions');
      const credentials = { email: `${prefix}_Sessions@integrum.test`, password: 'ClosurePass123!' };
      const first = await authService.login(credentials);
      const rotated = await authService.refresh(first.refreshToken);
      assert.notEqual(rotated.refreshToken, first.refreshToken);
      await assert.rejects(authService.refresh(first.refreshToken), { statusCode: 401 });
      const parallel = await Promise.allSettled([
        authService.refresh(rotated.refreshToken), authService.refresh(rotated.refreshToken),
      ]);
      assert.equal(parallel.filter(r => r.status === 'fulfilled').length, 1);
      const winner = parallel.find(r => r.status === 'fulfilled');
      assert(winner?.status === 'fulfilled');
      assert.equal((await req('POST', '/auth/logout', winner.value.accessToken)).status, 200);
      assert.equal((await req('GET', '/users/me', winner.value.accessToken)).status, 401);
      await assert.rejects(authService.refresh(winner.value.refreshToken), { statusCode: 401 });
      const second = await authService.login(credentials);
      const resetToken = randomUUID();
      await prisma.user.update({ where: { id: account.id }, data: {
        passwordResetTokenHash: createHash('sha256').update(resetToken).digest('hex'),
        passwordResetExpires: new Date(Date.now() + 60000),
      } });
      await authService.resetPassword(resetToken, 'NewClosurePass456!');
      assert.equal((await req('GET', '/users/me', second.accessToken)).status, 401);
      assert.equal((await req('GET', '/users/me', account.token)).status, 401);
      await assert.rejects(authService.refresh(second.refreshToken), { statusCode: 401 });
      await assert.rejects(authService.resetPassword(resetToken, 'ThirdPassword789!'), { statusCode: 400 });
      await assert.rejects(authService.login(credentials), { statusCode: 401 });
      const fresh = await authService.login({ ...credentials, password: 'NewClosurePass456!' });
      assert.equal((await req('GET', '/users/me', fresh.accessToken)).status, 200);
      const admin = await prisma.user.findUniqueOrThrow({ where: { email: process.env.SEED_ADMIN_EMAIL! } });
      await adminUserService.updateUserStatus(admin.id, account.id, { isActive: false });
      assert.equal((await req('GET', '/users/me', fresh.accessToken)).status, 403);
      await adminUserService.updateUserStatus(admin.id, account.id, { isActive: true });
      assert.equal((await req('GET', '/users/me', fresh.accessToken)).status, 401);
      await assert.rejects(authService.refresh(fresh.refreshToken), { statusCode: 401 });
      await prisma.adminAuditLog.deleteMany({ where: { targetId: account.id } });
    });
    await t.test('email outage recovery and verification/reset tokens', async () => {
      const original = emailService.send;
      let deliveredBody = '';
      try {
        emailService.send = async () => { throw new Error('Simulated provider outage'); };
        const account = await student('EmailOutage');
        assert.equal(account.verificationEmailSent, false);
        const known = await authService.forgotPassword(`${prefix}_EmailOutage@integrum.test`);
        const unknown = await authService.forgotPassword(`${prefix}_Absent@integrum.test`);
        assert.deepEqual(known, unknown);
        assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: account.id } })).passwordResetTokenHash, null);
        emailService.send = async (_to, _subject, body) => { deliveredBody = body; };
        await authService.resendVerificationEmail(account.id);
        const verificationToken = deliveredBody.match(/[a-f0-9]{64}/)?.[0];
        assert(verificationToken);
        await authService.verifyEmail(verificationToken);
        assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: account.id } })).isVerified, true);
        await authService.forgotPassword(`${prefix}_EmailOutage@integrum.test`);
        const resetToken = deliveredBody.match(/[a-f0-9]{64}/)?.[0];
        assert(resetToken);
        await authService.resetPassword(resetToken, 'RecoveredPassword456!');
        const loggedIn = await authService.login({ email: `${prefix}_EmailOutage@integrum.test`, password: 'RecoveredPassword456!' });
        assert(loggedIn.accessToken);
      } finally { emailService.send = original; }
    });
    await t.test('cascade cleanup queue, rollback, provider failure and retry', async () => {
      const local = new LocalStorageProvider();
      const owner = await student('StorageCascade');
      async function fixture() {
        const semester = await create('/semesters', owner.token, { name: 'Cleanup', startDate: '2026-09-01T00:00:00Z', endDate: '2026-12-31T00:00:00Z' });
        const subject = await create('/subjects', owner.token, { semesterId: semester.id, name: 'Cleanup' });
        const note = await create('/notes', owner.token, { subjectId: subject.id, title: 'Cleanup file' });
        const result = await upload(`/notes/${note.id}/upload`, owner.token);
        assert.equal(result.status, 200);
        return { semester, subject, note, fileId: (await result.json() as any).data.fileId as string };
      }
      const first = await fixture();
      await assert.rejects(prisma.$transaction(async tx => {
        await tx.subject.delete({ where: { id: first.subject.id } });
        throw new Error('Rollback fixture');
      }), /Rollback fixture/);
      assert.equal(await prisma.storageCleanup.count({ where: { fileId: first.fileId } }), 0);
      assert.deepEqual(await readFile(local.getLocalPath(first.fileId)), pdf);
      await prisma.subject.delete({ where: { id: first.subject.id } });
      assert.equal((await prisma.storageCleanup.findUniqueOrThrow({ where: { fileId: first.fileId } })).provider, 'local');
      const originalDelete = local.delete;
      local.delete = async () => { throw new Error('Storage offline'); };
      assert.equal(await processCleanup(first.fileId, local, 'local'), false);
      assert.equal((await prisma.storageCleanup.findUniqueOrThrow({ where: { fileId: first.fileId } })).attempts, 1);
      local.delete = originalDelete;
      await retryStorageCleanup();
      await assert.rejects(readFile(local.getLocalPath(first.fileId)), { code: 'ENOENT' });
      const second = await fixture();
      await prisma.semester.delete({ where: { id: second.semester.id } });
      await retryStorageCleanup();
      await assert.rejects(readFile(local.getLocalPath(second.fileId)), { code: 'ENOENT' });
      const third = await fixture();
      const resumeUpload = await upload('/users/me/resume-upload', owner.token);
      assert.equal(resumeUpload.status, 200);
      const resumeFile = (await resumeUpload.json() as any).data.fileId as string;
      await prisma.user.delete({ where: { id: owner.id } });
      users.splice(users.indexOf(owner), 1);
      assert.equal(await prisma.storageCleanup.count({ where: { fileId: { in: [third.fileId, resumeFile] } } }), 2);
      await retryStorageCleanup();
      for (const file of [third.fileId, resumeFile]) await assert.rejects(readFile(local.getLocalPath(file)), { code: 'ENOENT' });
      const legacyId = `notes/legacy-${randomUUID()}.pdf`;
      await local.upload(legacyId, pdf, 'application/pdf');
      await prisma.storageCleanup.create({ data: { fileId: legacyId, provider: 'unknown' } });
      await retryStorageCleanup();
      assert.deepEqual(await readFile(local.getLocalPath(legacyId)), pdf);
      await local.delete(legacyId);
      await prisma.storageCleanup.delete({ where: { fileId: legacyId } });
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
    await t.test('note upload format validation accepts valid formats and rejects renamed invalid files and generic CFB', async () => {
      function createZip(files: Array<{ name: string; content?: string }>) {
        const parts: Buffer[] = [];
        const cdParts: Buffer[] = [];
        let offset = 0;
        for (const { name, content } of files) {
          const nameBuf = Buffer.from(name, 'utf8');
          const contentBuf = Buffer.from(content || '', 'utf8');
          const header = Buffer.alloc(30);
          header.writeUInt32LE(0x04034b50, 0);
          header.writeUInt16LE(20, 4);
          header.writeUInt16LE(0, 6);
          header.writeUInt16LE(0, 8);
          header.writeUInt16LE(0, 10);
          header.writeUInt16LE(0, 12);
          header.writeUInt32LE(0, 14);
          header.writeUInt32LE(contentBuf.length, 18);
          header.writeUInt32LE(contentBuf.length, 22);
          header.writeUInt16LE(nameBuf.length, 26);
          header.writeUInt16LE(0, 28);
          parts.push(header, nameBuf, contentBuf);

          const cd = Buffer.alloc(46);
          cd.writeUInt32LE(0x02014b50, 0);
          cd.writeUInt16LE(20, 4);
          cd.writeUInt16LE(20, 6);
          cd.writeUInt16LE(0, 8);
          cd.writeUInt16LE(0, 10);
          cd.writeUInt16LE(0, 12);
          cd.writeUInt16LE(0, 14);
          cd.writeUInt32LE(0, 16);
          cd.writeUInt32LE(contentBuf.length, 20);
          cd.writeUInt32LE(contentBuf.length, 24);
          cd.writeUInt16LE(nameBuf.length, 28);
          cd.writeUInt16LE(0, 30);
          cd.writeUInt16LE(0, 32);
          cd.writeUInt16LE(0, 34);
          cd.writeUInt16LE(0, 36);
          cd.writeUInt32LE(0, 38);
          cd.writeUInt32LE(offset, 42);
          cdParts.push(cd, nameBuf);

          offset += header.length + nameBuf.length + contentBuf.length;
        }
        const cdOffset = offset;
        const cdBuf = Buffer.concat(cdParts);
        const eocd = Buffer.alloc(22);
        eocd.writeUInt32LE(0x06054b50, 0);
        eocd.writeUInt16LE(0, 4);
        eocd.writeUInt16LE(0, 6);
        eocd.writeUInt16LE(files.length, 8);
        eocd.writeUInt16LE(files.length, 10);
        eocd.writeUInt32LE(cdBuf.length, 12);
        eocd.writeUInt32LE(cdOffset, 16);
        eocd.writeUInt16LE(0, 20);
        return Buffer.concat([...parts, cdBuf, eocd]);
      }

      const validDocx = createZip([
        { name: '[Content_Types].xml', content: '<?xml version="1.0"?><Types><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
        { name: 'word/document.xml', content: '<w:document/>' },
      ]);
      const validPptx = createZip([
        { name: '[Content_Types].xml', content: '<?xml version="1.0"?><Types><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>' },
        { name: 'ppt/presentation.xml', content: '<p:presentation/>' },
      ]);
      const genericZip = createZip([
        { name: 'sample.txt', content: 'generic zip file content' },
      ]);
      const validPpt = Buffer.concat([
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        Buffer.alloc(100),
        Buffer.from('PowerPoint Document', 'utf16le'),
        Buffer.alloc(100),
      ]);
      const genericCfb = Buffer.concat([
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        Buffer.alloc(504),
      ]);

      const testNote = await create('/notes', a.token, { subjectId: subject.id, title: 'Format validation document' });
      try {
        // Valid formats accepted
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, validDocx, 'lecture.docx')).status, 200);
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, validPptx, 'slides.pptx')).status, 200);
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, validPpt, 'legacy.ppt')).status, 200);
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, pdf, 'doc.pdf')).status, 200);

        // Generic CFB without PowerPoint stream must be rejected with 400
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, genericCfb, 'fake.ppt')).status, 400);

        // Generic zip renamed to docx/pptx must be rejected with 400
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, genericZip, 'fake.docx')).status, 400);
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, genericZip, 'fake.pptx')).status, 400);

        // Mismatched extension/MIME (PDF content named docx) must be rejected with 400
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, pdf, 'fake.docx')).status, 400);

        // Plain text named pdf must be rejected with 400
        assert.equal((await upload(`/notes/${testNote.id}/upload`, a.token, Buffer.from('hello world plain text'), 'fake.pdf')).status, 400);
      } finally {
        await prisma.note.delete({ where: { id: testNote.id } }).catch(() => {});
      }
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

test('Gemini study-plan adapter preserves the expanded contract without network', async t => {
  const context = { topic: 'SQL', goals: 'Practice joins', attendancePercentage: 75, subjects: [] };
  const expected = await new MockProvider().generateStudyPlan(context);
  const savedKey = env.GEMINI_API_KEY;
  let prompt = '';
  t.mock.method(GoogleGenerativeAI.prototype, 'getGenerativeModel', (params: Parameters<GoogleGenerativeAI['getGenerativeModel']>[0]) => {
    const schema = params.generationConfig?.responseSchema;
    assert(schema && 'required' in schema);
    for (const key of ['weeklySchedule', 'revisionPlan', 'topicPriorities', 'goalRecommendations']) {
      assert(schema.required?.includes(key));
    }
    return { generateContent: async (value: string) => {
      prompt = value;
      return { response: { text: () => JSON.stringify(expected) } };
    } };
  });
  try {
    env.GEMINI_API_KEY = 'test-only-not-a-real-key';
    const result = await new GeminiProvider().generateStudyPlan(context);
    assert.deepEqual(generatedStudyPlanOutputSchema.parse(result), generatedStudyPlanOutputSchema.parse(expected));
    assert(prompt.includes(context.topic) && prompt.includes(context.goals));
  } finally { env.GEMINI_API_KEY = savedKey; }
});

test('health fails when the database is unavailable and production email never logs tokens', async t => {

  const originalQuery = prisma.$queryRaw;
  const oldMode = env.NODE_ENV;
  const oldEmail = env.EMAIL_PROVIDER;
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    prisma.$queryRaw = () => { throw new Error('Injected database failure'); };
    const response = await fetch(`http://127.0.0.1:${(server.address() as any).port}/api/v1/health`);
    assert.equal(response.status, 503);
    env.NODE_ENV = 'production'; env.EMAIL_PROVIDER = 'console';
    const log = t.mock.method(console, 'log', () => {});
    await assert.rejects(emailService.send('test@example.com', 'Verification', 'sensitive-token'), { statusCode: 500 });
    assert.equal(log.mock.callCount(), 0);
  } finally {
    prisma.$queryRaw = originalQuery; env.NODE_ENV = oldMode; env.EMAIL_PROVIDER = oldEmail;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('Resend adapter request and failure sanitization without real delivery', async t => {
  const previous = { provider: env.EMAIL_PROVIDER, key: env.RESEND_API_KEY, from: env.EMAIL_FROM };
  env.EMAIL_PROVIDER = 'resend'; env.RESEND_API_KEY = 'test-key'; env.EMAIL_FROM = 'sender@example.com';
  let status = 200;
  let result: unknown = { id: 'test-message-id' };
  let networkFailure = false;
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body as string), {
      from: 'sender@example.com', to: ['recipient@example.com'], subject: 'Verify', text: 'private-token',
    });
    if (networkFailure) throw new Error('private-provider-detail');
    return new Response(JSON.stringify(result), { status });
  });
  try {
    await emailService.send('recipient@example.com', 'Verify', 'private-token');
    for (const code of [401, 429, 500]) {
      status = code;
      await assert.rejects(emailService.send('recipient@example.com', 'Verify', 'private-token'), {
        statusCode: 503, message: 'Email delivery is temporarily unavailable',
      });
    }
    status = 200; result = {};
    await assert.rejects(emailService.send('recipient@example.com', 'Verify', 'private-token'), { statusCode: 503 });
    networkFailure = true;
    await assert.rejects(emailService.send('recipient@example.com', 'Verify', 'private-token'), {
      statusCode: 503, message: 'Email delivery is temporarily unavailable',
    });
  } finally {
    env.EMAIL_PROVIDER = previous.provider; env.RESEND_API_KEY = previous.key; env.EMAIL_FROM = previous.from;
  }
});

test('Supabase storage provider request and failure sanitization without real bucket', async () => {
  const oldUrl = env.SUPABASE_URL, oldKey = env.SUPABASE_SERVICE_KEY;
  env.SUPABASE_URL = 'https://supabase.example.com'; env.SUPABASE_SERVICE_KEY = 'secret-service-key-12345';
  try {
    const { SupabaseStorageProvider } = await import('../src/services/storage/supabase.storage.js');
    const provider = new SupabaseStorageProvider();
    const client = (provider as any).storageClient;

    client.from = () => ({
      upload: async () => ({ error: { message: 'upstream supabase error with https://supabase.example.com and secret-service-key-12345' } }),
      createSignedUrl: async () => ({ error: { message: 'upstream signed-url error with secret token' }, data: null }),
      remove: async () => ({ error: { message: 'upstream delete error' } }),
    });

    await assert.rejects(provider.upload('notes/test.pdf', Buffer.from('test'), 'application/pdf'), (err: any) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.message, 'Storage service is temporarily unavailable');
      assert(!JSON.stringify(err).includes('secret-service-key'));
      assert(!JSON.stringify(err).includes('supabase.example.com'));
      return true;
    });

    await assert.rejects(provider.getSignedUrl('notes/test.pdf', 60), (err: any) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.message, 'Storage service is temporarily unavailable');
      assert(!JSON.stringify(err).includes('secret token'));
      return true;
    });

    await assert.rejects(provider.delete('notes/test.pdf'), (err: any) => {
      assert.equal(err.statusCode, 503);
      assert.equal(err.message, 'Storage service is temporarily unavailable');
      return true;
    });
  } finally {
    env.SUPABASE_URL = oldUrl; env.SUPABASE_SERVICE_KEY = oldKey;
  }
});
