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
  try {
    await provider.delete(fileId);
  } catch {
    console.error('Storage cleanup failed; retry required for file:', fileId);
  }
}
