import { prisma } from '../../config/prisma.js';
import { LocalStorageProvider } from './local.storage.js';
import { SupabaseStorageProvider } from './supabase.storage.js';
import type { StorageProvider } from './storage.provider.js';

export async function processCleanup(fileId: string, provider: StorageProvider, providerName: string) {
  const job = await prisma.storageCleanup.findUnique({ where: { fileId } });
  if (!job || job.provider !== providerName) return false;
  // Refuse removal of an object still referenced by an application record.
  const [note, resume] = await Promise.all([
    prisma.note.findFirst({ where: { fileId }, select: { id: true } }),
    prisma.studentProfile.findFirst({ where: { uploadedResumeFileId: fileId }, select: { id: true } }),
  ]);
  if (note || resume) return false;
  try {
    await provider.delete(fileId);
    await prisma.storageCleanup.deleteMany({ where: { fileId, provider: providerName } });
    return true;
  } catch {
    await prisma.storageCleanup.updateMany({ where: { fileId }, data: { attempts: { increment: 1 } } });
    return false;
  }
}

// Run explicitly from the backend working directory; no server-startup side effects.
export async function retryStorageCleanup(limit = 100) {
  const jobs = await prisma.storageCleanup.findMany({ where: { provider: { in: ['local', 'supabase'] } }, take: limit, orderBy: [{ attempts: 'asc' }, { createdAt: 'asc' }] });
  let removed = 0;
  for (const job of jobs) {
    if (job.provider !== 'local' && job.provider !== 'supabase') continue;
    try {
      const provider = job.provider === 'local' ? new LocalStorageProvider() : new SupabaseStorageProvider();
      if (await processCleanup(job.fileId, provider, job.provider)) removed++;
    } catch {
      // Missing provider configuration or DB failure leaves the durable job intact.
      console.error('Storage cleanup deferred');
    }
  }
  return { inspected: jobs.length, removed, pending: await prisma.storageCleanup.count() };
}
