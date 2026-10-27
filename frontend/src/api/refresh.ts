import axios from 'axios';
import { AuthSession } from '../types';
import { AuthScope, tokenStore } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Single-flight riêng cho từng phiên: user và admin không dùng chung refresh token.
const refreshPromises = new Map<AuthScope, Promise<AuthSession>>();

/**
 * Single-flight refresh cho toan bo ung dung.
 * AuthContext, interceptor 401 va PremiumContext dung chung mot promise de
 * tranh gui nhieu refresh token cung luc (backend se coi la reuse va thu hoi phien).
 */
export function refreshSession(scope: AuthScope = 'user'): Promise<AuthSession> {
  const existing = refreshPromises.get(scope);
  if (existing) return existing;

  const promise = axios
    .post<AuthSession>(
      `${BASE_URL}/api/auth/refresh`,
      {},
      {
        withCredentials: true,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Scope': scope,
        },
      }
    )
    .then((response) => {
      tokenStore.set(response.data.accessToken, scope);
      return response.data;
    })
    .finally(() => {
      refreshPromises.delete(scope);
    });

  refreshPromises.set(scope, promise);
  return promise;
}
