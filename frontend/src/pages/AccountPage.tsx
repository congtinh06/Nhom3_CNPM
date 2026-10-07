import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PasswordField } from '../components/auth/PasswordField';

export const AccountPage: React.FC = () => {
  const { user, status, isAdmin, logout, reloadUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'guest') {
      navigate('/dang-nhap', { state: { from: '/tai-khoan' }, replace: true });
    }
  }, [status, navigate]);

  const handleLogout = async () => {
    await logout();
    showToast('Bạn đã đăng xuất');
    navigate('/');
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
      showToast(response.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await reloadUser();
    } catch (err) {
      const norm = normalizeApiError(err);
      setFieldErrors(norm.details ?? {});
      setError(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || !user) {
    return (
      <section className="s auth">
        <div className="auth-card">
          <p className="auth-kicker">SaigonVoice</p>
          <h2>Tài khoản</h2>
          <p className="auth-note">Đang tải thông tin…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="s auth">
      <div className="auth-card">
        <p className="auth-kicker">SaigonVoice</p>
        <h2>Tài khoản</h2>

        <dl className="auth-info">
          <div>
            <dt>Họ tên</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Vai trò</dt>
            <dd>{isAdmin ? 'Quản trị viên' : 'Người dùng'}</dd>
          </div>
          <div>
            <dt>Trạng thái email</dt>
            <dd>{user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</dd>
          </div>
        </dl>

        {!user.emailVerified && (
          <p className="af-err" role="status">
            Tài khoản chưa xác thực email.{' '}
            <Link to="/xac-thuc-email">Xác thực ngay</Link>
          </p>
        )}

        <div className="auth-actions">
          <button type="button" className="tb" onClick={handleLogout}>
            Đăng xuất
          </button>
          <Link className="tb" to="/">
            Về trang chủ
          </Link>
        </div>

        <h3 className="auth-sub">Đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword} noValidate>
          <PasswordField
            name="oldPassword"
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChange={setOldPassword}
            autoComplete="current-password"
            required
            error={
              fieldErrors.oldPassword ? (
                <em className="af-field-err">{fieldErrors.oldPassword}</em>
              ) : undefined
            }
          />

          <PasswordField
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
                <em className="af-field-err">{fieldErrors.newPassword}</em>
              ) : undefined
            }
          />

          <PasswordField
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            error={
              fieldErrors.confirmPassword ? (
                <em className="af-field-err">{fieldErrors.confirmPassword}</em>
              ) : undefined
            }
          />

          {error && (
            <p className="af-err" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="tb af-submit" disabled={submitting}>
            {submitting ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AccountPage;
