import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Supabase credentials not found. Using static data. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable database.'
  );
}

// Create a singleton Supabase client for the browser/client-side
// Using @supabase/ssr for proper cookie-based auth sync
let supabaseInstance: SupabaseClient<Database> | null = null;

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Only create browser client on client-side
  if (typeof window === 'undefined') {
    // On server, return null - use createServerClient from supabase-server.ts instead
    return null;
  }

  try {
    // Use createBrowserClient from @supabase/ssr for cookie-based auth
    const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

    // Log client creation for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[supabase] Browser client created');
    }

    return client;
  } catch (error) {
    console.error('[supabase] Error creating Supabase client:', {
      error,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// Lazy initialization - create client on first access
export const supabase: SupabaseClient<Database> | null = (() => {
  if (typeof window !== 'undefined' && supabaseInstance === null) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
})();

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== undefined && supabaseAnonKey !== undefined;
};

// Helper to get or create a fresh browser client
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Return existing instance or create new one
  if (supabaseInstance === null) {
    supabaseInstance = createSupabaseClient();
  }
  
  return supabaseInstance;
}
