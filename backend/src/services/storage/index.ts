import { env } from '../../config/env.js';
import { LocalStorageProvider } from './local.storage.js';
import { SupabaseStorageProvider } from './supabase.storage.js';
import type { StorageProvider } from './storage.provider.js';
import { ApiError } from '../../utils/ApiError.js';

export type { StorageProvider } from './storage.provider.js';

/**
 * Resolves the storage provider for file retrieval, upload, or cleanup.
 * When recordedProvider is stored on the DB record, routes strictly to that provider.
 * For legacy records where recordedProvider is null/undefined, applies a compatibility
 * assumption fallback to env.STORAGE_PROVIDER (documented limitation).
 */
export function getStorageProvider(recordedProvider?: string | null): StorageProvider {
  const provider = recordedProvider || env.STORAGE_PROVIDER;
  if (provider === 'supabase') return new SupabaseStorageProvider();
  if (provider === 'local') return new LocalStorageProvider();
  throw ApiError.internal(`Unsupported or unconfigured storage provider: ${provider}`);
}
