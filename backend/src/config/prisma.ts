import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const isLocalDb =
  env.DATABASE_URL.includes('localhost') ||
  env.DATABASE_URL.includes('127.0.0.1') ||
  env.DATABASE_URL.includes('sslmode=disable');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  allowExitOnIdle: true,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

process.once('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});
