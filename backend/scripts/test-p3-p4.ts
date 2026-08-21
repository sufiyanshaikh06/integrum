/**
 * P3 Career Hub + P4 Productivity Verification Tests
 * C-1: Resume Templates, C-2: PDF Export, C-3: Certifications,
 * C-4: Personal Projects, C-5: Interview Schedule, C-6: Offer Details
 * P4: Certification renewal reminders verification
 */

import 'dotenv/config';

const BASE = 'http://localhost:5000/api/v1';
let accessToken = '';
let token2 = '';
const email = `test_career_${Date.now()}@integrum.dev`;
const email2 = `test_career2_${Date.now()}@integrum.dev`;
const password = 'TestPass123!';

let resumeId = '';
let certId = '';
let projectId = '';
let jobAppId = '';

// ─── Helpers ────────────────────────────────────────────────────
async function req(method: string, path: string, body?: any, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ─── Setup ───────────────────────────────────────────────────────
async function setup() {
  for (const [e, pw] of [[email, password], [email2, password]]) {
    await req('POST', '/auth/register', { email: e, password: pw, firstName: 'Career', lastName: 'Test' });
  }
  const l1 = await req('POST', '/auth/login', { email, password });
  const l2 = await req('POST', '/auth/login', { email: email2, password });
  accessToken = l1.json.data.accessToken;
  token2 = l2.json.data.accessToken;
  console.log('  ✅ Two students registered and logged in');
}

// ─── C-1: Resume Templates ───────────────────────────────────────
async function testC1ResumeTemplates() {
  console.log('\nC-1: Resume Templates...');

  // List templates (public-ish endpoint but still student-authenticated)
  const tplRes = await req('GET', '/resumes/templates', undefined, accessToken);
  assert(tplRes.status === 200, `Templates list failed: ${JSON.stringify(tplRes.json)}`);
  const templates: any[] = tplRes.json.data;
  assert(Array.isArray(templates) && templates.length >= 5, 'Expected at least 5 templates');
  assert(templates.some((t: any) => t.id === 'modern'), 'Expected modern template');
  console.log(`  ✅ ${templates.length} templates returned`);

  // Create resume with a specific template
  const res = await req('POST', '/resumes', {
    title: 'My Career Resume',
    content: { personalInfo: { name: 'Test User', email: email }, sections: [] },
    templateId: 'modern',
  }, accessToken);
  assert(res.status === 201, `Resume create failed: ${JSON.stringify(res.json)}`);
  resumeId = res.json.data.id;
  assert(res.json.data.versions[0].templateId === 'modern', 'templateId not stored');
  console.log('  ✅ Resume created with modern template');

  // Change template
  const upd = await req('PATCH', `/resumes/${resumeId}`, { templateId: 'minimal' }, accessToken);
  assert(upd.status === 200, `Template update failed: ${JSON.stringify(upd.json)}`);
  assert(upd.json.data.versions[0].templateId === 'minimal', 'templateId not updated');
  console.log('  ✅ Template switched to minimal — new version created');
}

// ─── C-2: PDF Export ────────────────────────────────────────────
async function testC2PdfExport() {
  console.log('\nC-2: Resume PDF Export...');

  const res = await req('GET', `/resumes/${resumeId}/pdf`, undefined, accessToken);
  assert(res.status === 200, `PDF export failed: ${JSON.stringify(res.json)}`);
  const data = res.json.data;
  assert(data.resumeId === resumeId, 'resumeId mismatch');
  assert(data.templateId === 'minimal', 'templateId not carried into PDF data');
  assert(data.content !== undefined, 'content missing from PDF data');
  assert(data.versionId !== undefined, 'versionId missing');
  assert(data.generatedAt !== undefined, 'generatedAt missing');
  console.log(`  ✅ PDF data returned (template: ${data.templateId}, versionId: ${data.versionId})`);

  // Cross-user access blocked
  const badRes = await req('GET', `/resumes/${resumeId}/pdf`, undefined, token2);
  assert(badRes.status === 404, `Cross-user PDF access should return 404, got ${badRes.status}`);
  console.log('  ✅ Cross-user PDF access: blocked with 404');
}

// ─── C-3: Certifications ────────────────────────────────────────
async function testC3Certifications() {
  console.log('\nC-3: Certifications...');

  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const create = await req('POST', '/certifications', {
    name: 'AWS Solutions Architect',
    issuer: 'Amazon Web Services',
    dateObtained: new Date().toISOString(),
    expiryDate: future,
    credentialId: 'AWS-SAA-001',
    credentialUrl: 'https://aws.amazon.com/verification',
  }, accessToken);
  assert(create.status === 201, `Cert create failed: ${JSON.stringify(create.json)}`);
  certId = create.json.data.id;
  assert(create.json.data.issuer === 'Amazon Web Services', 'issuer not stored');
  assert(create.json.data.expiryDate !== null, 'expiryDate not stored');
  console.log('  ✅ Certification created with expiry date');

  // Get all
  const all = await req('GET', '/certifications', undefined, accessToken);
  assert(all.status === 200, 'GET /certifications failed');
  assert(all.json.data.some((c: any) => c.id === certId), 'Cert not in list');
  console.log('  ✅ GET /certifications works');

  // Update
  const upd = await req('PATCH', `/certifications/${certId}`, { credentialId: 'AWS-SAA-002' }, accessToken);
  assert(upd.status === 200, `Cert update failed: ${JSON.stringify(upd.json)}`);
  assert(upd.json.data.credentialId === 'AWS-SAA-002', 'credentialId not updated');
  console.log('  ✅ Certification updated');

  // Cross-user blocked
  const bad = await req('GET', `/certifications/${certId}`, undefined, token2);
  assert(bad.status === 404, `Cross-user cert read should return 404, got ${bad.status}`);
  console.log('  ✅ Cross-user cert access: blocked with 404');
}

// ─── C-4: Personal Projects ─────────────────────────────────────
async function testC4Projects() {
  console.log('\nC-4: Personal Projects...');

  const create = await req('POST', '/projects', {
    title: 'Integrum Backend',
    description: 'Full-stack student productivity platform',
    technologies: ['Node.js', 'TypeScript', 'PostgreSQL', 'Prisma'],
    repoUrl: 'https://github.com/sufiyanshaikh06/integrum',
    isOngoing: true,
    startDate: new Date().toISOString(),
  }, accessToken);
  assert(create.status === 201, `Project create failed: ${JSON.stringify(create.json)}`);
  projectId = create.json.data.id;
  assert(Array.isArray(create.json.data.technologies), 'technologies should be array');
  assert(create.json.data.technologies.includes('TypeScript'), 'TypeScript not in technologies');
  assert(create.json.data.isOngoing === true, 'isOngoing not stored');
  console.log('  ✅ Project created with technologies array');

  // Get all
  const all = await req('GET', '/projects', undefined, accessToken);
  assert(all.status === 200, 'GET /projects failed');
  assert(all.json.data.some((p: any) => p.id === projectId), 'Project not in list');

  // Update
  const upd = await req('PATCH', `/projects/${projectId}`, {
    isOngoing: false,
    endDate: new Date().toISOString(),
  }, accessToken);
  assert(upd.status === 200, `Project update failed: ${JSON.stringify(upd.json)}`);
  assert(upd.json.data.isOngoing === false, 'isOngoing not updated');
  console.log('  ✅ Project updated (marked complete)');

  // Cross-user blocked
  const bad = await req('DELETE', `/projects/${projectId}`, undefined, token2);
  assert(bad.status === 404, `Cross-user project delete should return 404, got ${bad.status}`);
  console.log('  ✅ Cross-user project delete: blocked with 404');
}

// ─── C-5 + C-6: Job Application Interview + Offer ───────────────
async function testC5C6JobApplication() {
  console.log('\nC-5 + C-6: Interview Schedule + Offer Details...');

  const interviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create with interview fields
  const create = await req('POST', '/job-applications', {
    companyName: 'Google',
    role: 'Software Engineer',
    status: 'INTERVIEWING',
    appliedDate: new Date().toISOString(),
    interviewDate,
    interviewRound: 'Technical Round 1',
  }, accessToken);
  assert(create.status === 201, `Job app create failed: ${JSON.stringify(create.json)}`);
  jobAppId = create.json.data.id;
  assert(create.json.data.interviewDate !== null, 'interviewDate not stored');
  assert(create.json.data.interviewRound === 'Technical Round 1', 'interviewRound not stored');
  console.log('  ✅ Job application created with interview schedule');

  // Add offer details
  const offerUpdate = await req('PATCH', `/job-applications/${jobAppId}`, {
    status: 'OFFERED',
    interviewRound: 'Final',
    offerDetails: {
      salary: 120000,
      currency: 'USD',
      benefits: 'Health, Dental, 401k, Stock Options',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Negotiated sign-on bonus included',
    },
  }, accessToken);
  assert(offerUpdate.status === 200, `Offer update failed: ${JSON.stringify(offerUpdate.json)}`);
  assert(offerUpdate.json.data.offerDetails !== null, 'offerDetails not stored');
  assert((offerUpdate.json.data.offerDetails as any).salary === 120000, 'salary not stored');
  assert(offerUpdate.json.data.interviewRound === 'Final', 'interviewRound not updated');
  console.log('  ✅ Offer details stored (salary, currency, benefits, deadline)');

  // Cross-user blocked
  const bad = await req('GET', `/job-applications/${jobAppId}`, undefined, token2);
  assert(bad.status === 404, `Cross-user job app read should return 404, got ${bad.status}`);
  console.log('  ✅ Cross-user job app access: blocked with 404');
}

// ─── P4: Certification Renewal Reminder Verification ───────────
async function testP4CertificationRenewal() {
  console.log('\nP4: Certification Renewal Reminders verification...');

  // Create a cert expiring in 10 days
  const soonExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  await req('POST', '/certifications', {
    name: 'Google Cloud Professional',
    issuer: 'Google',
    expiryDate: soonExpiry,
  }, accessToken);

  // GET /certifications/expiring?days=30
  const expiring = await req('GET', '/certifications/expiring?days=30', undefined, accessToken);
  assert(expiring.status === 200, `Expiring certs failed: ${JSON.stringify(expiring.json)}`);
  const list: any[] = expiring.json.data;
  assert(Array.isArray(list), 'Expected array');
  assert(list.some((c: any) => c.name === 'Google Cloud Professional'), 'Soon-expiring cert not found');

  // The AWS cert (expiry 1 year from now) should NOT appear in 30-day window
  assert(!list.some((c: any) => c.credentialId === 'AWS-SAA-002'), 'Long-expiry cert should not appear in 30-day window');
  console.log(`  ✅ ${list.length} cert(s) expiring within 30 days (future certs correctly excluded from window)`);
  console.log('  ✅ P4 verified: Reminder system can use GET /certifications/expiring to surface renewal needs');
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 P3 Career Hub + P4 Productivity Tests');
  console.log('='.repeat(50));

  try {
    console.log('\nSetup...');
    await setup();
    await testC1ResumeTemplates();
    await testC2PdfExport();
    await testC3Certifications();
    await testC4Projects();
    await testC5C6JobApplication();
    await testP4CertificationRenewal();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All P3 + P4 tests passed!');
  } catch (err: any) {
    console.error('\n❌ Tests failed:', err.message);
    process.exit(1);
  }
}

main();
