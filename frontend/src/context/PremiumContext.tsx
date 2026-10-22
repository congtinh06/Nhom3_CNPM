import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { AuthPlan, SupportedLanguage } from '../types';
import { useAuth } from './AuthContext';

export const FREE_LANGUAGES: SupportedLanguage[] = ['vi'];
export const PREMIUM_LANGUAGES: SupportedLanguage[] = ['en', 'ja', 'ko'];

export function isPremiumLanguage(language: SupportedLanguage): boolean {
  return PREMIUM_LANGUAGES.includes(language);
}

export interface PremiumContextValue {
  isPremium: boolean;
  plan: AuthPlan;
  premiumExpiresAt: string | null;
  canAccessLanguage: (language: SupportedLanguage) => boolean;
  refreshEntitlement: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

const FALLBACK_PREMIUM: PremiumContextValue = {
  isPremium: false,
  plan: 'FREE',
  premiumExpiresAt: null,
  canAccessLanguage: (language) => FREE_LANGUAGES.includes(language),
  refreshEntitlement: async () => undefined,
};

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, reloadUser } = useAuth();
  const isPremium = user?.plan === 'PREMIUM' && user?.premiumActive === true;
  const plan: AuthPlan = isPremium ? 'PREMIUM' : 'FREE';

  const canAccessLanguage = useCallback(
    (language: SupportedLanguage) => isPremium || FREE_LANGUAGES.includes(language),
    [isPremium]
  );

  const refreshEntitlement = useCallback(async () => {
    await reloadUser();
  }, [reloadUser]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium,
      plan,
      premiumExpiresAt: user?.premiumExpiresAt ?? null,
      canAccessLanguage,
      refreshEntitlement,
    }),
    [isPremium, plan, user?.premiumExpiresAt, canAccessLanguage, refreshEntitlement]
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
