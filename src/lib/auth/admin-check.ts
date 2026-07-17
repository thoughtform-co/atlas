/**
 * Admin Role Checking Utilities
 * 
 * Provides server-side and client-side utilities for checking
 * if a user has admin privileges.
 */

import { getServiceClient } from '@/lib/supabase/service';

type UserRole = 'user' | 'admin' | 'archivist';

/**
 * Check if a user has admin role (server-side)
 * Uses the service role key for bypassing RLS
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    // No role found means user is not an admin
    return false;
  }
  
  const role = (data as { role: string }).role;
  return role === 'admin' || role === 'archivist';
}

/**
 * Get user's role (server-side)
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = getServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return 'user'; // Default role
  }
  
  return (data as { role: UserRole }).role;
}

/**
 * Get user from request (helper for API routes)
 */
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return null;
  }

  const token = authHeader.slice(7);
  const { data: { user } } = await supabase.auth.getUser(token);

  return user;
}
