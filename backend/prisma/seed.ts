import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role, SystemSettingKey } from '@prisma/client';
import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('🌱 Starting Integrum Database Seed...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  // 1. Strict Environment Variable Requirement — Zero Hardcoded Defaults
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be configured in environment variables (.env). ' +
      'Refusing to run seed without explicit credentials.'
    );
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // 2. Check for Email Collision & Role Safeguard
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { adminProfile: true },
  });

  let adminUser: { id: string; email: string };

  if (existingUser) {
    if (existingUser.role === Role.STUDENT) {
      throw new Error(
        `Seed admin email "${adminEmail}" already belongs to a STUDENT account. ` +
        'Refusing to change account role automatically via database seed. ' +
        'Please configure a distinct SEED_ADMIN_EMAIL or perform role management via admin API.'
      );
    }

    console.log(`  ℹ️  Admin user "${adminEmail}" already exists. Preserving credentials & ensuring profile...`);
    adminUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isVerified: true,
        isActive: true,
      },
    });

    if (!existingUser.adminProfile) {
      await prisma.adminProfile.create({
        data: {
          userId: adminUser.id,
          firstName: 'System',
          lastName: 'Administrator',
          permissionsLevel: 5,
        },
      });
      console.log('  ✅ AdminProfile created for existing admin user.');
    }
  } else {
    console.log(`  ➕ Creating initial admin user "${adminEmail}"...`);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isVerified: true,
        isActive: true,
        adminProfile: {
          create: {
            firstName: 'System',
            lastName: 'Administrator',
            permissionsLevel: 5,
          },
        },
      },
    });
    console.log(`  ✅ Admin user and AdminProfile created successfully (ID: ${adminUser.id}).`);
  }

  // 3. Seed Default System Settings (Idempotent)
  console.log('  ⚙️  Ensuring baseline SystemSetting records...');
  const defaultSettings: { key: SystemSettingKey; value: boolean; description: string }[] = [
    {
      key: SystemSettingKey.MAINTENANCE_MODE,
      value: false,
      description: 'Controls platform maintenance mode. When enabled, student access is restricted.',
    },
    {
      key: SystemSettingKey.ALLOW_STUDENT_REGISTRATION,
      value: true,
      description: 'Controls public student self-registration.',
    },
    {
      key: SystemSettingKey.AI_FEATURES_ENABLED,
      value: true,
      description: 'Global switch for AI Study Plan, Resume Analysis, and AI Notes features.',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedByUserId: adminUser.id,
      },
      update: {
        description: setting.description,
      },
    });
  }

  console.log('  ✅ Baseline SystemSettings verified.');
  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
