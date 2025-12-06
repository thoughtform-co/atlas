import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
// This client is safe for use in both browser and server contexts
let supabaseInstance: SupabaseClient<Database> | null = null;

function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined', // Only persist in browser
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'atlas-eidolon',
        },
      },
    });

    // Log client creation for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[supabase] Client created:', {
        url: supabaseUrl,
        hasKey: !!supabaseAnonKey,
        context: typeof window !== 'undefined' ? 'browser' : 'server',
      });
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
  if (supabaseInstance === null) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
})();

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== undefined && supabaseAnonKey !== undefined && supabase !== null;
};

// Helper to get or create a fresh client (useful for server-side)
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  // Return existing instance or create new one
  if (supabaseInstance === null) {
    supabaseInstance = createSupabaseClient();
  }
  
  return supabaseInstance;
}
