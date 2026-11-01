import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Eye, ScanLine } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavbarLanguage } from '../../content/languages';
import { useGuestMode } from '../../lib/guestMode';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordField } from './PasswordField';
import { QrLoginPanel } from './QrLoginPanel';

interface LoginFormProps {
  onSuccess: () => void;
  /** Được gọi khi điện thoại quét mã ở chế độ Khách (đóng modal, giữ guest). */
  onGuestSuccess?: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  autoFocusEmail?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onGuestSuccess,
  onSwitchToRegister,
  onSwitchToForgot,
  autoFocusEmail = true,
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const guestMode = useGuestMode();

  const [mode, setMode] = useState<'password' | 'qr'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusEmail && mode === 'password') {
      emailInputRef.current?.focus();
    }
  }, [autoFocusEmail, mode]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const next = mode === 'password' ? 'qr' : 'password';
    setMode(next);
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
      showToast(t.auth.loginSuccess);
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
          aria-selected={mode === 'password'}
          aria-controls="auth-panel-password"
          tabIndex={mode === 'password' ? 0 : -1}
          className="auth-login-tab"
          onClick={() => setMode('password')}
        >
          {t.auth.loginTabPassword}
        </button>
        <button
          type="button"
          role="tab"
          id="auth-tab-qr"
          aria-selected={mode === 'qr'}
          aria-controls="auth-panel-qr"
          tabIndex={mode === 'qr' ? 0 : -1}
          className="auth-login-tab"
          onClick={() => setMode('qr')}
        >
          {t.auth.loginTabQr}
        </button>
      </div>

      {mode === 'password' ? (
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
                onSuccess={() => {
                  showToast(t.auth.loginSuccess);
                  onSuccess();
                }}
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

          <p className="af-alt" style={{ fontSize: '0.8rem', marginTop: 10, opacity: 0.8 }}>
            Xem <Link to="/chinh-sach-quyen-rieng-tu" className="af-link">Chính sách quyền riêng tư</Link> của Echora.
          </p>

          {onGuestSuccess && !guestMode && (
            <div className="auth-guest-alt">
              <button
                type="button"
                className="af-guest-link"
                onClick={onGuestSuccess}
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
          <button
            type="button"
            className="tb auth-qr-mobile-scan"
            onClick={() => {
              // Trên điện thoại: quét mã QR hiển thị trên máy tính để đăng nhập.
              const state = location.state as { backgroundLocation?: { pathname: string } } | null;
              navigate('/quet-qr-dang-nhap', {
                state: { backgroundLocation: state?.backgroundLocation ?? { pathname: '/' } },
              });
            }}
          >
            <ScanLine size={15} strokeWidth={1.75} aria-hidden="true" />
            {t.auth.qrScanDeviceButton}
          </button>
          <div className="auth-qr-desktop-only">
            <QrLoginPanel onSuccess={onSuccess} onGuestSuccess={onGuestSuccess} compact />
          </div>
          <p className="auth-qr-mobile-hint">{t.auth.qrMobileScanHint}</p>
          {onGuestSuccess && !guestMode && (
            <button
              type="button"
              className="tb auth-guest-quick-btn"
              onClick={onGuestSuccess}
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
