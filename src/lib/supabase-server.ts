import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create a Supabase client for server-side operations (API routes, server components)
 * Uses @supabase/ssr for proper cookie-based auth sync
 */
export async function createServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Check if user is authenticated and return user info
 */
export async function getAuthUser() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log('[auth] getAuthUser error:', error.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[auth] getAuthUser exception:', error);
    return null;
  }
}

/**
 * Verify authentication for write operations
 * Returns the authenticated user or null
 */
export async function requireAuth() {
  const user = await getAuthUser();
  return user;
}
