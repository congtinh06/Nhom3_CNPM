import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminBreadcrumbs,
  getAdminPageTitle,
  resolveAdminMenuMatch,
} from '../config/adminMenu';
import { BRAND_NAME } from '../brand/brand';
import { Bell, ChevronDown } from 'lucide-react';
import type { AdminDensity } from '../types';
import { feedbackApi } from '../api/feedbackApi';

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
  density?: AdminDensity;
  onToggleDensity?: () => void;
}

interface CrumbWithLink {
  label: string;
  to?: string;
}


function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '').slice(0, 2).toUpperCase();
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  density = 'comfortable',
  onToggleDensity,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFeedbackCount, setOpenFeedbackCount] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    let timer: number | undefined;
    const fetchRemote = async () => {
      try {
        const all = await feedbackApi.list();
        setOpenFeedbackCount(all.filter((t) => t.status === 'OPEN').length);
      } catch {
        // ignore network error
      }
    };
    void fetchRemote();
    timer = window.setInterval(fetchRemote, 6000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const rawCrumbs = getAdminBreadcrumbs(location.pathname, location.search);
  const match = resolveAdminMenuMatch(location.pathname, location.search);

  const crumbs: CrumbWithLink[] = rawCrumbs.map((c, index) => {
    if (index === rawCrumbs.length - 1) {
      return { label: c.label };
    }
    if (index === 0) {
      return { label: c.label, to: '/quan-tri/tong-quan' };
    }
    if (index === 1 && match) {
      if (match.item.path) {
        return { label: c.label, to: match.item.path };
      }
    }
    if (index === 2 && match?.child?.path) {
      const fullPath = match.child.path + (match.child.matchSearch ? `?${match.child.matchSearch}` : '');
      return { label: c.label, to: fullPath };
    }
    return { label: c.label, to: c.to };
  });

  const displayName = user?.fullName || user?.email || 'Quản trị viên';

  useEffect(() => {
    const pageTitle = getAdminPageTitle(location.pathname, location.search);
    document.title = `${pageTitle} - Quản trị ${BRAND_NAME}`;
  }, [location.pathname, location.search]);


  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    try {
      await logout();
    } catch {
      // Bỏ qua lỗi mạng khi logout
    }
  }, [logout]);

  return (
    <header className="adm-header">
      <div className="adm-header-left">
        <button
          type="button"
          className="adm-header-toggle"
          onClick={onToggleSidebar}
          aria-label="Mở menu quản trị"
        >
          <span className="adm-toggle-bar" />
          <span className="adm-toggle-bar" />
          <span className="adm-toggle-bar" />
        </button>

        <nav className="adm-breadcrumb" aria-label="Đường dẫn phân cấp">
          {crumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && (
                <span className="adm-breadcrumb-sep" aria-hidden="true">
                  /
                </span>
              )}
              {crumb.to ? (
                <Link to={crumb.to} className="adm-breadcrumb-root">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    index === 0 ? 'adm-breadcrumb-root' : 'adm-breadcrumb-current'
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="adm-header-right">
        {onToggleDensity && (
          <div className="adm-density-toggle" role="group" aria-label="Mật độ hiển thị">
            <button
              type="button"
              className={`adm-density-btn ${
                density === 'comfortable' ? 'adm-density-btn-active' : ''
              }`}
              onClick={() => density === 'compact' && onToggleDensity()}
              aria-pressed={density === 'comfortable'}
            >
              Thoáng
            </button>
            <button
              type="button"
              className={`adm-density-btn ${
                density === 'compact' ? 'adm-density-btn-active' : ''
              }`}
              onClick={() => density === 'comfortable' && onToggleDensity()}
              aria-pressed={density === 'compact'}
            >
              Gọn
            </button>
          </div>
        )}

        <Link
          to="/quan-tri/lien-he"
          aria-label={
            openFeedbackCount > 0
              ? `Hộp thư liên hệ: ${openFeedbackCount} tin nhắn chờ xử lý`
              : 'Hộp thư liên hệ khách hàng'
          }
          title="Hộp thư liên hệ khách hàng"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 8,
            border: '1px solid #e7e5e4',
            background: openFeedbackCount > 0 ? '#fff7ed' : '#ffffff',
            color: openFeedbackCount > 0 ? '#c2410c' : '#44403c',
            textDecoration: 'none',
          }}
        >
          <Bell size={18} aria-hidden="true" />
          {openFeedbackCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: '#c2410c',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {openFeedbackCount}
            </span>
          )}
        </Link>

        <div className="adm-usermenu" ref={menuRef}>
          <button
            type="button"
            className="adm-usermenu-trigger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Mở menu tài khoản quản trị"
          >
            <span className="adm-avatar" aria-hidden="true">
              {getInitials(displayName)}
            </span>
            <span className="adm-user-info">
              <span className="adm-user-name">{displayName}</span>
              <span className="adm-user-role">Quản trị viên</span>
            </span>
            <span className="adm-usermenu-caret" aria-hidden="true">
              <ChevronDown />
            </span>
          </button>

          {menuOpen && (
            <div className="adm-usermenu-panel" role="menu">
              <Link to="/" role="menuitem" className="adm-usermenu-item">
                Về website du khách
              </Link>
              <button
                type="button"
                role="menuitem"
                className="adm-usermenu-item adm-usermenu-item-danger"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
