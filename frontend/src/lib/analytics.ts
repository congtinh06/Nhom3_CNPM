export const ANALYTICS_SESSION_KEY = 'sv:session_id';

export function getAnalyticsSessionId(): string {
  try {
    let sid = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem(ANALYTICS_SESSION_KEY, sid);
    }
    return sid;
  } catch (err) {
    console.warn('[analytics] sessionStorage unavailable, using default session id', err);
    return 'sid_default';
  }
}
