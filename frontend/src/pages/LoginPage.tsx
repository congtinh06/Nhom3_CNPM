import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, AuthUser } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginWithEmail(email, password);
    if (!res.success) {
      setError(res.error || 'Đăng nhập thất bại.');
    } else {
      setError(null);
      if (email.toLowerCase().includes('admin')) {
        navigate('/reports');
      } else {
        navigate('/');
      }
    }
  };

  const handleSocialLogin = (name: string, socialEmail: string) => {
    const u: AuthUser = { name, email: socialEmail, role: 'user' };
    login(u);
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-subtitle">
          Đăng nhập để xem lại lịch sử báo cáo của bạn hoặc quản trị hệ thống.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              className={`input-public ${error ? 'has-error' : ''}`}
              placeholder="admin@bank.vn hoặc user@bank.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="form-group-public" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className={`input-public ${error ? 'has-error' : ''}`}
                style={{ paddingRight: '56px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary-public">
            Đăng nhập
          </button>

          {error && (
            <div className="validation-error-text" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}

          {import.meta.env.VITE_SHOW_VIEWER === 'true' && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                Tài khoản thử nghiệm nhanh:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="demo-btn active"
                  onClick={() => {
                    setEmail('admin@bank.vn');
                    setPassword('admin123');
                    setError(null);
                  }}
                >
                  🔑 Quản trị (admin@bank.vn)
                </button>
                <button
                  type="button"
                  className="demo-btn active"
                  onClick={() => {
                    setEmail('user@bank.vn');
                    setPassword('user123');
                    setError(null);
                  }}
                >
                  👤 Người dùng (user@bank.vn)
                </button>
              </div>
            </div>
          )}

          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          <div className="auth-social-row">
            <button
              type="button"
              className="btn-secondary-public auth-social-btn"
              onClick={() => handleSocialLogin('Google User', 'google.user@bank.vn')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Đăng nhập với Google
            </button>
            <button
              type="button"
              className="btn-secondary-public auth-social-btn"
              onClick={() => handleSocialLogin('Zalo User', 'zalo.user@bank.vn')}
            >
              <span style={{ fontWeight: 700, fontSize: '12px', color: '#0068ff' }}>Z</span>
              Đăng nhập với Zalo
            </button>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Chưa có tài khoản?{' '}
            <NavLink to="/register" className="accent-link">
              Đăng ký
            </NavLink>
          </div>
        </form>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Bạn không cần đăng nhập để{' '}
          <NavLink to="/" className="accent-link">
            kiểm tra liên kết
          </NavLink>
          .
        </div>
      </div>
    </div>
  );
};
