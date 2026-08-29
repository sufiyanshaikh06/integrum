import { env } from '../../config/env.js';
import { LocalStorageProvider } from './local.storage.js';
import { SupabaseStorageProvider } from './supabase.storage.js';
import type { StorageProvider } from './storage.provider.js';

export type { StorageProvider } from './storage.provider.js';

export function getStorageProvider(): StorageProvider {
  if (env.STORAGE_PROVIDER === 'supabase') return new SupabaseStorageProvider();
  return new LocalStorageProvider();
}
