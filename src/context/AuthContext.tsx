'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
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

/**
 * Auth state provider for the application.
 *
 * ARCHITECTURE: Single-source-of-truth pattern (see docs/decisions/001-auth-state-single-source.md)
 * - Auth handlers (getSession, onAuthStateChange) only set user/session state
 * - Role resolution happens in ONE dedicated useEffect watching `user`
 * - This prevents API storms and race conditions
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');

  // We only use this to prove we're on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Single role resolver -------------------------------------------------
  const resolveRoleForUser = useCallback(
    async (u: User | null) => {
      if (!u) {
        setRole('user');
        setRoleLoading(false);
        return;
      }

      // 1) Prefer JWT metadata
      const metaRole =
        (u.app_metadata as Record<string, unknown>)?.role || 
        (u.user_metadata as Record<string, unknown>)?.role;

      if (metaRole === 'admin' || metaRole === 'archivist') {
        console.log('[Auth] Using metadata role:', metaRole);
        setRole(metaRole as UserRole);
        setRoleLoading(false);
        return;
      }

      // 2) Otherwise read from user_roles table
      if (!supabase) {
        setRole('user');
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      try {
        console.log('[Auth] Fetching role from user_roles table for:', u.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', u.id)
          .single<{ role: UserRole }>();

        if (error || !data?.role) {
          console.error('[Auth] user_roles lookup failed or empty:', error);
          setRole('user');
        } else {
          console.log('[Auth] Got role from DB:', data.role);
          setRole(data.role);
        }
      } catch (err) {
        console.error('[Auth] Exception resolving role:', err);
        setRole('user');
      } finally {
        setRoleLoading(false);
      }
    },
    [],
  );

  const refreshRole = useCallback(async () => {
    await resolveRoleForUser(user);
  }, [user, resolveRoleForUser]);

  // --- Effect 1: wire up Supabase auth (session + user only) ----------------
  useEffect(() => {
    if (!mounted) return;

    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      setRole('user');
      setRoleLoading(false);
      return;
    }

    // TypeScript can't narrow across async boundaries, so we capture the client
    const client = supabase;
    let cancelled = false;

    const init = async () => {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (cancelled) return;

      console.log('[Auth] Initial session:', session ? 'found' : 'none');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return;
      console.log('[Auth] Auth state changed:', _event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mounted]);

  // --- Effect 2: whenever `user` changes, resolve role exactly once ---------
  useEffect(() => {
    if (!mounted) return;
    console.log('[Auth] User changed, resolving role...');
    resolveRoleForUser(user);
  }, [user, mounted, resolveRoleForUser]);

  // --- Auth actions ---------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: new Error(
          'Supabase not configured. Please check environment variables.',
        ),
      };
    }

    try {
      console.log('[Auth] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error: new Error(error.message) };
      }

      console.log('[Auth] Sign in successful');
      // onAuthStateChange will update `user` and trigger role resolution
      return { error: null };
    } catch (err) {
      return {
        error: new Error(
          err instanceof Error ? err.message : 'Authentication failed',
        ),
      };
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    console.log('[Auth] Signing out...');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setRole('user');
      setRoleLoading(false);

      if (typeof window !== 'undefined') {
        const storageKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('sb-') || key.includes('supabase'),
        );
        storageKeys.forEach((key) => localStorage.removeItem(key));
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
