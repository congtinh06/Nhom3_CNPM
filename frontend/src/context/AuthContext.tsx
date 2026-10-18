import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { LOGGED_OUT_EVENT, tokenStore } from '../api/tokenStore';
import { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '../types';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Chạy tối đa một lần trong một chuỗi trang (React StrictMode mount/umount/ mount lại).
let bootstrapPromise: Promise<AuthSession | null> | null = null;

function bootstrapSession(): Promise<AuthSession | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = authApi
      .refresh()
      .catch(() => null)
      .finally(() => {
        bootstrapPromise = null;
      });
  }
  return bootstrapPromise;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    void bootstrapSession().then((session) => {
      if (cancelled) return;
      if (session) {
        tokenStore.set(session.accessToken);
        setUser(session.user);
        setStatus('authenticated');
      } else {
        tokenStore.clear();
        setUser(null);
        setStatus('guest');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleLoggedOut = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener(LOGGED_OUT_EVENT, handleLoggedOut);
    return () => window.removeEventListener(LOGGED_OUT_EVENT, handleLoggedOut);
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const session = await authApi.login(payload);
    tokenStore.set(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<AuthUser> => {
    const session = await authApi.loginWithGoogle(credential);
    tokenStore.set(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<string> => {
    const response = await authApi.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Cookie có thể đã bị xóa sẵn - vẫn đăng xuất phía client.
    }
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  const reloadUser = useCallback(async (): Promise<void> => {
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      setStatus('authenticated');
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'ADMIN',
      login,
      loginWithGoogle,
      register,
      logout,
      reloadUser,
    }),
    [user, status, login, loginWithGoogle, register, logout, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
