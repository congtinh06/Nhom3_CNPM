import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <span className="mono" style={{ fontWeight: 600 }}>403 FORBIDDEN</span>
        </div>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>Không có quyền truy cập</h1>
        <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '24px' }}>
          Tài khoản của bạn chưa được cấp quyền quản trị để xem trang này.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn-primary-public"
            onClick={() => navigate('/')}
          >
            Về trang Kiểm tra
          </button>
          {role !== 'admin' && (
            <button
              type="button"
              className="btn-secondary-public"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Đăng nhập quyền Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
