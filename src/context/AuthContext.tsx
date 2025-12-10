'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'user' | 'admin' | 'archivist';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [mounted, setMounted] = useState(false);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string, userObj?: User | null) => {
    // Prefer role from JWT metadata when available to avoid RLS issues
    // Use passed userObj first, then fall back to state user
    const userToCheck = userObj || user;
    
    if (userToCheck?.app_metadata?.role && (userToCheck.app_metadata.role === 'admin' || userToCheck.app_metadata.role === 'archivist')) {
      return userToCheck.app_metadata.role as UserRole;
    }
    if (userToCheck?.user_metadata?.role && (userToCheck.user_metadata.role === 'admin' || userToCheck.user_metadata.role === 'archivist')) {
      return userToCheck.user_metadata.role as UserRole;
    }

    if (!supabase) return 'user' as UserRole;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return 'user' as UserRole;
      }
      
      return (data as { role: UserRole }).role;
    } catch {
      return 'user' as UserRole;
    }
  }, [user]);

  const refreshRole = useCallback(async () => {
    if (user?.id) {
      setRoleLoading(true);
      try {
        const userRole = await fetchUserRole(user.id, user);
        setRole(userRole);
      } finally {
        setRoleLoading(false);
      }
    } else {
      setRole('user');
      setRoleLoading(false);
    }
  }, [user, fetchUserRole]);

  // Mark mounted for client-only guards
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      setRoleLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  // Resolve role whenever user changes
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      setRole('user');
      setRoleLoading(false);
      return;
    }

    const metadataRole = user.app_metadata?.role || user.user_metadata?.role;
    if (metadataRole === 'admin' || metadataRole === 'archivist') {
      setRole(metadataRole as UserRole);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    fetchUserRole(user.id, user)
      .then((userRole) => setRole(userRole))
      .catch((error) => {
        console.error('[Auth] Failed to resolve role:', error);
        setRole('user');
      })
      .finally(() => setRoleLoading(false));
  }, [user, mounted, fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called, checking Supabase client...');
    
    if (!supabase) {
      console.error('[Auth] Supabase client is null - credentials may not be configured');
      return { error: new Error('Supabase not configured. Please check environment variables.') };
    }

    console.log('[Auth] Calling supabase.auth.signInWithPassword...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Auth] Sign in response received:', { data: !!data, error: error?.message });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error: new Error(error.message) };
      }

      // Success - auth state change listener will update the user state
      console.log('[Auth] Sign in successful');
      return { error: null };
    } catch (err) {
      console.error('[Auth] Unexpected sign in error:', err);
      return { error: new Error(err instanceof Error ? err.message : 'Authentication failed') };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    
    console.log('[Auth] Starting sign out...');
    
    try {
      // Sign out - @supabase/ssr handles cookie cleanup
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out API error:', error);
      }
      
      console.log('[Auth] Sign out complete, clearing local state...');
      
      // Reset state immediately
      setUser(null);
      setSession(null);
      setRole('user');
      setRoleLoading(false);
      
      // Clear any persisted auth data from localStorage as backup
      if (typeof window !== 'undefined') {
        const storageKeys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        );
        storageKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Full page reload to clear all state and cookies
        window.location.href = '/';
      }
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Still redirect on error
      setUser(null);
      setSession(null);
      setRole('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roleLoading,
        isAuthenticated: !!user,
        isAdmin: role === 'admin' || role === 'archivist',
        role,
        signIn,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
