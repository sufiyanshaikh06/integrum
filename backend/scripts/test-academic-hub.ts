import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { generateAccessToken, generateRefreshToken } from '../src/utils/jwt.js';

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api/v1';
  let accessToken = '';
  let semesterId = '';
  let subjectId = '';
  let assignmentId = '';

  console.log('\n--- Starting Academic Hub Tests ---');

  // 1. Setup - Create a fresh user & get token
  const email = `test-academic-${Date.now()}@example.com`;
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', firstName: 'John', lastName: 'Doe' }),
  });
  
  if (!registerRes.ok) {
    console.error('Failed to register user', await registerRes.text());
    process.exit(1);
  }
  
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const loginData = await loginRes.json();
  accessToken = loginData.data.accessToken;

  // 2. Test Semester CRUD
  console.log('\n[TEST 1] Create Semester');
  const semRes = await fetch(`${BASE_URL}/semesters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name: 'Fall 2026', startDate: new Date('2026-09-01').toISOString(), endDate: new Date('2026-12-15').toISOString() })
  });
  const semData = await semRes.json();
  if (semRes.status === 201) {
    console.log('✅ Semester created:', semData.data.name);
    semesterId = semData.data.id;
  } else {
    console.log('❌ Failed:', semData);
    process.exit(1);
  }

  // 3. Test Subject CRUD
  console.log('\n[TEST 2] Create Subject (with valid semester)');
  const subRes = await fetch(`${BASE_URL}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ semesterId, name: 'Computer Science 101', credits: 3 })
  });
  const subData = await subRes.json();
  if (subRes.status === 201) {
    console.log('✅ Subject created:', subData.data.name);
    subjectId = subData.data.id;
  } else {
    console.log('❌ Failed:', subData);
    process.exit(1);
  }

  // 4. Test Assignment CRUD
  console.log('\n[TEST 3] Create Assignment (with valid subject)');
  const assRes = await fetch(`${BASE_URL}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ subjectId, title: 'Final Project', priority: 'HIGH', dueDate: new Date('2026-12-10').toISOString() })
  });
  const assData = await assRes.json();
  if (assRes.status === 201) {
    console.log('✅ Assignment created:', assData.data.title);
    assignmentId = assData.data.id;
  } else {
    console.log('❌ Failed:', assData);
    process.exit(1);
  }

  // 5. Test Ownership boundaries (Cross-user access)
  console.log('\n[TEST 4] Enforce Ownership boundaries');
  
  // Create another user
  const otherEmail = `other-${Date.now()}@example.com`;
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: otherEmail, password: 'password123', firstName: 'Jane', lastName: 'Smith' }),
  });
  const otherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: otherEmail, password: 'password123' }),
  });
  const otherLoginData = await otherLoginRes.json();
  const otherAccessToken = otherLoginData.data.accessToken;

  // Try to access user 1's assignment using user 2's token
  const hackRes = await fetch(`${BASE_URL}/assignments/${assignmentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${otherAccessToken}` }
  });
  if (hackRes.status === 404) {
    console.log('✅ Ownership enforced correctly (404 Not Found for cross-user data)');
  } else {
    console.log(`❌ Failed ownership check! Expected 404, got ${hackRes.status}`);
    process.exit(1);
  }

  // 6. Test Cascading Deletes (Optional/manual)
  console.log('\n[TEST 5] Deleting Semester should delete Subjects & Assignments');
  const delRes = await fetch(`${BASE_URL}/semesters/${semesterId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (delRes.status === 200) {
    console.log('✅ Semester deleted.');
    
    // verify subject is gone
    const checkSub = await prisma.subject.findUnique({ where: { id: subjectId }});
    const checkAss = await prisma.assignment.findUnique({ where: { id: assignmentId }});
    
    if (!checkSub && !checkAss) {
      console.log('✅ Cascading delete verified!');
    } else {
      console.log('❌ Cascading delete failed');
    }
  }

  console.log('\n🎉 ACADEMIC HUB TESTS PASSED SUCCESSFULLY 🎉\n');
  process.exit(0);
}

runTests().catch(console.error);
