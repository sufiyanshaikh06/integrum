import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './storage.provider.js';

const UPLOADS_BASE = path.resolve(process.cwd(), 'uploads');

export class LocalStorageProvider implements StorageProvider {
  async upload(filePath: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(UPLOADS_BASE, filePath);
    const dirname = path.dirname(fullPath);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return filePath;
  }

  async getSignedUrl(fileId: string, _expiresInSeconds: number): Promise<string> {
    return `http://localhost:5000/api/v1/files/${fileId}`;
  }

  async delete(fileId: string): Promise<void> {
    try {
      await fs.unlink(path.join(UPLOADS_BASE, fileId));
    } catch {
      // Ignore errors if file doesn't exist
    }
  }
}
