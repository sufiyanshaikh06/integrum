import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('Starting AI Intelligence Hub Integration Tests...\n');
  const BASE_URL = 'http://localhost:5000/api/v1';

  // 1. Setup Test Data
  const email = `test_ai_${Date.now()}@example.com`;
  const password = 'password123';
  
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName: 'AI', lastName: 'Tester' })
  });
  
  if (!registerRes.ok) {
    console.error('Failed to register user', await registerRes.text());
    process.exit(1);
  }

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { data } = await loginRes.json();
  const token = data.accessToken;

  // We need to fetch the student profile ID to verify logs
  const user = await prisma.user.findUnique({
    where: { email },
    include: { studentProfile: true }
  });
  const studentProfileId = user!.studentProfile!.id;

  try {
    // 2. Test valid AI request (Study Plan Generation)
    console.log('Testing Study Plan Generation...');
    const studyPlanReq = await fetch(`${BASE_URL}/ai/study-plan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'Machine Learning Basics',
        goals: 'Understand core concepts'
      })
    });

    if (studyPlanReq.status !== 201) throw new Error(`Study Plan Generation failed: ${await studyPlanReq.text()}`);
    const planRes = await studyPlanReq.json();
    if (!planRes.data.recommendedTargetDate) throw new Error('Missing recommendedTargetDate in AI response');
    console.log('✅ Study plan generation successful');

    // 3. Test AI Execution Logging
    console.log('Testing AI Execution Logging...');
    const executionLogs = await prisma.aIExecutionLog.findMany({
      where: { studentProfileId, module: 'STUDY_PLAN' }
    });
    
    if (executionLogs.length !== 1) throw new Error('AI execution log was not created');
    if (executionLogs[0].status !== 'SUCCESS') throw new Error('AI execution log did not record SUCCESS');
    if (!executionLogs[0].completedAt) throw new Error('AI execution log missing completedAt');
    console.log('✅ AI execution log verified');

    // 4. Test Invalid Input Validation
    console.log('Testing Invalid Input Validation...');
    const invalidReq = await fetch(`${BASE_URL}/ai/study-plan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'A' // Too short (min 3)
      })
    });
    
    if (invalidReq.status !== 400) throw new Error(`Invalid input test failed. Expected 400, got ${invalidReq.status}`);
    console.log('✅ Invalid input handling verified');

    // 5. Test Unauthorized Request
    console.log('Testing Unauthorized Access...');
    const unauthReq = await fetch(`${BASE_URL}/ai/study-plan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic: 'Hacking Basics' })
    });
    
    if (unauthReq.status !== 401) throw new Error(`Unauthorized access test failed. Expected 401, got ${unauthReq.status}`);
    console.log('✅ Unauthorized access handling verified');

    // 6. Test Cross-User Isolation (Creating another user)
    console.log('Testing Cross-User Data Isolation...');
    const otherEmail = `other_ai_${Date.now()}@example.com`;
    const registerOther = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: otherEmail, password, firstName: 'Other', lastName: 'User' })
    });

    const otherUser = await prisma.user.findUnique({
      where: { email: otherEmail },
      include: { studentProfile: true }
    });

    const otherLogs = await prisma.aIExecutionLog.findMany({
      where: { studentProfileId: otherUser!.studentProfile!.id }
    });

    if (otherLogs.length !== 0) throw new Error('Data isolation failed - logs bled across profiles');
    console.log('✅ Cross-user data isolation verified');

    console.log('\n🎉 All AI Intelligence Hub tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test_ai_' } }
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'other_ai_' } }
    });
    await prisma.$disconnect();
  }
}

main();
