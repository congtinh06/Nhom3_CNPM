import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface AdminRouteGuardProps {
  children?: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { status, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="adm-screen-loader" role="status" aria-label="Đang kiểm tra quyền truy cập">
        <div className="adm-spinner" />
        <p className="adm-loader-text">Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/quan-tri/dang-nhap"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="adm-forbidden-screen" role="alert">
        <div className="adm-forbidden-card">
          <div className="adm-forbidden-icon" aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="adm-forbidden-title">Quyền truy cập bị từ chối</h2>
          <p className="adm-forbidden-desc">
            Tài khoản của bạn không có quyền quản trị để truy cập khu vực này.
            Vui lòng đăng nhập bằng tài khoản quản trị viên hoặc quay về trang chủ.
          </p>
          <div className="adm-forbidden-actions">
            <Link to="/" className="adm-btn adm-btn-secondary">
              Về trang chủ
            </Link>
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              onClick={() => logout()}
            >
              Đổi tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
