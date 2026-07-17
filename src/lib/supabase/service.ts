import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Service-role Supabase client factory (SERVER-ONLY).
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY, which BYPASSES RLS — never import this into
 * a client component or otherwise expose it to the browser. Returns `null`
 * when the URL or service key is missing so each caller can respond with its
 * own error shape (a 500, `false`, etc.).
 *
 * Centralizes what were ~10 inline `createClient(url, SERVICE_ROLE_KEY)`
 * instantiations scattered across API routes and lib helpers, giving one
 * place to manage the service credential.
 */
export function getServiceClient(): SupabaseClient<Database> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[getServiceClient] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}
