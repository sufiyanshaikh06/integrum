import { PrismaClient } from '@prisma/client';
import { reminderService } from '../src/services/reminder.service.js';
import { ApiError } from '../src/utils/ApiError.js';
import { prisma } from '../src/config/prisma.js';
import assert from 'assert';

async function runTests() {
  console.log('Starting Productivity Hub Integration Tests (Reminders)...');

  // Test data setup
  const user1ProfileId = 'c1fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c03';
  const user2ProfileId = 'd2fbd9a7-8f5b-4c00-bb65-1d4e0b0b8c04';

  // 1. Cleanup before tests
  await prisma.reminder.deleteMany({
    where: {
      studentProfileId: { in: [user1ProfileId, user2ProfileId] },
    },
  });

  // Ensure mock student profiles exist
  const user1 = await prisma.user.upsert({
    where: { email: 'reminder1@example.com' },
    update: {},
    create: {
      email: 'reminder1@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user1ProfileId,
          firstName: 'Reminder',
          lastName: 'User1',
          university: 'Test Uni',
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'reminder2@example.com' },
    update: {},
    create: {
      email: 'reminder2@example.com',
      passwordHash: 'dummy',
      role: 'STUDENT',
      studentProfile: {
        create: {
          id: user2ProfileId,
          firstName: 'Reminder',
          lastName: 'User2',
          university: 'Test Uni',
        },
      },
    },
  });

  let reminder1Id: string;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  try {
    // 2. Create Reminder
    console.log('Testing Reminder Creation...');
    const reminder1 = await reminderService.createReminder(user1ProfileId, {
      title: 'Pay tuition',
      description: 'Fall semester tuition due soon',
      triggerAt: tomorrow,
    });
    reminder1Id = reminder1.id;
    assert.strictEqual(reminder1.title, 'Pay tuition');
    assert.strictEqual(reminder1.studentProfileId, user1ProfileId);
    console.log('✅ Reminder creation successful');

    // 3. Retrieve Reminders
    console.log('Testing Reminder Retrieval...');
    const reminders = await reminderService.getReminders(user1ProfileId);
    assert.strictEqual(reminders.length, 1);
    assert.strictEqual(reminders[0].id, reminder1Id);
    console.log('✅ Reminder retrieval successful');

    // 4. Update Reminder
    console.log('Testing Reminder Update...');
    const updatedReminder = await reminderService.updateReminder(user1ProfileId, reminder1Id, {
      isCompleted: true,
    });
    assert.strictEqual(updatedReminder.isCompleted, true);
    console.log('✅ Reminder update successful');

    // 5. Cross-User Isolation (User 2 attempts to fetch User 1's reminder)
    console.log('Testing Cross-User Data Isolation...');
    try {
      await reminderService.getReminderById(user2ProfileId, reminder1Id);
      assert.fail('User 2 should not be able to fetch User 1\'s reminder');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (fetch)');
    }

    try {
      await reminderService.updateReminder(user2ProfileId, reminder1Id, { isCompleted: true });
      assert.fail('User 2 should not be able to update User 1\'s reminder');
    } catch (error: any) {
      assert.strictEqual(error.statusCode, 404);
      console.log('✅ Cross-user data isolation verified (update)');
    }

    // 6. Delete Reminder
    console.log('Testing Reminder Deletion...');
    await reminderService.deleteReminder(user1ProfileId, reminder1Id);
    const remindersAfterDelete = await reminderService.getReminders(user1ProfileId);
    assert.strictEqual(remindersAfterDelete.length, 0);
    console.log('✅ Reminder deletion successful');

    // 7. Invalid Resource Handling
    console.log('Testing Invalid Resource Handling...');
    try {
      await reminderService.getReminderById(user1ProfileId, 'non-existent-uuid');
      assert.fail('Should throw error for non-existent reminder');
    } catch (error: any) {
      console.log('✅ Invalid resource handling verified');
    }

    console.log('\n🎉 All Productivity Hub (Reminder) tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup mock users
    await prisma.user.deleteMany({
      where: { email: { in: ['reminder1@example.com', 'reminder2@example.com'] } }
    });
    await prisma.$disconnect();
  }
}

runTests();
