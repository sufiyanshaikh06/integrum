import { StorageClient } from '@supabase/storage-js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { StorageProvider } from './storage.provider.js';

const BUCKET = 'integrum-files';

export class SupabaseStorageProvider implements StorageProvider {
  private readonly storageClient: StorageClient;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      throw ApiError.internal('Storage credentials not configured');
    }
    this.storageClient = new StorageClient(`${env.SUPABASE_URL}/storage/v1`, {
      apikey: env.SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY!}`,
    });
  }

  async upload(filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
    try {
      const { error } = await this.storageClient
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: mimeType, upsert: true });

      if (error) {
        throw new ApiError(503, 'Storage service is temporarily unavailable');
      }
      return filePath;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, 'Storage service is temporarily unavailable');
    }
  }

  async getSignedUrl(fileId: string, expiresInSeconds: number): Promise<string> {
    try {
      const { data, error } = await this.storageClient
        .from(BUCKET)
        .createSignedUrl(fileId, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw new ApiError(503, 'Storage service is temporarily unavailable');
      }
      return data.signedUrl;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, 'Storage service is temporarily unavailable');
    }
  }

  async delete(fileId: string): Promise<void> {
    try {
      const { error } = await this.storageClient.from(BUCKET).remove([fileId]);
      if (error) {
        throw new ApiError(503, 'Storage service is temporarily unavailable');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, 'Storage service is temporarily unavailable');
    }
  }
}
