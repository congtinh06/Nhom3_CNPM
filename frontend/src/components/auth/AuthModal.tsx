import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, X } from 'lucide-react';
import { useNavbarLanguage } from '../../content/languages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { enterGuestMode, useGuestMode } from '../../lib/guestMode';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export type AuthModalView = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  initialView?: AuthModalView;
  isStandalone?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialView,
  isStandalone = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const guestMode = useGuestMode();
  const accountName = user?.fullName?.trim() || user?.email?.trim() || '';

  const [loginSuccess, setLoginSuccess] = useState(false);

  const redirectTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Determine current view from pathname or initialView prop
  let currentView: AuthModalView = initialView || 'login';
  if (!initialView) {
    if (location.pathname === '/dang-ky') {
      currentView = 'register';
    } else if (location.pathname === '/quen-mat-khau') {
      currentView = 'forgot';
    } else {
      currentView = 'login';
    }
  }

  const locationState = location.state as {
    backgroundLocation?: { pathname: string; search?: string; hash?: string };
    from?: string;
  } | null;

  const returnTarget = locationState?.from;
  const hasBackground = Boolean(locationState?.backgroundLocation);

  const isProtectedPath = (path?: string | null): boolean => {
    if (!path) return false;
    return (
      path.startsWith('/thanh-toan') ||
      path.startsWith('/don-hang') ||
      path.startsWith('/tai-khoan')
    );
  };

  // Close handler: back or fallback
  const handleClose = useCallback(() => {
    // Đang hiện màn hình "Đăng nhập thành công" thì không cho đóng giữa chừng.
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setLoginSuccess(false);

    if (isStandalone) {
      navigate('/', { replace: true });
      return;
    }

    if (hasBackground) {
      navigate(-1);
    } else if (returnTarget && !isProtectedPath(returnTarget)) {
      navigate(returnTarget, { replace: true });
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [hasBackground, returnTarget, isStandalone, navigate]);

  // Điều hướng sau khi xác thực xong (dùng chung cho đăng nhập và QR khách).
  const navigateAfterAuth = useCallback(() => {
    if (returnTarget) {
      navigate(returnTarget, { replace: true });
    } else if (hasBackground && !isStandalone) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [returnTarget, hasBackground, isStandalone, navigate]);

  // Login success handler: hiện màn hình chúc mừng ngắn rồi mới chuyển trang.
  const handleLoginSuccess = useCallback(() => {
    setLoginSuccess(true);
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = window.setTimeout(() => {
      showToast(t.auth.loginSuccess);
      navigateAfterAuth();
    }, 900);
  }, [navigateAfterAuth, showToast, t.auth.loginSuccess]);

  // Dọn timer nếu modal bị unmount trước khi chuyển trang.
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Guest QR handler: điện thoại quét ở chế độ khách -> đánh dấu đang dùng thử
  // với tư cách Khách, đóng modal, giữ guest (KHÔNG set token nào).
  const handleGuestSuccess = useCallback(() => {
    enterGuestMode();
    showToast(t.auth.qrGuestTransferred);
    navigateAfterAuth();
  }, [showToast, t.auth.qrGuestTransferred, navigateAfterAuth]);

  // "Tiếp tục với tư cách Khách": chọn chế độ Khách từ modal đăng nhập.
  const handleContinueAsGuest = useCallback(() => {
    enterGuestMode();
    showToast(t.auth.qrGuestTransferred);
    handleClose();
  }, [showToast, t.auth.qrGuestTransferred, handleClose]);

  // Switch views
  const handleSwitchToLogin = useCallback(() => {
    if (isStandalone) {
      navigate('/dang-nhap', { state: location.state });
      return;
    }
    navigate('/dang-nhap', { state: location.state, replace: true });
  }, [isStandalone, location.state, navigate]);

  const handleSwitchToRegister = useCallback(() => {
    if (isStandalone) {
      navigate('/dang-ky', { state: location.state });
      return;
    }
    navigate('/dang-ky', { state: location.state, replace: true });
  }, [isStandalone, location.state, navigate]);

  const handleSwitchToForgot = useCallback(() => {
    if (isStandalone) {
      navigate('/quen-mat-khau', { state: location.state });
      return;
    }
    navigate('/quen-mat-khau', { state: location.state, replace: true });
  }, [isStandalone, location.state, navigate]);

  // Lock body scroll and save active element (with scrollbar compensation to prevent layout jump)
  useEffect(() => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        try {
          lastActiveElementRef.current.focus();
        } catch {
          // Ignore if unmounted
        }
      }
    };
  }, []);

  // Keyboard navigation: Escape to close and Tab focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement && lastElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement && firstElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  // Click on backdrop to close
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      handleClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`auth-modal-overlay${isStandalone ? ' is-standalone' : ''}`}
      onClick={handleOverlayClick}
      data-testid="auth-modal-overlay"
    >
      <div
        ref={dialogRef}
        className="auth-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {!loginSuccess && (
          <button
            type="button"
            className="auth-modal-close"
            aria-label={t.auth.close}
            onClick={handleClose}
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}

        <div className="auth-modal-body">
          {loginSuccess ? (
            <div className="auth-success" role="status" aria-live="polite">
              <span className="auth-success-icon" aria-hidden="true">
                <CheckCircle2 size={40} strokeWidth={1.8} />
              </span>
              <h2 id="auth-modal-title" className="auth-success-title">
                {t.auth.loginSuccess}
              </h2>
              {accountName && <p className="auth-success-account">{accountName}</p>}
              <p className="auth-success-note">{t.auth.loginSuccessRedirect}</p>
              <span className="auth-success-bar" aria-hidden="true" />
            </div>
          ) : (
            <>
              {guestMode && (
                <aside className="auth-guest-banner" role="note" aria-label={t.auth.guestBannerTitle}>
                  <div className="auth-guest-banner-header">
                    <span className="auth-guest-banner-icon" aria-hidden="true">
                      <Eye size={17} strokeWidth={2} />
                    </span>
                    <strong className="auth-guest-banner-title">{t.auth.guestBannerTitle}</strong>
                  </div>
                  <p className="auth-guest-banner-text">{t.auth.guestBannerNote}</p>
                  <button
                    type="button"
                    className="auth-guest-banner-continue"
                    onClick={handleContinueAsGuest}
                  >
                    {t.auth.guestContinue}
                  </button>
                </aside>
              )}

              {currentView === 'login' && (
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onGuestSuccess={handleGuestSuccess}
                  onSwitchToRegister={handleSwitchToRegister}
                  onSwitchToForgot={handleSwitchToForgot}
                />
              )}

              {currentView === 'register' && (
                <RegisterForm onClose={handleClose} onSwitchToLogin={handleSwitchToLogin} />
              )}

              {currentView === 'forgot' && (
                <ForgotPasswordForm onClose={handleClose} onSwitchToLogin={handleSwitchToLogin} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
