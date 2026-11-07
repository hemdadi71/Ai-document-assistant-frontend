'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { clearCsrfToken, clearLegacyAuthTokens } from '@/lib/auth';
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  registerAccount: (payload: RegisterPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(result: {
  user: { id: string; username: string };
  project_id: string;
}): AuthUser {
  return {
    ...result.user,
    project_id: result.project_id,
  };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const queryClient = useQueryClient();

  const reloadUser = useCallback(async () => {
    const current = await api.me();
    setUser(current);
  }, []);

  // On reload, recover the CSRF value from the HttpOnly cookie via the
  // backend endpoint, then ask the backend to validate the access cookie.
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      clearLegacyAuthTokens();

      try {
        await api.csrf();
        const current = await api.me();

        if (active) setUser(current);
      } catch {
        clearCsrfToken();

        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();

    const handleExpired = () => {
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener('nexa-auth-expired', handleExpired);

    return () => {
      active = false;
      window.removeEventListener('nexa-auth-expired', handleExpired);
    };
  }, [queryClient]);

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const result = await api.login(payload);
      const authenticatedUser = toAuthUser(result);

      queryClient.clear();
      setUser(authenticatedUser);

      return authenticatedUser;
    },
    [queryClient],
  );

  const registerAccount = useCallback(
    async (payload: RegisterPayload) => {
      // Backend registration also creates a session and sets cookies.
      const result = await api.register(payload);
      const authenticatedUser = toAuthUser(result);

      queryClient.clear();
      setUser(authenticatedUser);

      return authenticatedUser;
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    // Do not clear the local authenticated UI if the backend did not confirm
    // logout; otherwise stale HttpOnly cookies could immediately re-authenticate.
    await api.logout();

    clearCsrfToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      registerAccount,
      signOut,
      reloadUser,
    }),
    [user, loading, signIn, registerAccount, signOut, reloadUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
