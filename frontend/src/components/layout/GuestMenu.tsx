import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Eye, LogIn, LogOut, UserPlus } from 'lucide-react';
import { exitGuestMode } from '../../lib/guestMode';
import { useNavbarLanguage } from '../../content/languages';
import '../../styles/user-menu.css';

export const GuestMenu: React.FC = () => {
  const { t } = useNavbarLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const focusFirstOnOpen = useRef(false);
  const menuId = useId();

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

  const handleLoginClick = () => {
    setIsOpen(false);
    navigate('/dang-nhap', { state: { backgroundLocation: location } });
  };

  const handleRegisterClick = () => {
    setIsOpen(false);
    navigate('/dang-ky', { state: { backgroundLocation: location } });
  };

  const handleExitGuest = () => {
    setIsOpen(false);
    exitGuestMode();
  };

  return (
    <div ref={rootRef} className="um-root gm-root" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="um-trigger gm-trigger"
        aria-label={t.auth.guestTitle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        data-testid="header-guest-menu"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="gm-trigger-badge" aria-hidden="true">
          <Eye size={15} strokeWidth={2} />
        </span>
        <span className="um-trigger-name gm-trigger-name">{t.auth.guest}</span>
        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className={`um-chevron ${isOpen ? 'um-chevron-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id={menuId} className="um-panel gm-panel" role="menu" aria-label={t.auth.guestTitle}>
          <div className="gm-card-header">
            <div className="gm-header-main">
              <span className="gm-avatar-icon" aria-hidden="true">
                <Eye size={16} strokeWidth={2} />
              </span>
              <div className="gm-header-text">
                <div className="gm-title-row">
                  <strong className="gm-title">{t.auth.guestTitle}</strong>
                  <span className="gm-pill-badge">Dùng thử</span>
                </div>
                <p className="gm-subtitle">Thuyết minh tiếng Việt miễn phí</p>
              </div>
            </div>
          </div>

          <div className="um-rule" role="separator" />

          <div className="gm-actions-list">
            <button
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              type="button"
              role="menuitem"
              className="um-item gm-action-item"
              onClick={handleLoginClick}
            >
              <LogIn size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
              <span>{t.auth.login}</span>
            </button>

            <button
              ref={(el) => {
                itemRefs.current[1] = el;
              }}
              type="button"
              role="menuitem"
              className="um-item gm-action-item"
              onClick={handleRegisterClick}
            >
              <UserPlus size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
              <span>{t.auth.register}</span>
            </button>
          </div>

          <div className="um-rule" role="separator" />

          <button
            ref={(el) => {
              itemRefs.current[2] = el;
              itemRefs.current.length = 3;
            }}
            type="button"
            role="menuitem"
            className="um-item gm-action-item gm-item-signout"
            onClick={handleExitGuest}
          >
            <LogOut size={15} strokeWidth={1.9} aria-hidden="true" className="gm-action-icon" />
            <span>{t.auth.exitGuestMode}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestMenu;
