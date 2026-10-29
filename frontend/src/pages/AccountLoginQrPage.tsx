import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavbarLanguage } from '../content/languages';
import { AccountLoginQr } from '../components/auth/AccountLoginQr';

/**
 * Trang dành cho máy tính đã đăng nhập: hiển thị mã QR để điện thoại quét và
 * đăng nhập cùng tài khoản.
 */
export const AccountLoginQrPage: React.FC = () => {
  const { t } = useNavbarLanguage();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card">
          <p className="auth-scan-intro">{t.auth.qrWaiting}</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/dang-nhap" replace />;
  }

  return (
    <div className="auth-scan-page">
      <div className="auth-scan-card auth-handoff-card">
        <div className="auth-scan-icon">
          <ShieldCheck size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h1>{t.auth.qrHandoffTitle}</h1>
        <AccountLoginQr compact />
        <p className="auth-scan-back">
          <Link to="/">
            <ArrowLeft size={15} aria-hidden="true" />
            {t.auth.qrBackHome}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AccountLoginQrPage;
