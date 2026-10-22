import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { normalizeAdminError } from '../api/adminClient';
import { FormField } from '../components/FormField';
import { BRAND_NAME } from '../brand/brand';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, status, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      const destination = (location.state as { from?: string } | null)?.from || '/quan-tri';
      navigate(destination, { replace: true });
    }
  }, [status, isAdmin, navigate, location.state]);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    document.title = `Đăng nhập quản trị - ${BRAND_NAME}`;
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const loggedUser = await login({ email: normalizedEmail, password });
      if (loggedUser.role !== 'ADMIN') {
        await logout();
        setError('Tài khoản không có quyền quản trị.');
        return;
      }

      const destination = (location.state as { from?: string } | null)?.from || '/quan-tri';
      navigate(destination, { replace: true });
    } catch (err) {
      const norm = normalizeAdminError(err);
      setError(norm.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-login-screen">
      <div className="adm-login-card">
        <header className="adm-login-head">
          <span className="adm-login-brand">{BRAND_NAME}</span>
          <p className="adm-login-brand-desc">Thuyết minh tự động cho địa điểm và quà lưu niệm</p>
          <h1 className="adm-login-title">Đăng nhập quản trị</h1>
          <p className="adm-login-subtitle">Quản lý và kiểm duyệt nội dung thuyết minh</p>
        </header>

        {error && (
          <div className="adm-auth-err" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="adm-login-form" noValidate>
          <FormField label="Email quản trị" htmlFor="adm-login-email" required>
            <input
              ref={emailInputRef}
              id="adm-login-email"
              type="email"
              name="email"
              autoComplete="username"
              className="adm-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email quản trị"
              disabled={submitting}
              required
            />
          </FormField>

          <FormField label="Mật khẩu" htmlFor="adm-login-password" required>
            <input
              id="adm-login-password"
              type="password"
              name="password"
                  autoComplete="current-password"
                  className="adm-input"
                  placeholder="Nhập mật khẩu quản trị"
                  value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </FormField>

          <button
            type="submit"
            className="adm-btn adm-btn-primary adm-login-submit"
            disabled={submitting}
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="adm-login-foot">
          <Link to="/" className="adm-login-back-link">
            Quay lại trang chủ du khách
          </Link>
        </div>
      </div>
    </div>
  );
};
