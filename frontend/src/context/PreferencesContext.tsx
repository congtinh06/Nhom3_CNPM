import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'vi' | 'en' | 'ja' | 'ko' | 'zh';
export type TextSize = '100%' | '125%' | '150%';
export type AppTheme = 'light' | 'high-contrast';
export type SpeechRate = 0.75 | 1.0;

export interface PreferencesState {
  language: AppLanguage;
  textSize: TextSize;
  theme: AppTheme;
  autoRead: boolean;
  speechRate: SpeechRate;
  reduceMotion: boolean;
  setLanguage: (lang: AppLanguage) => void;
  setTextSize: (size: TextSize) => void;
  setTheme: (theme: AppTheme) => void;
  setAutoRead: (enabled: boolean) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  setReduceMotion: (enabled: boolean) => void;
}

const STORAGE_KEY = 'bankshield_user_preferences';

const PreferencesContext = createContext<PreferencesState | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize state from localStorage or system defaults
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['vi', 'en', 'ja', 'ko', 'zh'].includes(parsed.language)) {
          return parsed.language;
        }
      }
      const navLang = (navigator.language || 'vi').split('-')[0].toLowerCase();
      if (['vi', 'en', 'ja', 'ko', 'zh'].includes(navLang)) {
        return navLang as AppLanguage;
      }
    } catch {
      // fallback
    }
    return 'vi';
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['100%', '125%', '150%'].includes(parsed.textSize)) {
          return parsed.textSize;
        }
      }
    } catch {
      // fallback
    }
    return '100%';
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (['light', 'high-contrast'].includes(parsed.theme)) {
          return parsed.theme;
        }
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  const [autoRead, setAutoReadState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autoRead === 'boolean') {
          return parsed.autoRead;
        }
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [speechRate, setSpeechRateState] = useState<SpeechRate>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.speechRate === 0.75 || parsed.speechRate === 1.0) {
          return parsed.speechRate;
        }
      }
    } catch {
      // fallback
    }
    // Default slow speech rate for seniors
    return 0.75;
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.reduceMotion === 'boolean') {
          return parsed.reduceMotion;
        }
      }
      // System prefers-reduced-motion fallback
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    } catch {
      // fallback
    }
    return false;
  });

  // 2. Persist to localStorage on any preference update
  useEffect(() => {
    try {
      const payload = {
        language,
        textSize,
        theme,
        autoRead,
        speechRate,
        reduceMotion,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage may fail in private browsing mode
    }

    // Apply attributes on document.documentElement
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-text-size', textSize);
      document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion));
    }
  }, [language, textSize, theme, autoRead, speechRate, reduceMotion]);

  const setLanguage = (lang: AppLanguage) => setLanguageState(lang);
  const setTextSize = (size: TextSize) => setTextSizeState(size);
  const setTheme = (t: AppTheme) => setThemeState(t);
  const setAutoRead = (enabled: boolean) => setAutoReadState(enabled);
  const setSpeechRate = (r: SpeechRate) => setSpeechRateState(r);
  const setReduceMotion = (enabled: boolean) => setReduceMotionState(enabled);

  return (
    <PreferencesContext.Provider
      value={{
        language,
        textSize,
        theme,
        autoRead,
        speechRate,
        reduceMotion,
        setLanguage,
        setTextSize,
        setTheme,
        setAutoRead,
        setSpeechRate,
        setReduceMotion,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesState => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
