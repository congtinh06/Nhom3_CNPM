import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}
        aria-busy="true"
        aria-live="polite"
      >
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (status === 'guest') {
    return (
      <Navigate
        to="/dang-nhap"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
