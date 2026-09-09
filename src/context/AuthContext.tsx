import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface GuestUser {
  id: string;
  email: string;
  isGuest: true;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  guest: GuestUser | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInAsGuest: () => void;
  exitGuest: () => void;
  signOut: () => Promise<void>;
}

const GUEST_KEY = 'domzapas_guest_session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState<GuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedGuest = localStorage.getItem(GUEST_KEY);
    if (storedGuest) {
      try {
        setGuest(JSON.parse(storedGuest));
      } catch {
        localStorage.removeItem(GUEST_KEY);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        setGuest(null);
        localStorage.removeItem(GUEST_KEY);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      guest,
      loading,
      isGuest: !!guest,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        return { error: error?.message ?? null };
      },
      signInAsGuest: () => {
        const g: GuestUser = {
          id: 'guest-' + Math.random().toString(36).slice(2, 10),
          email: 'Гость',
          isGuest: true,
        };
        localStorage.setItem(GUEST_KEY, JSON.stringify(g));
        setGuest(g);
      },
      exitGuest: () => {
        localStorage.removeItem(GUEST_KEY);
        setGuest(null);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem(GUEST_KEY);
        setGuest(null);
      },
    }),
    [session, guest, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
