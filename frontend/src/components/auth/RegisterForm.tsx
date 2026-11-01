import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavbarLanguage } from '../../content/languages';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordField } from './PasswordField';

interface RegisterFormProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
  autoFocusName?: boolean;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onClose,
  onSwitchToLogin,
  autoFocusName = true,
}) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'busy' | 'sent'>('idle');

  const fullNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusName && !done) {
      fullNameInputRef.current?.focus();
    }
  }, [autoFocusName, done]);

  const update = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setValue = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleResend = async () => {
    setResendState('busy');
    try {
      await authApi.resendVerification(form.email.trim());
      setResendState('sent');
      showToast(t.auth.resent);
    } catch (err) {
      setResendState('idle');
      showToast(normalizeApiError(err).message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSubmitting(true);
    try {
      const message = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setDone(message || t.auth.checkEmailNotice);
    } catch (err) {
      const norm = normalizeApiError(err);
      setFieldErrors(norm.details ?? {});
      setError(norm.message);
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
          {t.auth.emailLabel}: <b>{form.email.trim()}</b>
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
            onClick={handleResend}
            disabled={resendState !== 'idle'}
          >
            {resendState === 'busy'
              ? t.auth.resending
              : resendState === 'sent'
                ? t.auth.resent
                : t.auth.resendVerification}
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
        {t.auth.registerTitle}
      </h2>

      <form onSubmit={handleSubmit} noValidate className="auth-modal-form">
        <label className="af" htmlFor="register-fullName">
          <span>{t.auth.fullNameLabel}</span>
          <input
            ref={fullNameInputRef}
            id="register-fullName"
            type="text"
            name="fullName"
            autoComplete="name"
            required
            value={form.fullName}
            onChange={update('fullName')}
            placeholder="Nguyễn Văn A"
          />
          {fieldErrors.fullName && (
            <span className="af-field-err">{fieldErrors.fullName}</span>
          )}
        </label>

        <label className="af" htmlFor="register-email">
          <span>{t.auth.emailLabel}</span>
          <input
            id="register-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            placeholder="ban@example.com"
          />
          {fieldErrors.email && (
            <span className="af-field-err">{fieldErrors.email}</span>
          )}
        </label>

        <PasswordField
          id="register-password"
          name="password"
          label={t.auth.passwordLabel}
          value={form.password}
          onChange={setValue('password')}
          autoComplete="new-password"
          required
          placeholder="Tối thiểu 8 ký tự"
          error={
            fieldErrors.password ? (
              <span className="af-field-err">{fieldErrors.password}</span>
            ) : undefined
          }
        />

        <PasswordField
          id="register-confirmPassword"
          name="confirmPassword"
          label={t.auth.confirmPasswordLabel}
          value={form.confirmPassword}
          onChange={setValue('confirmPassword')}
          autoComplete="new-password"
          required
          placeholder="Nhập lại mật khẩu"
          error={
            fieldErrors.confirmPassword ? (
              <span className="af-field-err">{fieldErrors.confirmPassword}</span>
            ) : undefined
          }
        />

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
          {submitting ? t.auth.registerSubmitting : t.auth.registerSubmit}
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
              onClose();
            }}
            onError={setError}
            disabled={submitting}
          />
        </>
      )}

      <p className="af-alt">
        {t.auth.hasAccount}{' '}
        <button
          type="button"
          className="af-link"
          onClick={onSwitchToLogin}
        >
          {t.auth.backToLogin}
        </button>
      </p>

      <p className="af-alt" style={{ fontSize: '0.8rem', marginTop: 10, opacity: 0.8 }}>
        Bằng việc tạo tài khoản, bạn đồng ý với{' '}
        <Link to="/chinh-sach-quyen-rieng-tu" className="af-link">
          Chính sách quyền riêng tư
        </Link>{' '}
        của Echora.
      </p>
    </div>
  );
};

export default RegisterForm;
