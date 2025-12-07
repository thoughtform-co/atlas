/**
 * Admin Role Checking Utilities
 * 
 * Provides server-side and client-side utilities for checking
 * if a user has admin privileges.
 */

import { createClient } from '@supabase/supabase-js';

type UserRole = 'user' | 'admin' | 'archivist';

/**
 * Check if a user has admin role (server-side)
 * Uses the service role key for bypassing RLS
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[admin-check] Supabase credentials not configured');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[admin-check] Supabase credentials not configured');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
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
 * Require admin role for API route
 * Returns null if user is admin, or a Response object with error if not
 */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get auth token from request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.slice(7);
  
  // Verify token and get user
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Check if user has admin role
  const isAdmin = await isUserAdmin(user.id);
  
  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // User is admin, proceed
}

/**
 * Get user from request (helper for API routes)
 */
export async function getUserFromRequest(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user } } = await supabase.auth.getUser(token);
  
  return user;
}
