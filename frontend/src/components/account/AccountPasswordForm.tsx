import React, { FormEvent, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { PasswordField } from '../auth/PasswordField';
import { useAccountI18n } from './accountI18n';

interface AccountPasswordFormProps {
  onSuccess?: () => void;
}

export const AccountPasswordForm: React.FC<AccountPasswordFormProps> = ({ onSuccess }) => {
  const { t } = useAccountI18n();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: t.passwordMismatch });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
      showToast(t.passwordChanged);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (err) {
      const norm = normalizeApiError(err);
      setFieldErrors(norm.details ?? {});
      setError(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ac-form" onSubmit={handleChangePassword} noValidate>
      <PasswordField
        name="oldPassword"
        label={t.oldPassword}
        value={oldPassword}
        onChange={setOldPassword}
        autoComplete="current-password"
        required
        error={
          fieldErrors.oldPassword ? (
            <em className="ac-field-error">{fieldErrors.oldPassword}</em>
          ) : undefined
        }
      />

      <PasswordField
        name="newPassword"
        label={t.newPassword}
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
        required
        minLength={8}
        placeholder={t.newPasswordHint}
        error={
          fieldErrors.newPassword ? (
            <em className="ac-field-error">{fieldErrors.newPassword}</em>
          ) : undefined
        }
      />

      <PasswordField
        name="confirmPassword"
        label={t.confirmPassword}
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        required
        error={
          fieldErrors.confirmPassword ? (
            <em className="ac-field-error">{fieldErrors.confirmPassword}</em>
          ) : undefined
        }
      />

      {error && (
        <p className="ac-error" role="alert">
          {error}
        </p>
      )}

      <div className="ac-form-actions">
        <button type="submit" className="ac-btn ac-btn-primary" disabled={submitting}>
          {submitting ? t.changingPassword : t.changePassword}
        </button>
      </div>
    </form>
  );
};

export default AccountPasswordForm;
