import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavbarLanguage } from '../../content/languages';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordField } from './PasswordField';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  autoFocusEmail?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgot,
  autoFocusEmail = true,
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusEmail) {
      emailInputRef.current?.focus();
    }
  }, [autoFocusEmail]);

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
    </div>
  );
};

export default LoginForm;
