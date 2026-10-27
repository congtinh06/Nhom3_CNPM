export const LOGGED_OUT_EVENT = 'echora:logged-out';

export type AuthScope = 'user' | 'admin';

export interface LoggedOutEventDetail {
  scope: AuthScope;
}

const accessTokens: Record<AuthScope, string | null> = {
  user: null,
  admin: null,
};

export const tokenStore = {
  get(scope: AuthScope = 'user'): string | null {
    return accessTokens[scope];
  },
  set(token: string | null, scope: AuthScope = 'user'): void {
    accessTokens[scope] = token;
  },
  // Không truyền scope = xóa toàn bộ phiên (dùng cho test/reset).
  clear(scope?: AuthScope): void {
    if (scope) {
      accessTokens[scope] = null;
      return;
    }
    accessTokens.user = null;
    accessTokens.admin = null;
  },
};

export function notifyLoggedOut(scope: AuthScope = 'user'): void {
  tokenStore.clear(scope);
  window.dispatchEvent(
    new CustomEvent<LoggedOutEventDetail>(LOGGED_OUT_EVENT, { detail: { scope } })
  );
}
