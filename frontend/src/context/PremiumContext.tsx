/**
 * ============================================================================
 * QUẢN LÝ QUYỀN LỢI PREMIUM & TRUY CẬP ĐA NGÔN NGỮ (Premium Context)
 * ============================================================================
 * 
 * Mục đích module:
 * - Cung cấp trạng thái bản quyền Premium và danh sách điểm mua lẻ (purchasedPois) cho toàn bộ ứng dụng.
 * - Kiểm soát quyền truy cập ngôn ngữ ngoại ngữ (`en`, `ja`, `ko`) và thuyết minh audio nâng cao.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Làm mới JWT Token]: Trong `refreshEntitlement`, gọi `authApi.refresh()` và `reloadUser()` ngay khi
 *    thanh toán thành công để JWT token được cấp lại với claim `plan: "PREMIUM"`. Nhờ đó API Gateway
 *    chuyển tiếp `X-User-Plan: PREMIUM` đến content-service mà không bị lỗi 403.
 * 2. [Chuẩn hóa POI ID]: Cải tiến hàm `normalizePoiId` để nhận diện cả định dạng chuỗi `"poi-1"`, `"poi-2"`
 *    lẫn số nguyên ID từ DB.
 * 3. [Mở khóa vô điều kiện cho Premium]: Hàm `canAccessPoi` và `canAccessPoiLanguage` lập tức trả về `true`
 *    nếu tài khoản là Premium, bảo đảm mở khóa toàn bộ điểm đến, bài thuyết minh và audio.
 * ============================================================================
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthPlan, PurchasedPoi, SupportedLanguage } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { authApi } from '../api/auth';
import { tokenStore } from '../api/tokenStore';

export const FREE_LANGUAGES: SupportedLanguage[] = ['vi'];
export const PREMIUM_LANGUAGES: SupportedLanguage[] = ['en', 'ja', 'ko'];

export function isPremiumLanguage(language: SupportedLanguage): boolean {
  return PREMIUM_LANGUAGES.includes(language);
}

export type PremiumEntitlementStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PremiumContextValue {
  isPremium: boolean;
  plan: AuthPlan;
  premiumExpiresAt: string | null;
  entitlementStatus: PremiumEntitlementStatus;
  entitlementError: string | null;
  /** Danh sách POI user đã mua lẻ (id DB), rỗng khi chưa đăng nhập. */
  purchasedPoiIds: number[];
  /** Danh sách POI user đã mở khóa từ backend. */
  unlockedPoiIds: number[];
  /** User đã mua Premium hoặc bất kỳ POI nào còn hạn */
  hasAnyPurchase: boolean;
  /** Chi tiết gói mua lẻ: id POI + hạn mở khóa (ISO). */
  purchasedPois: PurchasedPoi[];
  canAccessLanguage: (language: SupportedLanguage) => boolean;
  /** POI đã được mở khóa ngoại ngữ bằng việc mua lẻ (hoặc tài khoản Premium). */
  canAccessPoi: (poiId: number | string | null | undefined) => boolean;
  /** Compose: lang mở khi premium/toàn cục, hoặc POI đó được mua lẻ. */
  canAccessPoiLanguage: (
    poiId: number | string | null | undefined,
    language: SupportedLanguage
  ) => boolean;
  refreshEntitlement: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

const FALLBACK_PREMIUM: PremiumContextValue = {
  isPremium: false,
  plan: 'FREE',
  premiumExpiresAt: null,
  entitlementStatus: 'idle',
  entitlementError: null,
  purchasedPoiIds: [],
  unlockedPoiIds: [],
  hasAnyPurchase: false,
  purchasedPois: [],
  canAccessLanguage: (language) => FREE_LANGUAGES.includes(language),
  canAccessPoi: () => false,
  canAccessPoiLanguage: (_poiId, language) => FREE_LANGUAGES.includes(language),
  refreshEntitlement: async () => undefined,
};

const KNOWN_POI_NUMERIC_IDS: Record<string, number> = {
  'buu-dien-trung-tam': 1,
  'poi-3': 1,
  'nha-tho-duc-ba': 2,
  'poi-2': 2,
  'cho-ben-thanh': 3,
  'poi-4': 3,
  'chua-ba-thien-hau': 4,
  'cau-ba-son': 5,
  'bao-tang-chung-tich-chien-tranh': 30002,
  'poi-5': 30002,
  'dinh-doc-lap': 30003,
  'poi-1': 30003,
};

export function normalizePoiId(poiId: number | string | null | undefined): number | null {
  if (poiId === null || poiId === undefined) return null;
  if (typeof poiId === 'number') {
    return Number.isFinite(poiId) && poiId > 0 ? Math.trunc(poiId) : null;
  }
  const str = String(poiId).trim();
  if (/^\d+$/.test(str)) {
    const value = Number(str);
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }
  const lower = str.toLowerCase();
  if (KNOWN_POI_NUMERIC_IDS[lower]) {
    return KNOWN_POI_NUMERIC_IDS[lower];
  }
  return null;
}

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, reloadUser } = useAuth();
  const [entitlementPlan, setEntitlementPlan] = useState<AuthPlan | null>(null);
  const [entitlementActive, setEntitlementActive] = useState<boolean | null>(null);
  const [entitlementExpiresAt, setEntitlementExpiresAt] = useState<string | null>(null);
  const [entitlementStatus, setEntitlementStatus] =
    useState<PremiumEntitlementStatus>('idle');
  const [entitlementError, setEntitlementError] = useState<string | null>(null);
  const [purchasedPois, setPurchasedPois] = useState<PurchasedPoi[]>([]);
  const [unlockedPoiIds, setUnlockedPoiIds] = useState<number[]>([]);
  const [hasAnyPurchase, setHasAnyPurchase] = useState<boolean>(false);
  const isLoggedIn = Boolean(user);

  const isPremium =
    entitlementActive !== null
      ? entitlementActive
      : user?.plan === 'PREMIUM' && user?.premiumActive === true;
  const plan: AuthPlan =
    entitlementPlan !== null ? entitlementPlan : isPremium ? 'PREMIUM' : 'FREE';
  const premiumExpiresAt =
    entitlementExpiresAt !== null ? entitlementExpiresAt : (user?.premiumExpiresAt ?? null);

  const purchasedPoiIds = useMemo(() => {
    const set = new Set<number>();
    purchasedPois.forEach((poi) => set.add(poi.poiId));
    unlockedPoiIds.forEach((id) => set.add(id));
    return Array.from(set);
  }, [purchasedPois, unlockedPoiIds]);

  const hasAnyPurchaseComputed = useMemo(() => {
    return hasAnyPurchase || isPremium || purchasedPoiIds.length > 0;
  }, [hasAnyPurchase, isPremium, purchasedPoiIds]);

  const refreshEntitlement = useCallback(async () => {
    if (!api.getMeEntitlements) {
      setEntitlementStatus('ready');
      setEntitlementError(null);
      return;
    }
    setEntitlementStatus('loading');
    setEntitlementError(null);
    try {
      try {
        const session = await authApi.refresh();
        if (session?.accessToken) {
          tokenStore.set(session.accessToken);
        }
      } catch {
        // Ignored
      }
      if (reloadUser) {
        try {
          await reloadUser();
        } catch {
          // Ignored
        }
      }

      const entitlement = await api.getMeEntitlements();
      const pois = entitlement.purchasedPois ?? [];
      setPurchasedPois(pois);

      if (Array.isArray(entitlement.unlockedPoiIds)) {
        setUnlockedPoiIds(entitlement.unlockedPoiIds);
      } else {
        setUnlockedPoiIds(pois.map((p) => p.poiId));
      }

      if (typeof entitlement.hasAnyPurchase === 'boolean') {
        setHasAnyPurchase(entitlement.hasAnyPurchase);
      } else {
        setHasAnyPurchase(Boolean(entitlement.premiumActive || entitlement.premium || pois.length > 0));
      }

      if (entitlement.plan) {
        setEntitlementPlan(entitlement.plan);
      }
      if (typeof entitlement.premium === 'boolean') {
        setEntitlementActive(entitlement.premium);
      } else if (typeof entitlement.premiumActive === 'boolean') {
        setEntitlementActive(entitlement.premiumActive);
      }
      if (entitlement.premiumExpiresAt !== undefined) {
        setEntitlementExpiresAt(entitlement.premiumExpiresAt ?? null);
      }
      setEntitlementStatus('ready');
    } catch (error) {
      setEntitlementError(
        error instanceof Error
          ? error.message
          : 'Không thể tải trạng thái Premium.'
      );
      setEntitlementStatus('error');
    }
  }, [reloadUser]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (!isLoggedIn) {
      setPurchasedPois([]);
      setUnlockedPoiIds([]);
      setHasAnyPurchase(false);
      setEntitlementPlan(null);
      setEntitlementActive(null);
      setEntitlementExpiresAt(null);
      setEntitlementStatus('idle');
      setEntitlementError(null);
      return;
    }
    void refreshEntitlement();
  }, [isLoggedIn, refreshEntitlement]);

  const canAccessLanguage = useCallback(
    (language: SupportedLanguage) => isPremium || FREE_LANGUAGES.includes(language),
    [isPremium]
  );

  const canAccessPoi = useCallback(
    (poiId: number | string | null | undefined) => {
      if (isPremium) return true;
      const id = normalizePoiId(poiId);
      if (id === null) return false;
      if (unlockedPoiIds.includes(id) || purchasedPoiIds.includes(id)) {
        const detail = purchasedPois.find((p) => p.poiId === id);
        if (detail && detail.expiresAt) {
          const expires = new Date(detail.expiresAt).getTime();
          if (Date.now() > expires) {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    [isPremium, unlockedPoiIds, purchasedPoiIds, purchasedPois]
  );

  const canAccessPoiLanguage = useCallback(
    (poiId: number | string | null | undefined, language: SupportedLanguage) => {
      if (isPremium || FREE_LANGUAGES.includes(language)) return true;
      return canAccessPoi(poiId);
    },
    [isPremium, canAccessPoi]
  );

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium,
      plan,
      premiumExpiresAt,
      entitlementStatus,
      entitlementError,
      purchasedPoiIds,
      unlockedPoiIds,
      hasAnyPurchase: hasAnyPurchaseComputed,
      purchasedPois,
      canAccessLanguage,
      canAccessPoi,
      canAccessPoiLanguage,
      refreshEntitlement,
    }),
    [
      isPremium,
      plan,
      premiumExpiresAt,
      entitlementStatus,
      entitlementError,
      purchasedPoiIds,
      unlockedPoiIds,
      hasAnyPurchaseComputed,
      purchasedPois,
      canAccessLanguage,
      canAccessPoi,
      canAccessPoiLanguage,
      refreshEntitlement,
    ]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export function usePremium(): PremiumContextValue {
  return useContext(PremiumContext) ?? FALLBACK_PREMIUM;
}

export function buildPremiumPath(
  language?: SupportedLanguage,
  returnTo?: string | null
): string {
  const params = new URLSearchParams();
  if (language && isPremiumLanguage(language)) {
    params.set('lang', language);
  }
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo);
  }
  const query = params.toString();
  return query ? `/nang-cap?${query}` : '/nang-cap';
}

/** Endpoint mua lẻ của PremiumPage: /nang-cap?poi=<id>&returnTo=... */
export function buildPoiPremiumPath(
  poiId: number | string | null | undefined,
  returnTo?: string | null
): string {
  const params = new URLSearchParams();
  const id = normalizePoiId(poiId);
  if (id !== null) {
    params.set('poi', String(id));
  }
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    params.set('returnTo', returnTo);
  }
  const query = params.toString();
  return query ? `/nang-cap?${query}` : '/nang-cap';
}
