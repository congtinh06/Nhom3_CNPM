import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, AuthUser } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    const res = registerUser(name, email, password);
    if (!res.success) {
      setError(res.error || 'Đăng ký thất bại.');
    } else {
      setError(null);
      navigate('/');
    }
  };

  const handleSocialRegister = (socialName: string, socialEmail: string) => {
    const u: AuthUser = { name: socialName, email: socialEmail, role: 'user' };
    login(u);
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
          Đăng ký tài khoản người dùng để lưu lại lịch sử báo cáo.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
              Họ và tên
            </label>
            <input
              type="text"
              className="input-public"
              placeholder="Nguyễn Văn An"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              className="input-public"
              placeholder="user@bank.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              className="input-public"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className="form-hint" style={{ marginTop: '4px' }}>
              Tối thiểu 8 ký tự.
            </div>
          </div>

          <div className="form-group-public" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
              Nhập lại mật khẩu
            </label>
            <input
              type="password"
              className="input-public"
              placeholder="Nhập lại mật khẩu vừa tạo"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <button type="submit" className="btn-primary-public">
            Đăng ký
          </button>

          {error && (
            <div className="validation-error-text" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}

          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          <div className="auth-social-row">
            <button
              type="button"
              className="btn-secondary-public auth-social-btn"
              onClick={() => handleSocialRegister('Google User', 'google.user@bank.vn')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Tiếp tục với Google
            </button>
            <button
              type="button"
              className="btn-secondary-public auth-social-btn"
              onClick={() => handleSocialRegister('Zalo User', 'zalo.user@bank.vn')}
            >
              <span style={{ fontWeight: 700, fontSize: '12px', color: '#0068ff' }}>Z</span>
              Tiếp tục với Zalo
            </button>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Đã có tài khoản?{' '}
            <NavLink to="/login" className="accent-link">
              Đăng nhập
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};
