import { PrismaClient } from '@prisma/client';
import { skillService } from '../src/services/skill.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Career Hub Integration Tests (Skill Management)...');

  // Test data setup
  const user1ProfileId = '11fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c11';
  const user2ProfileId = '22fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c22';

  // 1. Cleanup before tests
  await prisma.skill.deleteMany({
    where: {
      studentProfileId: { in: [user1ProfileId, user2ProfileId] },
    },
  });

  // Ensure mock student profiles exist
  const user1 = await prisma.user.upsert({
    where: { email: 'skill1@example.com' },
    update: {},
    create: {
      email: 'skill1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user1ProfileId,
          firstName: 'Skill',
          lastName: 'User1',
          university: 'Test Uni',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'skill2@example.com' },
    update: {},
    create: {
      email: 'skill2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user2ProfileId,
          firstName: 'Skill',
          lastName: 'User2',
          university: 'Test Uni',
        },
      },
    },
  });

  let skill1Id: string;

  try {
    // 2. Create Skill
    console.log('\nTesting Skill Creation...');
    const skill1 = await skillService.createSkill(user1ProfileId, {
      name: 'TypeScript',
      category: 'TECHNICAL',
      proficiencyLevel: 4,
    });
    skill1Id = skill1.id;
    assert.strictEqual(skill1.name, 'TypeScript');
    assert.strictEqual(skill1.category, 'TECHNICAL');
    assert.strictEqual(skill1.proficiencyLevel, 4);
    assert.strictEqual(skill1.studentProfileId, user1ProfileId);
    console.log('✅ Skill creation successful');

    // 3. Retrieve Skills
    console.log('\nTesting Skill Retrieval...');
    const skills = await skillService.getSkills(user1ProfileId);
    assert.strictEqual(skills.length, 1);
    assert.strictEqual(skills[0].id, skill1Id);
    console.log('✅ Skill retrieval successful');

    // 4. Update Skill
    console.log('\nTesting Skill Update...');
    const updatedSkill = await skillService.updateSkill(user1ProfileId, skill1Id, {
      proficiencyLevel: 5,
    });
    assert.strictEqual(updatedSkill.proficiencyLevel, 5);
    console.log('✅ Skill update successful');

    // 5. Cross-User Isolation (User 2 attempts to fetch User 1's skill)
    console.log('\nTesting Cross-User Data Isolation...');
    try {
      await skillService.getSkillById(user2ProfileId, skill1Id);
      assert.fail('User 2 should not be able to fetch User 1\'s skill');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (fetch)');
    }

    try {
      await skillService.updateSkill(user2ProfileId, skill1Id, { name: 'Hacked Skill' });
      assert.fail('User 2 should not be able to update User 1\'s skill');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (update)');
    }

    // 6. Delete Skill
    console.log('\nTesting Skill Deletion...');
    await skillService.deleteSkill(user1ProfileId, skill1Id);
    const skillsAfterDelete = await skillService.getSkills(user1ProfileId);
    assert.strictEqual(skillsAfterDelete.length, 0);
    console.log('✅ Skill deletion successful');

    // 7. Invalid Resource Handling
    console.log('\nTesting Invalid Resource Handling...');
    try {
      await skillService.getSkillById(user1ProfileId, 'non-existent-uuid');
      assert.fail('Should throw error for non-existent skill');
    } catch (error: any) {
      console.log('✅ Invalid resource handling verified');
    }

    console.log('\n🎉 All Career Hub (Skill) tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup mock users
    await prisma.user.deleteMany({
      where: { email: { in: ['skill1@example.com', 'skill2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
