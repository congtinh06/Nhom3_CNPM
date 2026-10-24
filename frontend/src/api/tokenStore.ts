export const LOGGED_OUT_EVENT = 'echora:logged-out';

let accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
  },
  clear(): void {
    accessToken = null;
  },
};

export function notifyLoggedOut(): void {
  tokenStore.clear();
  window.dispatchEvent(new CustomEvent(LOGGED_OUT_EVENT));
}
