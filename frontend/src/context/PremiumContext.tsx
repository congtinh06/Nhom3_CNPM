import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { SupportedLanguage } from '../types';

export const FREE_LANGUAGES: SupportedLanguage[] = ['vi'];
export const PREMIUM_LANGUAGES: SupportedLanguage[] = ['en', 'ja', 'ko'];
export const PREMIUM_STORAGE_KEY = 'echora:premium';
const PREMIUM_CHANGE_EVENT = 'echora:premium-change';

export function isPremiumLanguage(language: SupportedLanguage): boolean {
  return PREMIUM_LANGUAGES.includes(language);
}

export function readStoredPremium(): boolean {
  try {
    return localStorage.getItem(PREMIUM_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistPremium(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(PREMIUM_STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(PREMIUM_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors so the in-memory state still works.
  }
  window.dispatchEvent(new CustomEvent(PREMIUM_CHANGE_EVENT, { detail: value }));
}

export interface PremiumContextValue {
  isPremium: boolean;
  canAccessLanguage: (language: SupportedLanguage) => boolean;
  activatePremium: () => void;
  deactivatePremium: () => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState<boolean>(readStoredPremium);

  useEffect(() => {
    const syncFromStorage = () => setIsPremium(readStoredPremium());
    const handleCustomChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setIsPremium(Boolean(customEvent.detail));
    };

    window.addEventListener(PREMIUM_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(PREMIUM_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const activatePremium = useCallback(() => {
    persistPremium(true);
    setIsPremium(true);
  }, []);

  const deactivatePremium = useCallback(() => {
    persistPremium(false);
    setIsPremium(false);
  }, []);

  const canAccessLanguage = useCallback(
    (language: SupportedLanguage) => isPremium || FREE_LANGUAGES.includes(language),
    [isPremium]
  );

  const value = useMemo(
    () => ({ isPremium, canAccessLanguage, activatePremium, deactivatePremium }),
    [isPremium, canAccessLanguage, activatePremium, deactivatePremium]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export function usePremium(): PremiumContextValue {
  const context = useContext(PremiumContext);
  const [fallbackPremium, setFallbackPremium] = useState<boolean>(readStoredPremium);

  useEffect(() => {
    if (context) return;
    const syncFromStorage = () => setFallbackPremium(readStoredPremium());
    const handleCustomChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setFallbackPremium(Boolean(customEvent.detail));
    };

    window.addEventListener(PREMIUM_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(PREMIUM_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [context]);

  const fallbackValue = useMemo<PremiumContextValue>(
    () => ({
      isPremium: fallbackPremium,
      canAccessLanguage: (language) =>
        fallbackPremium || FREE_LANGUAGES.includes(language),
      activatePremium: () => {
        persistPremium(true);
        setFallbackPremium(true);
      },
      deactivatePremium: () => {
        persistPremium(false);
        setFallbackPremium(false);
      },
    }),
    [fallbackPremium]
  );

  return context ?? fallbackValue;
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
