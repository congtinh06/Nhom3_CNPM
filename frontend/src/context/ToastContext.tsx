import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div id="ts" role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

// Variant that degrades to a no-op when rendered outside ToastProvider so that
// pages which only *optionally* surface toasts can still render standalone
// (e.g. in unit tests) without crashing.
export const useToastOptional = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  return ctx ?? { showToast: () => {} };
};
