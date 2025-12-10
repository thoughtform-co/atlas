'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
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
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Helper: fetch role for a given user id -------------------------------
  const fetchUserRole = useCallback(
    async (userId: string, userObj?: User | null): Promise<UserRole> => {
      console.log('[Auth] fetchUserRole called for userId:', userId);

      const u = userObj || user;

      // Prefer metadata
      const metaRole =
        (u?.app_metadata as Record<string, unknown>)?.role ||
        (u?.user_metadata as Record<string, unknown>)?.role;
      if (metaRole === 'admin' || metaRole === 'archivist') {
        console.log('[Auth] Using metadata role:', metaRole);
        return metaRole as UserRole;
      }

      console.log('[Auth] No role in metadata, checking database...');

      const supabase = getSupabaseClient();
      if (!supabase) {
        console.log('[Auth] Supabase client is null, returning user');
        return 'user';
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single<{ role: string }>();

        if (error) {
          console.error('[Auth] Error fetching role from database:', error);
          return 'user';
        }

        if (!data?.role) {
          console.log('[Auth] No role data found in database');
          return 'user';
        }

        console.log('[Auth] Found role in database:', data.role);
        return data.role as UserRole;
      } catch (err) {
        console.error('[Auth] Exception fetching role:', err);
        return 'user';
      }
    },
    [user],
  );

  // --- Public helper: refreshRole ------------------------------------------
  const refreshRole = useCallback(async () => {
    if (!user?.id) {
      setRole('user');
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    try {
      const userRole = await fetchUserRole(user.id, user);
      console.log('[Auth] refreshRole ->', userRole);
      setRole(userRole);
    } finally {
      setRoleLoading(false);
    }
  }, [user, fetchUserRole]);

  // --- Core auth wiring: initial session + onAuthStateChange ----------------
  useEffect(() => {
    if (!mounted) {
      console.log('[Auth] Not mounted yet, waiting...');
      return;
    }

    console.log('[Auth] Mounted, running auth setup');
    console.log('[Auth] isSupabaseConfigured:', isSupabaseConfigured());

    if (!isSupabaseConfigured()) {
      console.log('[Auth] Supabase not configured, skipping auth');
      setLoading(false);
      setRole('user');
      setRoleLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    console.log('[Auth] supabase client:', supabase ? 'exists' : 'null');

    if (!supabase) {
      console.log('[Auth] Supabase client is null, skipping auth');
      setLoading(false);
      setRole('user');
      setRoleLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      console.log('[Auth] Getting initial session...');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      console.log(
        '[Auth] Got session:',
        session ? `user ${session.user?.email}` : 'no session',
      );

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (cancelled) return;

        console.log(
          '[Auth] Auth state changed:',
          event,
          newSession?.user?.email,
        );

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (!newSession) {
          // full sign-out
          setRole('user');
          setRoleLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mounted]);

  // --- Whenever `user` changes, resolve their role --------------------------
  useEffect(() => {
    if (!mounted) return;

    if (!user?.id) {
      setRole('user');
      setRoleLoading(false);
      return;
    }

    // Try metadata first
    const metaRole =
      (user.app_metadata as Record<string, unknown>)?.role ||
      (user.user_metadata as Record<string, unknown>)?.role;

    if (metaRole === 'admin' || metaRole === 'archivist') {
      console.log('[Auth] Using metadata role (user effect):', metaRole);
      setRole(metaRole as UserRole);
      setRoleLoading(false);
      return;
    }

    // Else fetch from DB
    refreshRole();
  }, [user, mounted, refreshRole]);

  // --- signIn / signOut ----------------------------------------------------
  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called');

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[Auth] Supabase client is null');
      return {
        error: new Error(
          'Supabase not configured. Please check environment variables.',
        ),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Auth] Sign in response:', {
        data: !!data,
        error: error?.message,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { error: new Error(error.message) };
      }

      console.log('[Auth] Sign in successful');
      // onAuthStateChange will update user + role
      return { error: null };
    } catch (err) {
      console.error('[Auth] Unexpected sign in error:', err);
      return {
        error: new Error(
          err instanceof Error ? err.message : 'Authentication failed',
        ),
      };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    console.log('[Auth] Starting sign out...');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out API error:', error);
      }
      console.log('[Auth] Sign out complete, clearing local state...');
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setRole('user');
      setRoleLoading(false);

      if (typeof window !== 'undefined') {
        // clean up supabase localStorage
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
