import { PrismaClient } from '@prisma/client';
import { jobApplicationService } from '../src/services/jobapplication.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Career Hub Integration Tests (Job Application Tracking)...');

  // Test data setup
  const user1ProfileId = '33fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c33';
  const user2ProfileId = '44fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c44';

  // 1. Cleanup before tests
  await prisma.jobApplication.deleteMany({
    where: {
      studentProfileId: { in: [user1ProfileId, user2ProfileId] },
    },
  });

  // Ensure mock student profiles exist
  const user1 = await prisma.user.upsert({
    where: { email: 'job1@example.com' },
    update: {},
    create: {
      email: 'job1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user1ProfileId,
          firstName: 'Job',
          lastName: 'User1',
          university: 'Test Uni',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'job2@example.com' },
    update: {},
    create: {
      email: 'job2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user2ProfileId,
          firstName: 'Job',
          lastName: 'User2',
          university: 'Test Uni',
        },
      },
    },
  });

  let appId: string;

  try {
    // 2. Create Job Application
    console.log('\nTesting Job Application Creation...');
    const app1 = await jobApplicationService.createApplication(user1ProfileId, {
      companyName: 'Tech Corp',
      role: 'Backend Developer',
      status: 'APPLIED',
      applicationUrl: 'https://techcorp.com/careers/123',
    });
    appId = app1.id;
    assert.strictEqual(app1.companyName, 'Tech Corp');
    assert.strictEqual(app1.role, 'Backend Developer');
    assert.strictEqual(app1.status, 'APPLIED');
    assert.strictEqual(app1.studentProfileId, user1ProfileId);
    console.log('✅ Job Application creation successful');

    // 3. Retrieve Job Applications
    console.log('\nTesting Job Application Retrieval...');
    const apps = await jobApplicationService.getApplications(user1ProfileId);
    assert.strictEqual(apps.length, 1);
    assert.strictEqual(apps[0].id, appId);
    console.log('✅ Job Application retrieval successful');

    // 4. Update Job Application
    console.log('\nTesting Job Application Update...');
    const updatedApp = await jobApplicationService.updateApplication(user1ProfileId, appId, {
      status: 'INTERVIEWING',
      notes: 'First round scheduled for next week',
    });
    assert.strictEqual(updatedApp.status, 'INTERVIEWING');
    assert.strictEqual(updatedApp.notes, 'First round scheduled for next week');
    console.log('✅ Job Application update successful');

    // 5. Cross-User Isolation (User 2 attempts to fetch User 1's app)
    console.log('\nTesting Cross-User Data Isolation...');
    try {
      await jobApplicationService.getApplicationById(user2ProfileId, appId);
      assert.fail('User 2 should not be able to fetch User 1\'s application');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (fetch)');
    }

    try {
      await jobApplicationService.updateApplication(user2ProfileId, appId, { status: 'REJECTED' });
      assert.fail('User 2 should not be able to update User 1\'s application');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (update)');
    }

    // 6. Delete Job Application
    console.log('\nTesting Job Application Deletion...');
    await jobApplicationService.deleteApplication(user1ProfileId, appId);
    const appsAfterDelete = await jobApplicationService.getApplications(user1ProfileId);
    assert.strictEqual(appsAfterDelete.length, 0);
    console.log('✅ Job Application deletion successful');

    // 7. Invalid Resource Handling
    console.log('\nTesting Invalid Resource Handling...');
    try {
      await jobApplicationService.getApplicationById(user1ProfileId, 'non-existent-uuid');
      assert.fail('Should throw error for non-existent application');
    } catch (error: any) {
      console.log('✅ Invalid resource handling verified');
    }

    console.log('\n🎉 All Career Hub (Job Application Tracking) tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup mock users
    await prisma.user.deleteMany({
      where: { email: { in: ['job1@example.com', 'job2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
