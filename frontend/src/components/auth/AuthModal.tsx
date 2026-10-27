import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useNavbarLanguage } from '../../content/languages';
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
  const { showToast } = useToast();
  const guestMode = useGuestMode();

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

  // Close handler: back or fallback
  const handleClose = useCallback(() => {
    if (isStandalone) {
      if (returnTarget) {
        navigate(returnTarget, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    if (hasBackground) {
      navigate(-1);
    } else if (returnTarget) {
      navigate(returnTarget, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [hasBackground, returnTarget, isStandalone, navigate]);

  // Login success handler
  const handleLoginSuccess = useCallback(() => {
    if (returnTarget) {
      navigate(returnTarget, { replace: true });
    } else if (hasBackground && !isStandalone) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [returnTarget, hasBackground, isStandalone, navigate]);

  // Guest QR handler: điện thoại quét ở chế độ khách -> đánh dấu đang dùng thử
  // với tư cách Khách, đóng modal, giữ guest (KHÔNG set token nào).
  const handleGuestSuccess = useCallback(() => {
    enterGuestMode();
    showToast(t.auth.qrGuestTransferred);
    handleLoginSuccess();
  }, [showToast, t.auth.qrGuestTransferred, handleLoginSuccess]);

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

  // Lock body scroll and save active element
  useEffect(() => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
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
      className="auth-modal-overlay"
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
        <button
          type="button"
          className="auth-modal-close"
          aria-label={t.auth.close}
          onClick={handleClose}
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div className="auth-modal-body">
          {guestMode && (
            <aside className="auth-guest-banner" role="note" aria-label={t.auth.guestBannerTitle}>
              <span className="auth-guest-banner-icon" aria-hidden="true">
                <Eye size={18} strokeWidth={1.8} />
              </span>
              <div className="auth-guest-banner-copy">
                <strong>{t.auth.guestBannerTitle}</strong>
                <p>{t.auth.guestBannerNote}</p>
              </div>
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
            <RegisterForm
              onClose={handleClose}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}

          {currentView === 'forgot' && (
            <ForgotPasswordForm
              onClose={handleClose}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
