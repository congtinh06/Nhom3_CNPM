import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth';
import { clearLocalOrderCache } from '../services/orderCache';
import { exitGuestMode } from '../lib/guestMode';
import {
  AuthScope,
  LOGGED_OUT_EVENT,
  LoggedOutEventDetail,
  tokenStore,
} from '../api/tokenStore';
import { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '../types';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  completeQrLogin?: (sessionId: string, exchangeToken: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Chạy tối đa một lần trong một chuỗi trang (React StrictMode mount/umount/ mount lại).
const bootstrapPromises = new Map<AuthScope, Promise<AuthSession | null>>();

function bootstrapSession(scope: AuthScope): Promise<AuthSession | null> {
  const existing = bootstrapPromises.get(scope);
  if (existing) return existing;

  const promise = authApi
    .refresh(scope)
    .catch(async () => {
      const token = tokenStore.get(scope);
      if (!token) return null;
      try {
        const me = await authApi.me(scope);
        if (scope === 'user' && me.role === 'ADMIN') {
          tokenStore.clear('user');
          return null;
        }
        return {
          accessToken: token,
          tokenType: 'Bearer',
          expiresIn: 900,
          user: me,
        };
      } catch {
        return null;
      }
    })
    .finally(() => {
      bootstrapPromises.delete(scope);
    });

  bootstrapPromises.set(scope, promise);
  return promise;
}

export function authScopeForPath(pathname: string): AuthScope {
  return pathname.startsWith('/quan-tri') ? 'admin' : 'user';
}

const AuthProviderInner: React.FC<{ children: React.ReactNode; scope: AuthScope }> = ({
  children,
  scope,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setUser(null);

    void bootstrapSession(scope).then((session) => {
      if (cancelled) return;
      if (session) {
        tokenStore.set(session.accessToken, scope);
        setUser(session.user);
        setStatus('authenticated');
      } else {
        tokenStore.clear(scope);
        setUser(null);
        setStatus('guest');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    const handleLoggedOut = (event: Event) => {
      const detail = (event as CustomEvent<LoggedOutEventDetail>).detail;
      if ((detail?.scope ?? 'user') !== scope) return;
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener(LOGGED_OUT_EVENT, handleLoggedOut);
    return () => window.removeEventListener(LOGGED_OUT_EVENT, handleLoggedOut);
  }, [scope]);

  // Đăng nhập/đăng ký thật (mật khẩu, Google, QR thật, phiên cũ còn hạn)
  // đều kết thúc ở status 'authenticated' -> gở chế độ Khách một điểm duy nhất.
  useEffect(() => {
    if (scope === 'user' && status === 'authenticated') {
      exitGuestMode();
    }
  }, [scope, status]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      const session =
        scope === 'admin'
          ? await authApi.login(payload, scope)
          : await authApi.login(payload);
      if (scope === 'user' && session.user?.role === 'ADMIN') {
        tokenStore.clear('user');
        setUser(null);
        setStatus('guest');
        throw new Error('Tài khoản quản trị không thể đăng nhập ở giao diện người dùng.');
      }
      tokenStore.set(session.accessToken, scope);
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [scope]
  );

  const loginWithGoogle = useCallback(
    async (credential: string): Promise<AuthUser> => {
      const session =
        scope === 'admin'
          ? await authApi.loginWithGoogle(credential, scope)
          : await authApi.loginWithGoogle(credential);
      if (scope === 'user' && session.user?.role === 'ADMIN') {
        tokenStore.clear('user');
        setUser(null);
        setStatus('guest');
        throw new Error('Tài khoản quản trị không thể đăng nhập ở giao diện người dùng.');
      }
      tokenStore.set(session.accessToken, scope);
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [scope]
  );

  const completeQrLogin = useCallback(
    async (sessionId: string, exchangeToken: string): Promise<AuthUser> => {
      const session = await authApi.exchangeQrSession(sessionId, exchangeToken);
      if (scope === 'user' && session.user?.role === 'ADMIN') {
        tokenStore.clear('user');
        setUser(null);
        setStatus('guest');
        throw new Error('Tài khoản quản trị không thể đăng nhập ở giao diện người dùng.');
      }
      tokenStore.set(session.accessToken, scope);
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [scope]
  );

  const register = useCallback(async (payload: RegisterPayload): Promise<string> => {
    const response = await authApi.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (scope === 'admin') {
        await authApi.logout(scope);
      } else {
        await authApi.logout();
      }
    } catch {
      // Cookie có thể đã bị xóa sẵn - vẫn đăng xuất phía client.
    }
    tokenStore.clear(scope);
    if (scope === 'user') {
      clearLocalOrderCache();
    }
    setUser(null);
    setStatus('guest');
  }, [scope]);

  const reloadUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser =
        scope === 'admin' ? await authApi.me(scope) : await authApi.me();
      if (scope === 'user' && currentUser?.role === 'ADMIN') {
        tokenStore.clear('user');
        setUser(null);
        setStatus('guest');
        return;
      }
      setUser(currentUser);
      setStatus('authenticated');
    } catch {
      tokenStore.clear(scope);
      setUser(null);
      setStatus('guest');
    }
  }, [scope]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'ADMIN',
      login,
      loginWithGoogle,
      completeQrLogin,
      register,
      logout,
      reloadUser,
    }),
    [user, status, login, loginWithGoogle, completeQrLogin, register, logout, reloadUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const AuthProviderWithLocation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AuthProviderInner scope={authScopeForPath(location.pathname)}>
      {children}
    </AuthProviderInner>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    return <AuthProviderInner scope="user">{children}</AuthProviderInner>;
  }
  return <AuthProviderWithLocation>{children}</AuthProviderWithLocation>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

// Dùng cho các trang có thể render độc lập (test/standalone) mà vẫn muốn biết
// trạng thái đăng nhập khi có AuthProvider ở phía trên.
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
