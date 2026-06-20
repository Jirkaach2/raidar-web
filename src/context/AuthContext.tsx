import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { account, ID, OAuthProvider, userIsAdmin, isConfigured, type AppUser } from '../lib/appwrite';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'discord' | 'google' | 'github') => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await account.get();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    const me = await account.get();
    setUser(me);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const me = await account.get();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } finally {
      setUser(null);
    }
  }, []);

  const loginWithOAuth = useCallback((provider: 'discord' | 'google' | 'github') => {
    const map = {
      discord: OAuthProvider.Discord,
      google: OAuthProvider.Google,
      github: OAuthProvider.Github,
    } as const;
    const success = `${window.location.origin}/dashboard`;
    const failure = `${window.location.origin}/login?error=oauth`;
    // Redirects the browser to the provider; on return the session cookie is set.
    account.createOAuth2Session(map[provider], success, failure);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAdmin: userIsAdmin(user),
      configured: isConfigured,
      login,
      register,
      loginWithOAuth,
      logout,
      refresh,
    }),
    [user, loading, login, register, loginWithOAuth, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
