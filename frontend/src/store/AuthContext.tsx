import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import { refreshAccessToken, setAccessToken, setOnAuthLost } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mfaToken?: string }>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
  }, []);

  useEffect(() => {
    setOnAuthLost(() => setUser(null));
    // Restore the session on page load using the httpOnly refresh cookie.
    (async () => {
      const token = await refreshAccessToken();
      if (token) await reloadUser().catch(() => setUser(null));
      setLoading(false);
    })();
  }, [reloadUser]);

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    reloadUser,
    async login(email, password) {
      const { data } = await authApi.login(email, password);
      if (data.mfaRequired) return { mfaToken: data.mfaToken };
      setAccessToken(data.accessToken!);
      await reloadUser();
      return {};
    },
    async verifyMfa(mfaToken, code) {
      const { data } = await authApi.loginMfa(mfaToken, code);
      setAccessToken(data.accessToken);
      await reloadUser();
    },
    async logout() {
      await authApi.logout().catch(() => undefined);
      setAccessToken(null);
      setUser(null);
    },
  }), [user, loading, reloadUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
