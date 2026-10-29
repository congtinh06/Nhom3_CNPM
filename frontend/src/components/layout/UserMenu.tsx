import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, ScanLine, ShieldCheck, ShoppingBag, Smartphone, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavbarLanguage } from '../../content/languages';
import { useAccountI18n } from '../account/accountI18n';
import '../../styles/user-menu.css';

export const UserMenu: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useNavbarLanguage();
  const { t: accountT } = useAccountI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const focusFirstOnOpen = useRef(false);
  const menuId = useId();

  const displayName = user?.fullName?.trim() || (user?.email ? user.email.split('@')[0] : '');
  const email = user?.email?.trim() || '';

  const getItems = useCallback(() => {
    return itemRefs.current.filter((el): el is HTMLElement => el !== null);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (isOpen && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      getItems()[0]?.focus();
    }
  }, [isOpen, getItems]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusFirstOnOpen.current = e.key === 'ArrowDown';
        setIsOpen(true);
      }
      return;
    }

    const items = getItems();
    if (items.length === 0) return;
    const currentIndex = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleAccountClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/tai-khoan');
  };

  const handleOrdersClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/don-hang');
  };

  const handleScanQrClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/quet-ma');
  };

  const handlePhoneLoginClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/qr-tai-khoan');
  };

  const handleAdminClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/quan-tri');
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Cookie có thể đã bị xóa sẵn - vẫn đóng menu phía client.
    }
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="um-root" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="um-trigger"
        aria-label="Mở trang tài khoản"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="um-trigger-name">{displayName}</span>
        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className={`um-chevron ${isOpen ? 'um-chevron-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id={menuId} className="um-panel" role="menu" aria-label="Tùy chọn người dùng">
          <div className="um-identity">
            <span className="um-identity-name">{displayName}</span>
            {email && <span className="um-identity-email">{email}</span>}
          </div>

          <div className="um-rule" role="separator" />

          <a
            ref={(el) => {
              itemRefs.current[0] = el;
            }}
            href="/tai-khoan"
            role="menuitem"
            className="um-item"
            onClick={handleAccountClick}
          >
            <User size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{accountT.menuLabel}</span>
          </a>

          <a
            ref={(el) => {
              itemRefs.current[1] = el;
            }}
            href="/don-hang"
            role="menuitem"
            className="um-item"
            onClick={handleOrdersClick}
          >
            <ShoppingBag size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{t.auth.myOrders}</span>
          </a>

          <a
            ref={(el) => {
              itemRefs.current[2] = el;
            }}
            href="/quet-ma"
            role="menuitem"
            className="um-item"
            onClick={handleScanQrClick}
          >
            <ScanLine size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{t.scanPoiQr}</span>
          </a>

          <a
            ref={(el) => {
              itemRefs.current[3] = el;
            }}
            href="/qr-tai-khoan"
            role="menuitem"
            className="um-item"
            onClick={handlePhoneLoginClick}
          >
            <Smartphone size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{t.auth.qrHandoffTitle}</span>
          </a>

          {isAdmin && (
            <a
              ref={(el) => {
                itemRefs.current[4] = el;
              }}
              href="/quan-tri"
              role="menuitem"
              className="um-item"
              onClick={handleAdminClick}
            >
              <ShieldCheck size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
              <span>Quản trị hệ thống</span>
            </a>
          )}

          <div className="um-rule" role="separator" />

          <button
            ref={(el) => {
              if (isAdmin) {
                itemRefs.current[5] = el;
                itemRefs.current.length = 6;
              } else {
                itemRefs.current[4] = el;
                itemRefs.current.length = 5;
              }
            }}
            type="button"
            role="menuitem"
            className="um-item um-item-signout"
            onClick={handleSignOut}
          >
            <LogOut size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{t.auth.logout}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
