import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  requestEmailOtp,
  signInWithAppleCredential,
  verifyEmailOtp,
  type RequestOtpResult,
} from '@/lib/auth/auth-api';
import { clearSession, loadSession, saveSession } from '@/lib/auth/session-storage';
import type { Session } from '@/lib/auth/types';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  /** После свежего входа показываем Welcome, затем — приложение. */
  needsWelcome: boolean;
  requestEmailOtp: (email: string) => Promise<RequestOtpResult>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  signInApple: (appleUserId: string, email: string | null) => Promise<void>;
  completeWelcome: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [needsWelcome, setNeedsWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadSession().then((stored) => {
      if (mounted) {
        setSession(stored);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: Session | null, options?: { freshSignIn?: boolean }) => {
    if (next) {
      await saveSession(next);
      if (options?.freshSignIn) {
        setNeedsWelcome(true);
      }
    } else {
      await clearSession();
      setNeedsWelcome(false);
    }
    setSession(next);
  }, []);

  const requestOtp = useCallback(async (email: string) => {
    return requestEmailOtp(email);
  }, []);

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      const next = await verifyEmailOtp(email, code);
      await persist(next, { freshSignIn: true });
    },
    [persist],
  );

  const signInApple = useCallback(
    async (appleUserId: string, email: string | null) => {
      const next = await signInWithAppleCredential(appleUserId, email);
      await persist(next, { freshSignIn: true });
    },
    [persist],
  );

  const completeWelcome = useCallback(() => {
    setNeedsWelcome(false);
  }, []);

  const signOut = useCallback(async () => {
    await persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      needsWelcome,
      requestEmailOtp: requestOtp,
      verifyEmailOtp: verifyOtp,
      signInApple,
      completeWelcome,
      signOut,
    }),
    [session, isLoading, needsWelcome, requestOtp, verifyOtp, signInApple, completeWelcome, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
