import fs from 'fs/promises';
import path from 'path';
import { ApiError } from '../../utils/ApiError.js';
import type { StorageProvider } from './storage.provider.js';

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly base = path.resolve(process.cwd(), 'uploads')) {}

  getLocalPath(fileId: string): string {
    const fullPath = path.resolve(this.base, fileId);
    if (!fileId || fullPath === this.base || !fullPath.startsWith(this.base + path.sep)) {
      throw ApiError.badRequest('Invalid file identifier');
    }
    return fullPath;
  }

  async upload(filePath: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = this.getLocalPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer, { flag: 'wx' });
    return filePath;
  }

  async getSignedUrl(_fileId: string, _expiresInSeconds: number): Promise<string> {
    throw ApiError.internal('Local files must be served through their authenticated resource endpoint');
  }

  async delete(fileId: string): Promise<void> {
    try {
      await fs.unlink(this.getLocalPath(fileId));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}
