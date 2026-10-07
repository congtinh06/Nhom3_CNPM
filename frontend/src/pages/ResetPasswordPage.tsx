import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { PasswordField } from '../components/auth/PasswordField';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout, status } = useAuth();

  const tokenFromUrl = searchParams.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Đổi mật khẩu thành công thì phiên hiện tại (nếu có) không còn hợp lệ.
  useEffect(() => {
    if (done && status === 'authenticated') {
      void logout();
    }
  }, [done, status, logout]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.resetPassword({ token: token.trim(), newPassword, confirmPassword });
      setDone(response.message);
    } catch (err) {
      const norm = normalizeApiError(err);
      setFieldErrors(norm.details ?? {});
      setError(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-standalone-page">
      <div className="auth-standalone-card">
        <h2 className="auth-modal-title">Đặt lại mật khẩu</h2>

        {done ? (
          <>
            <p className="auth-note">{done}</p>
            <div className="auth-modal-actions">
              <button type="button" className="tb af-submit" onClick={() => navigate('/dang-nhap')}>
                Đăng nhập ngay
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="auth-modal-form">
            {!tokenFromUrl && (
              <label className="af" htmlFor="reset-token">
                <span>Token đặt lại mật khẩu</span>
                <input
                  id="reset-token"
                  type="text"
                  name="token"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Dán token trong email"
                />
                {fieldErrors.token && <span className="af-field-err">{fieldErrors.token}</span>}
              </label>
            )}

            <PasswordField
              id="reset-newPassword"
              name="newPassword"
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Tối thiểu 8 ký tự"
              error={
                fieldErrors.newPassword ? (
                  <span className="af-field-err">{fieldErrors.newPassword}</span>
                ) : undefined
              }
            />

            <PasswordField
              id="reset-confirmPassword"
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              required
              placeholder="Nhập lại mật khẩu mới"
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

            <button type="submit" className="tb af-submit" disabled={submitting || !token.trim()}>
              {submitting ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <p className="af-alt">
          <Link to="/quen-mat-khau" className="af-link">
            Yêu cầu liên kết mới
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
