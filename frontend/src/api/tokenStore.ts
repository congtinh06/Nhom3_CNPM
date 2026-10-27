export const LOGGED_OUT_EVENT = 'echora:logged-out';

export type AuthScope = 'user' | 'admin';

export interface LoggedOutEventDetail {
  scope: AuthScope;
}

export const USER_TOKEN_KEY = 'echora_user_token';
export const ADMIN_TOKEN_KEY = 'echora_admin_token';

export function tokenKeyForScope(scope: AuthScope = 'user'): string {
  return scope === 'admin' ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY;
}

const accessTokens: Record<AuthScope, string | null> = {
  user: null,
  admin: null,
};

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key) || window.sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore quota or security errors
  }
}

export const tokenStore = {
  get(scope: AuthScope = 'user'): string | null {
    if (accessTokens[scope]) {
      return accessTokens[scope];
    }
    const stored = readStorage(tokenKeyForScope(scope));
    if (stored) {
      accessTokens[scope] = stored;
      return stored;
    }
    return null;
  },
  set(token: string | null, scope: AuthScope = 'user'): void {
    accessTokens[scope] = token;
    writeStorage(tokenKeyForScope(scope), token);
  },
  // Không truyền scope = xóa toàn bộ phiên (dùng cho test/reset).
  clear(scope?: AuthScope): void {
    if (scope) {
      accessTokens[scope] = null;
      writeStorage(tokenKeyForScope(scope), null);
      return;
    }
    accessTokens.user = null;
    accessTokens.admin = null;
    writeStorage(USER_TOKEN_KEY, null);
    writeStorage(ADMIN_TOKEN_KEY, null);
  },
};

export function notifyLoggedOut(scope: AuthScope = 'user'): void {
  tokenStore.clear(scope);
  window.dispatchEvent(
    new CustomEvent<LoggedOutEventDetail>(LOGGED_OUT_EVENT, { detail: { scope } })
  );
}
