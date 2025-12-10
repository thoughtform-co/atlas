'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

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
  const [mounted, setMounted] = useState(false); // The "safe signal"
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const fetchingRoleRef = useRef(false);

  // First effect: Set mounted flag - this is our proof we're on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string, userObj?: User | null) => {
    console.log('[Auth] fetchUserRole called for userId:', userId);

    // Prefer role from JWT metadata when available to avoid RLS issues
    // Use passed userObj first, then fall back to state user
    const userToCheck = userObj || user;

    if (userToCheck?.app_metadata?.role && (userToCheck.app_metadata.role === 'admin' || userToCheck.app_metadata.role === 'archivist')) {
      console.log('[Auth] Found role in app_metadata:', userToCheck.app_metadata.role);
      return userToCheck.app_metadata.role as UserRole;
    }
    if (userToCheck?.user_metadata?.role && (userToCheck.user_metadata.role === 'admin' || userToCheck.user_metadata.role === 'archivist')) {
      console.log('[Auth] Found role in user_metadata:', userToCheck.user_metadata.role);
      return userToCheck.user_metadata.role as UserRole;
    }

    console.log('[Auth] No role in metadata, checking database...');

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('[Auth] Supabase client is null, returning user role');
      return 'user' as UserRole;
    }

    try {
      console.log('[Auth] Querying user_roles table...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single() as { data: { role: string } | null; error: { message: string; code: string } | null };

      if (error) {
        console.error('[Auth] Error fetching role from database:', error.message, error.code);
        return 'user' as UserRole;
      }

      if (!data || !data.role) {
        console.log('[Auth] No role data found in database for user');
        return 'user' as UserRole;
      }

      console.log('[Auth] Found role in database:', data.role);
      return data.role as UserRole;
    } catch (err) {
      console.error('[Auth] Exception fetching role:', err);
      return 'user' as UserRole;
    }
  }, [user]);

  const refreshRole = useCallback(async () => {
    if (user?.id) {
      setRoleLoading(true);
      try {
        // Pass current user object so metadata can be checked
        const userRole = await fetchUserRole(user.id, user);
        setRole(userRole);
      } finally {
        setRoleLoading(false);
      }
    }
  }, [user, fetchUserRole]);

  useEffect(() => {
    // Don't run until we're mounted (proof we're on the client)
    if (!mounted) {
      console.log('[Auth] Not mounted yet, waiting...');
      return;
    }

    console.log('[Auth] Mounted and running auth setup...');
    console.log('[Auth] isSupabaseConfigured:', isSupabaseConfigured());

    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, skipping auth setup');
      setLoading(false);
      setRoleLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    console.log('[Auth] supabase client:', supabase ? 'exists' : 'null');

    if (!supabase) {
      console.log('[Auth] Supabase client is null, skipping auth setup');
      setLoading(false);
      setRoleLoading(false);
      return;
    }

    // Get initial session
    console.log('[Auth] Getting initial session...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] Got session:', session ? `user ${session.user?.email}` : 'no session');
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        console.log('[Auth] User authenticated, checking role...');
        // Check metadata first - if role is in metadata, no need to fetch
        const metadataRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
        console.log('[Auth] Metadata role check:', { app_metadata: session.user.app_metadata, user_metadata: session.user.user_metadata });
        if (metadataRole === 'admin' || metadataRole === 'archivist') {
          console.log('[Auth] Using metadata role:', metadataRole);
          setRole(metadataRole as UserRole);
          setRoleLoading(false);
        } else if (!fetchingRoleRef.current) {
          // Only fetch if not already fetching and no metadata role
          console.log('[Auth] No metadata role, fetching from database...');
          fetchingRoleRef.current = true;
          try {
            const userRole = await fetchUserRole(session.user.id, session.user);
            console.log('[Auth] Setting role to:', userRole);
            setRole(userRole);
          } catch (error) {
            console.error('[Auth] Failed to fetch initial role:', error);
          } finally {
            fetchingRoleRef.current = false;
            setRoleLoading(false);
          }
        } else {
          console.log('[Auth] Already fetching role, skipping...');
          setRoleLoading(false);
        }
      } else {
        console.log('[Auth] No user session, setting default role');
        setRole('user');
        setRoleLoading(false);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth] Auth state changed:', _event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user?.id) {
          // Check metadata first - if role is in metadata, no need to fetch
          const metadataRole = session.user.app_metadata?.role || session.user.user_metadata?.role;
          if (metadataRole === 'admin' || metadataRole === 'archivist') {
            setRole(metadataRole as UserRole);
            setRoleLoading(false);
          } else if (!fetchingRoleRef.current) {
            // Only fetch if not already fetching and no metadata role
            fetchingRoleRef.current = true;
            setRoleLoading(true);
            try {
              const userRole = await fetchUserRole(session.user.id, session.user);
              setRole(userRole);
            } catch (error) {
              console.error('[Auth] Failed to fetch role on auth change:', error);
            } finally {
              fetchingRoleRef.current = false;
              setRoleLoading(false);
            }
          } else {
            // Already fetching, just wait for it to complete
            setRoleLoading(true);
          }
        } else {
          setRole('user');
          setRoleLoading(false);
          fetchingRoleRef.current = false;
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [mounted, fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called, checking Supabase client...');

    const supabase = getSupabaseClient();
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
    const supabase = getSupabaseClient();
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
