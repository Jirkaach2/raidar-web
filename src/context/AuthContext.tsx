import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { account, ID, OAuthProvider, AuthenticationFactor, userIsAdmin, isConfigured, type AppUser } from '../lib/appwrite';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<{ mfa: boolean }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'discord' | 'google' | 'github') => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Email a verification link to the signed-in user. */
  sendVerification: () => Promise<void>;
  /** Complete verification from the link's userId + secret, then refresh. */
  confirmVerification: (userId: string, secret: string) => Promise<void>;
  /** Complete an MFA challenge during sign-in (TOTP or recovery code). */
  completeMfa: (factor: AuthenticationFactor, code: string) => Promise<void>;
}

/** Where Appwrite sends users back to after clicking the verification link. */
const VERIFY_URL = `${window.location.origin}/verify`;

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
    const isMfa = (e: unknown) => (e as { type?: string })?.type === 'user_more_factors_required';
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (e) {
      // Depending on Appwrite version the second-factor requirement can surface
      // here (the first factor still succeeded and a partial session exists).
      if (isMfa(e)) return { mfa: true };
      // A leftover partial session from a previous attempt — continue to checks.
      if ((e as { type?: string })?.type !== 'user_session_already_exists') throw e;
    }
    try {
      const me = await account.get();
      setUser(me);
      return { mfa: false };
    } catch (e) {
      if (isMfa(e)) return { mfa: true };
      throw e;
    }
  }, []);

  const completeMfa = useCallback(async (factor: AuthenticationFactor, code: string) => {
    const challenge = await account.createMfaChallenge(factor);
    await account.updateMfaChallenge(challenge.$id, code);
    const me = await account.get();
    setUser(me);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const me = await account.get();
    setUser(me);
    // Fire off the verification email; don't block signup if it fails.
    try { await account.createVerification(VERIFY_URL); } catch { /* user can resend later */ }
  }, []);

  const sendVerification = useCallback(async () => {
    await account.createVerification(VERIFY_URL);
  }, []);

  const confirmVerification = useCallback(async (userId: string, secret: string) => {
    await account.updateVerification(userId, secret);
    await refresh();
  }, [refresh]);

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
      sendVerification,
      confirmVerification,
      completeMfa,
    }),
    [user, loading, login, register, loginWithOAuth, logout, refresh, sendVerification, confirmVerification, completeMfa],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
