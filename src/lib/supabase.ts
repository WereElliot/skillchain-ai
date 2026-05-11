import { createClient } from '@supabase/supabase-js';
import { appConfig } from '@/lib/config';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getSupabaseFunctionUrl(functionName: string) {
  if (!appConfig.supabaseUrl) return '';
  return `${trimTrailingSlash(appConfig.supabaseUrl)}/functions/v1/${functionName}`;
}

export function getSupabaseAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: appConfig.supabaseAnonKey,
    Authorization: `Bearer ${appConfig.supabaseAnonKey}`,
  };
}

export function createSupabaseBrowserClient() {
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    return null;
  }

  return createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
