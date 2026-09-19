import 'dotenv/config';
import { retryStorageCleanup } from '../src/services/storage/cleanup.js';
import { prisma } from '../src/config/prisma.js';
retryStorageCleanup().then(result => console.log(result))
  .catch(() => { console.error('Cleanup could not complete'); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
