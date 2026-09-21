import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface RegisterFormProps {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  emailError?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  generalError?: string;
}

const RegisterCard: React.FC<RegisterFormProps> = ({
  fullName = '',
  email = '',
  password = '',
  confirmPassword = '',
  emailError,
  passwordError,
  confirmPasswordError,
  generalError,
}) => {
  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
      <div className="auth-panel-420">
        <h1 className="auth-title">Tạo tài khoản</h1>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Họ và tên
            </label>
            <input
              type="text"
              className="input-public"
              defaultValue={fullName}
            />
          </div>

          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="text"
              className={`input-public ${emailError ? 'has-error' : ''}`}
              defaultValue={email}
            />
            {emailError && <div className="validation-error-text">{emailError}</div>}
          </div>

          <div className="form-group-public">
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              className={`input-public ${passwordError ? 'has-error' : ''}`}
              defaultValue={password}
            />
            {passwordError ? (
              <div className="validation-error-text">{passwordError}</div>
            ) : (
              <div className="form-hint" style={{ marginTop: '4px' }}>Tối thiểu 8 ký tự.</div>
            )}
          </div>

          <div className="form-group-public" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Nhập lại mật khẩu
            </label>
            <input
              type="password"
              className={`input-public ${confirmPasswordError ? 'has-error' : ''}`}
              defaultValue={confirmPassword}
            />
            {confirmPasswordError && <div className="validation-error-text">{confirmPasswordError}</div>}
          </div>

          <button type="button" className="btn-primary-public">
            Đăng ký
          </button>

          {generalError && (
            <div className="validation-error-text" style={{ marginTop: '12px' }}>
              {generalError}
            </div>
          )}

          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          <div className="auth-social-row">
            <button type="button" className="btn-secondary-public auth-social-btn">
              Tiếp tục với Google
            </button>
            <button type="button" className="btn-secondary-public auth-social-btn">
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

export const RegisterPage: React.FC = () => {
  return (
    <div className="canvas-stack">
      {/* SCREEN "Đăng ký" — FRAME 4 (Default) */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Đăng nhập" />
        <main className="page-content">
          <RegisterCard />
        </main>
        <Footer />
      </div>

      {/* SCREEN "Đăng ký" — FRAME 5 (Validation errors) */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Đăng nhập" />
        <main className="page-content">
          <RegisterCard
            fullName="Nguyễn Văn A"
            email="invalid-email"
            password="123"
            confirmPassword="456"
            emailError="Email không hợp lệ."
            passwordError="Mật khẩu cần tối thiểu 8 ký tự."
            confirmPasswordError="Mật khẩu nhập lại không khớp."
          />
        </main>
        <Footer />
      </div>

      {/* SCREEN "Đăng ký" — FRAME 6 (Email exists) */}
      <div className="frame-1440">
        <Navbar navState="PUBLIC" activeTab="Đăng nhập" />
        <main className="page-content">
          <RegisterCard
            fullName="Trần Thị B"
            email="existing@domain.com"
            password="password123"
            confirmPassword="password123"
            generalError="Email này đã được đăng ký."
          />
        </main>
        <Footer />
      </div>
    </div>
  );
};
