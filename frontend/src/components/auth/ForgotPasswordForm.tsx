import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { useNavbarLanguage } from '../../content/languages';

interface ForgotPasswordFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  autoFocusEmail?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onClose,
  onSwitchToLogin,
  autoFocusEmail = true,
}) => {
  const { t } = useNavbarLanguage();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusEmail && !done) {
      emailInputRef.current?.focus();
    }
  }, [autoFocusEmail, done]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setDone(response.message);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="auth-modal-card">
        <h2 id="auth-modal-title" className="auth-modal-title">
          {t.auth.checkEmailTitle}
        </h2>
        <p className="auth-note">{done}</p>
        <p className="auth-note">
          {t.auth.emailLabel}: <b>{email.trim()}</b>
        </p>

        <div className="auth-modal-actions">
          <button
            type="button"
            className="tb af-submit"
            onClick={onClose}
          >
            {t.auth.close}
          </button>
          <button
            type="button"
            className="tb af-btn-secondary"
            onClick={() => {
              setDone(null);
              setEmail('');
            }}
          >
            Thử email khác
          </button>
        </div>

        <p className="af-alt">
          <button
            type="button"
            className="af-link"
            onClick={onSwitchToLogin}
          >
            {t.auth.backToLogin}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-modal-card">
      <h2 id="auth-modal-title" className="auth-modal-title">
        {t.auth.forgotPasswordTitle}
      </h2>

      <p className="auth-modal-intro">
        {t.auth.forgotNote}
      </p>

      <form onSubmit={handleSubmit} noValidate className="auth-modal-form">
        <label className="af" htmlFor="forgot-email">
          <span>{t.auth.emailLabel}</span>
          <input
            ref={emailInputRef}
            id="forgot-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
          />
        </label>

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
          {submitting ? t.auth.forgotSubmitting : t.auth.forgotSubmit}
        </button>
      </form>

      <p className="af-alt">
        {t.auth.rememberPassword}{' '}
        <button
          type="button"
          className="af-link"
          onClick={onSwitchToLogin}
        >
          {t.auth.backToLogin}
        </button>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
