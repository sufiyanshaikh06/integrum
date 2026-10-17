import { prisma } from '../../config/prisma.js';
import type { Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { LocalStorageProvider } from './local.storage.js';
import type { StorageProvider } from './storage.provider.js';

// Call only after resolving a file ID through an ownership-checked resource.
export async function sendPrivateFile(res: Response, provider: StorageProvider, fileId: string) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (provider instanceof LocalStorageProvider) {
    await new Promise<void>((resolve, reject) => {
      res.download(provider.getLocalPath(fileId), error => {
        if (!error) return resolve();
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return reject(ApiError.notFound('File not found'));
        }
        reject(error);
      });
    });
  } else {
    res.redirect(302, await provider.getSignedUrl(fileId, 60));
  }
}

// Cleanup must not disguise a successful database write as a failed request.
// Provider failures are observable and require operational retry.
export async function cleanupFile(provider: StorageProvider, fileId: string | null) {
  if (!fileId) return;
  const providerName = provider instanceof LocalStorageProvider ? 'local' : 'supabase';
  try {
    const queued = await prisma.storageCleanup.findUnique({ where: { fileId } });
    if (queued && queued.provider !== providerName) return;
    // Callers supply either a detached reference (queued by the DB trigger) or
    // the unique object from a failed attachment. Do not delay compensation
    // with additional reference queries; the retry worker performs those checks.
    await provider.delete(fileId);
    await prisma.storageCleanup.deleteMany({ where: { fileId, provider: providerName } });
  } catch {
    try {
      await prisma.storageCleanup.upsert({ where: { fileId },
        update: { attempts: { increment: 1 } },
        create: { fileId, provider: providerName, attempts: 1 } });
    } catch {
      console.error('Storage cleanup could not be queued; reconciliation required');
    }
  }
}
