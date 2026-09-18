import { StorageClient } from '@supabase/storage-js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import type { StorageProvider } from './storage.provider.js';

const BUCKET = 'integrum-files';

export class SupabaseStorageProvider implements StorageProvider {
  private readonly storageClient: StorageClient;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      throw ApiError.internal('Supabase storage credentials not configured');
    }
    this.storageClient = new StorageClient(`${env.SUPABASE_URL}/storage/v1`, {
      apikey: env.SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY!}`,
    });
  }

  async upload(filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.storageClient
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      throw ApiError.internal(`Supabase upload failed: ${error.message}`);
    }
    return filePath;
  }

  async getSignedUrl(fileId: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.storageClient
      .from(BUCKET)
      .createSignedUrl(fileId, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw ApiError.internal(`Failed to generate signed URL: ${error?.message ?? 'unknown'}`);
    }
    return data.signedUrl;
  }

  async delete(fileId: string): Promise<void> {
    const { error } = await this.storageClient.from(BUCKET).remove([fileId]);
    if (error) throw ApiError.internal('Storage deletion failed');
  }
}
