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

  // 4. Seed Multi-Tenant Baseline: Institution, Department, Course & Curriculum
  console.log('  🏛️  Ensuring baseline Institution and Department structure...');
  const institution = await prisma.institution.upsert({
    where: { code: 'MU-ENG' },
    create: {
      name: 'Mumbai University - Faculty of Technology',
      code: 'MU-ENG',
      website: 'https://mu.ac.in',
      contactEmail: 'engineering@mu.ac.in',
      adminUserId: adminUser.id,
    },
    update: {
      name: 'Mumbai University - Faculty of Technology',
    },
  });

  const department = await prisma.department.upsert({
    where: { code: 'CSE' },
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science & Engineering',
      institutionId: institution.id,
      headOfDepartment: 'Dr. K. Sharma',
    },
    update: {
      institutionId: institution.id,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: 'BTECH_CSE' },
    create: {
      name: 'B.Tech in Computer Science & Engineering',
      code: 'BTECH_CSE',
      departmentId: department.id,
      durationYears: 4,
      totalSemesters: 8,
    },
    update: {
      departmentId: department.id,
    },
  });

  // Seed Semester 5 Master Curriculum
  const semester5Subjects = [
    { code: '1105111', name: 'Artificial Intelligence', credits: 4, semesterNumber: 5 },
    { code: '1105112', name: 'Cyber & Information Security', credits: 4, semesterNumber: 5 },
    { code: '1105115', name: 'IKS in Computational Systems', credits: 3, semesterNumber: 5 },
    { code: '1105116', name: 'Software Testing & Quality Assurance', credits: 4, semesterNumber: 5 },
    { code: '1105118', name: 'R Programming Practical', credits: 3, semesterNumber: 5 },
  ];

  for (const s of semester5Subjects) {
    await prisma.masterSubject.upsert({
      where: {
        courseId_code: {
          courseId: course.id,
          code: s.code,
        },
      },
      create: {
        courseId: course.id,
        code: s.code,
        name: s.name,
        credits: s.credits,
        semesterNumber: s.semesterNumber,
      },
      update: {
        name: s.name,
        credits: s.credits,
        semesterNumber: s.semesterNumber,
      },
    });
  }

  // Seed the Registration Code locked to Semester 5 (2026)
  const regCode = await prisma.departmentRegistrationCode.upsert({
    where: { code: 'CSE-2026-S5' },
    create: {
      code: 'CSE-2026-S5',
      departmentId: department.id,
      semesterNumber: 5,
      academicYear: 2026,
      isActive: true,
    },
    update: {
      semesterNumber: 5,
      academicYear: 2026,
      isActive: true,
    },
  });
  console.log(`  🔑 Active registration code configured: "${regCode.code}" (Semester ${regCode.semesterNumber}, ${regCode.academicYear})`);

  // Seed alias code CSE-2026-F
  const regCodeFall = await prisma.departmentRegistrationCode.upsert({
    where: { code: 'CSE-2026-F' },
    create: {
      code: 'CSE-2026-F',
      departmentId: department.id,
      semesterNumber: 5,
      academicYear: 2026,
      isActive: true,
    },
    update: {
      semesterNumber: 5,
      academicYear: 2026,
      isActive: true,
    },
  });
  console.log(`  🔑 Active registration code configured: "${regCodeFall.code}" (Semester ${regCodeFall.semesterNumber}, ${regCodeFall.academicYear})`);

  // 5. Seed Verified Demo Student Account (Sufiyan Shaikh - R.K. Talreja College)
  const studentEmail = 'sufiyan.shaikh@example.com';
  console.log(`  👤 Ensuring demo student account "${studentEmail}"...`);
  const studentPassHash = await bcrypt.hash('password123', saltRounds);

  let demoStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: { studentProfile: { include: { semesters: { include: { subjects: true } } } } },
  });

  if (!demoStudent) {
    demoStudent = await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash: studentPassHash,
        role: Role.STUDENT,
        isVerified: true,
        isActive: true,
        studentProfile: {
          create: {
            firstName: 'Sufiyan',
            lastName: 'Shaikh',
            university: 'R.K. Talreja College',
            enrollmentYear: 2024,
            graduationYear: 2027,
            careerGoals: 'B.Sc. Computer Science graduate targeting software engineering and backend systems architecture.',
            semesters: {
              create: {
                name: 'Semester 5 (B.Sc. Computer Science)',
                startDate: new Date('2026-06-15T00:00:00.000Z'),
                endDate: new Date('2026-11-30T00:00:00.000Z'),
                subjects: {
                  create: [
                    { name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, totalClasses: 24, attendedClasses: 22 },
                    { name: 'Database Management Systems', code: 'CS302', credits: 4, totalClasses: 24, attendedClasses: 20 },
                    { name: 'Operating Systems', code: 'CS303', credits: 4, totalClasses: 23, attendedClasses: 21 },
                  ],
                },
              },
            },
          },
        },
      },
      include: { studentProfile: { include: { semesters: { include: { subjects: true } } } } },
    });
    console.log(`  ✅ Demo student account created (ID: ${demoStudent.id}).`);
  } else {
    console.log(`  ℹ️  Demo student account "${studentEmail}" already exists.`);
  }

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
