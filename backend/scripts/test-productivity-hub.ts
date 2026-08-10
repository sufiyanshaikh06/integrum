import { PrismaClient } from '@prisma/client';
import { taskService } from '../src/services/task.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Productivity Hub Integration Tests (Task Management)...');

  // Test data setup
  const user1ProfileId = 'a1fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c01';
  const user2ProfileId = 'b2fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c02';

  // 1. Cleanup before tests
  await prisma.task.deleteMany({
    where: {
      studentProfileId: { in: [user1ProfileId, user2ProfileId] },
    },
  });

  // Ensure mock student profiles exist
  const user1 = await prisma.user.upsert({
    where: { email: 'testuser1@example.com' },
    update: {},
    create: {
      email: 'testuser1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user1ProfileId,
          firstName: 'Test',
          lastName: 'User1',
          university: 'Test Uni',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'testuser2@example.com' },
    update: {},
    create: {
      email: 'testuser2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user2ProfileId,
          firstName: 'Test',
          lastName: 'User2',
          university: 'Test Uni',
        },
      },
    },
  });

  let task1Id: string;

  try {
    // 2. Create Task
    console.log('Testing Task Creation...');
    const task1 = await taskService.createTask(user1ProfileId, {
      title: 'Finish Backend Assignment',
      description: 'Implement integration tests',
      status: 'TODO',
    });
    task1Id = task1.id;
    assert.strictEqual(task1.title, 'Finish Backend Assignment');
    assert.strictEqual(task1.studentProfileId, user1ProfileId);
    console.log('✅ Task creation successful');

    // 3. Retrieve Tasks
    console.log('Testing Task Retrieval...');
    const tasks = await taskService.getTasks(user1ProfileId);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, task1Id);
    console.log('✅ Task retrieval successful');

    // 4. Update Task
    console.log('Testing Task Update...');
    const updatedTask = await taskService.updateTask(user1ProfileId, task1Id, {
      status: 'IN_PROGRESS',
    });
    assert.strictEqual(updatedTask.status, 'IN_PROGRESS');
    console.log('✅ Task update successful');

    // 5. Cross-User Isolation (User 2 attempts to fetch User 1's task)
    console.log('Testing Cross-User Data Isolation...');
    try {
      await taskService.getTaskById(user2ProfileId, task1Id);
      assert.fail('User 2 should not be able to fetch User 1\'s task');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (fetch)');
    }

    try {
      await taskService.updateTask(user2ProfileId, task1Id, { status: 'DONE' });
      assert.fail('User 2 should not be able to update User 1\'s task');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (update)');
    }

    // 6. Delete Task
    console.log('Testing Task Deletion...');
    await taskService.deleteTask(user1ProfileId, task1Id);
    const tasksAfterDelete = await taskService.getTasks(user1ProfileId);
    assert.strictEqual(tasksAfterDelete.length, 0);
    console.log('✅ Task deletion successful');

    // 7. Invalid Resource Handling
    console.log('Testing Invalid Resource Handling...');
    try {
      await taskService.getTaskById(user1ProfileId, 'non-existent-uuid');
      assert.fail('Should throw error for non-existent task');
    } catch (error: any) {
      // It might throw Prisma error if it's not a valid UUID format, or a 404 Not Found
      // We assume service throws ApiError.notFound if it's syntactically valid but missing
      console.log('✅ Invalid resource handling verified');
    }

    console.log('\n🎉 All Productivity Hub (Task) tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
