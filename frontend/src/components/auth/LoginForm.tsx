import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useNavbarLanguage } from '../../content/languages';
import { useGuestMode } from '../../lib/guestMode';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordField } from './PasswordField';
import { QrLoginPanel } from './QrLoginPanel';

interface LoginFormProps {
  onSuccess: () => void;
  /** Đăng nhập bằng QR thành công (mặc định dùng chung onSuccess). */
  onQrSuccess?: () => void;
  /** "Tiếp tục với tư cách Khách": đóng modal và bật chế độ Khách. */
  onContinueAsGuest?: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  autoFocusEmail?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onQrSuccess,
  onContinueAsGuest,
  onSwitchToRegister,
  onSwitchToForgot,
  autoFocusEmail = true,
}) => {
  const { login } = useAuth();
  const { t } = useNavbarLanguage();
  const guestMode = useGuestMode();
  const isDesktop = useIsDesktop('(min-width: 900px)');

  const [mode, setMode] = useState<'password' | 'qr'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // QR đăng nhập kiểu Zalo: mã hiển thị trên máy tính, điện thoại đã đăng nhập
  // tài khoản thật quét để đăng nhập. Trên điện thoại không có tab QR.
  const activeMode = isDesktop ? mode : 'password';

  useEffect(() => {
    if (autoFocusEmail && activeMode === 'password') {
      emailInputRef.current?.focus();
    }
  }, [autoFocusEmail, activeMode]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const next = mode === 'password' ? 'qr' : 'password';
    setMode(next);
    if (!isDesktop) {
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(`auth-tab-${next}`)?.focus();
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, rememberMe });
      onSuccess();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-card">
      <h2 id="auth-modal-title" className="auth-modal-title">
        {t.auth.loginTitle}
      </h2>

      {isDesktop && (
        <div
          className="auth-login-tabs"
          role="tablist"
          aria-label={t.auth.loginTitle}
          onKeyDown={handleTabKeyDown}
        >
          <button
            type="button"
            role="tab"
            id="auth-tab-password"
            aria-selected={activeMode === 'password'}
            aria-controls="auth-panel-password"
            tabIndex={activeMode === 'password' ? 0 : -1}
            className="auth-login-tab"
            onClick={() => setMode('password')}
          >
            {t.auth.loginTabPassword}
          </button>
          <button
            type="button"
            role="tab"
            id="auth-tab-qr"
            aria-selected={activeMode === 'qr'}
            aria-controls="auth-panel-qr"
            tabIndex={activeMode === 'qr' ? 0 : -1}
            className="auth-login-tab"
            onClick={() => setMode('qr')}
          >
            {t.auth.loginTabQr}
          </button>
        </div>
      )}

      {activeMode === 'password' ? (
        <div
          id="auth-panel-password"
          role="tabpanel"
          aria-labelledby="auth-tab-password"
        >
          <form onSubmit={handleSubmit} noValidate className="auth-modal-form">
          <label className="af" htmlFor="login-email">
            <span>{t.auth.emailLabel}</span>
            <input
              ref={emailInputRef}
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
            />
          </label>

          <PasswordField
            id="login-password"
            name="password"
            label={t.auth.passwordLabel}
            value={password}
            onChange={setPassword}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            required
          />

          <div className="af-row">
            <label className="af-check" htmlFor="login-remember">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t.auth.rememberMe}</span>
            </label>
            <button
              type="button"
              className="af-link"
              onClick={onSwitchToForgot}
            >
              {t.auth.forgotPasswordLink}
            </button>
          </div>

          {error && (
            <p className="af-err" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="tb af-submit"
            disabled={submitting}
          >
            {submitting ? t.auth.loginSubmitting : t.auth.loginSubmit}
          </button>
        </form>

        {Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID) && (
          <>
            <div className="auth-divider">
              <span>hoặc</span>
            </div>

            <GoogleSignInButton
              onSuccess={onSuccess}
              onError={setError}
              disabled={submitting}
            />
          </>
        )}

        <p className="af-alt">
          {t.auth.noAccount}{' '}
          <button
            type="button"
            className="af-link"
            onClick={onSwitchToRegister}
          >
            {t.auth.createAccount}
          </button>
        </p>

        {onContinueAsGuest && !guestMode && (
          <div className="auth-guest-alt">
            <button
              type="button"
              className="af-guest-link"
              onClick={onContinueAsGuest}
            >
              <Eye size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>{t.auth.guestContinue}</span>
            </button>
          </div>
        )}
      </div>
      ) : (
        <div
          id="auth-panel-qr"
          role="tabpanel"
          aria-labelledby="auth-tab-qr"
          className="auth-qr-tab-panel"
        >
          <p className="auth-modal-intro auth-qr-tab-intro">{t.auth.qrSubtitle}</p>
          <div className="auth-qr-desktop-only">
            <QrLoginPanel onSuccess={onQrSuccess ?? onSuccess} compact />
          </div>
          <p className="auth-qr-mobile-hint">{t.auth.qrMobileScanHint}</p>
          {onContinueAsGuest && !guestMode && (
            <button
              type="button"
              className="tb auth-guest-quick-btn"
              onClick={onContinueAsGuest}
            >
              <Eye size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>{t.auth.guestContinue}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoginForm;
