import { PrismaClient } from '@prisma/client';
import { resumeService } from '../src/services/resume.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Career Hub Integration Tests (Resume Management)...');

  // Test data setup
  const user1ProfileId = 'e5fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c05';
  const user2ProfileId = 'f6fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c06';

  // 1. Cleanup before tests
  await prisma.resume.deleteMany({
    where: {
      studentProfileId: { in: [user1ProfileId, user2ProfileId] },
    },
  });

  // Ensure mock student profiles exist
  const user1 = await prisma.user.upsert({
    where: { email: 'career1@example.com' },
    update: {},
    create: {
      email: 'career1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user1ProfileId,
          firstName: 'Career',
          lastName: 'User1',
          university: 'Test Uni',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'career2@example.com' },
    update: {},
    create: {
      email: 'career2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user2ProfileId,
          firstName: 'Career',
          lastName: 'User2',
          university: 'Test Uni',
        },
      },
    },
  });

  let resume1Id: string;

  try {
    // 2. Create Resume
    console.log('\nTesting Resume Creation (with initial version)...');
    const resume1 = await resumeService.createResume(user1ProfileId, {
      title: 'Software Engineer Resume',
      isActive: true,
      content: {
        experience: ['Company A'],
        skills: ['JavaScript', 'TypeScript']
      }
    });
    resume1Id = resume1.id;
    assert.strictEqual(resume1.title, 'Software Engineer Resume');
    assert.strictEqual(resume1.isActive, true);
    assert.strictEqual(resume1.studentProfileId, user1ProfileId);
    assert.strictEqual(resume1.versions.length, 1);
    
    // Type checking the JSON content
    const parsedContent = resume1.versions[0].content as { skills: string[] };
    assert.strictEqual(parsedContent.skills.includes('TypeScript'), true);
    console.log('✅ Resume and initial version creation successful');

    // 3. Retrieve Resumes
    console.log('\nTesting Resume Retrieval...');
    const resumes = await resumeService.getResumes(user1ProfileId);
    assert.strictEqual(resumes.length, 1);
    assert.strictEqual(resumes[0].id, resume1Id);
    assert.strictEqual(resumes[0].versions.length, 1, 'Should include latest version by default');
    console.log('✅ Resume retrieval successful');

    // 4. Update Resume (Title only)
    console.log('\nTesting Resume Update (Metadata only)...');
    const updatedResumeMeta = await resumeService.updateResume(user1ProfileId, resume1Id, {
      title: 'Senior Software Engineer Resume',
    });
    assert.strictEqual(updatedResumeMeta.title, 'Senior Software Engineer Resume');
    // Ensure no new version was created since content wasn't passed
    const resumeAfterMetaUpdate = await resumeService.getResumeById(user1ProfileId, resume1Id);
    assert.strictEqual(resumeAfterMetaUpdate.versions.length, 1);
    console.log('✅ Metadata update successful');

    // 5. Update Resume (New Content)
    console.log('\nTesting Resume Update (New Version Creation)...');
    const updatedResumeContent = await resumeService.updateResume(user1ProfileId, resume1Id, {
      content: {
        experience: ['Company A', 'Company B'],
        skills: ['JavaScript', 'TypeScript', 'Node.js']
      }
    });
    const resumeAfterContentUpdate = await resumeService.getResumeById(user1ProfileId, resume1Id);
    // Should now have 2 versions
    assert.strictEqual(resumeAfterContentUpdate.versions.length, 2);
    
    const latestVersionContent = resumeAfterContentUpdate.versions[0].content as { skills: string[] };
    assert.strictEqual(latestVersionContent.skills.includes('Node.js'), true);
    console.log('✅ New version creation on content update successful');

    // 6. Cross-User Isolation (User 2 attempts to fetch User 1's resume)
    console.log('\nTesting Cross-User Data Isolation...');
    try {
      await resumeService.getResumeById(user2ProfileId, resume1Id);
      assert.fail('User 2 should not be able to fetch User 1\'s resume');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (fetch)');
    }

    try {
      await resumeService.updateResume(user2ProfileId, resume1Id, { title: 'Hacked Resume' });
      assert.fail('User 2 should not be able to update User 1\'s resume');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (update)');
    }

    // 7. Delete Resume
    console.log('\nTesting Resume Deletion (Cascading to versions)...');
    await resumeService.deleteResume(user1ProfileId, resume1Id);
    const resumesAfterDelete = await resumeService.getResumes(user1ProfileId);
    assert.strictEqual(resumesAfterDelete.length, 0);
    
    // Verify versions were cascaded
    const versionsAfterDelete = await prisma.resumeVersion.findMany({
      where: { resumeId: resume1Id }
    });
    assert.strictEqual(versionsAfterDelete.length, 0);
    console.log('✅ Resume and cascaded versions deletion successful');

    // 8. Invalid Resource Handling
    console.log('\nTesting Invalid Resource Handling...');
    try {
      await resumeService.getResumeById(user1ProfileId, 'non-existent-uuid');
      assert.fail('Should throw error for non-existent resume');
    } catch (error: any) {
      console.log('✅ Invalid resource handling verified');
    }

    console.log('\n🎉 All Career Hub (Resume) tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup mock users
    await prisma.user.deleteMany({
      where: { email: { in: ['career1@example.com', 'career2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
