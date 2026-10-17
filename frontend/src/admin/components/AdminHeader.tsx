import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ADMIN_DETAIL_LABELS,
  ADMIN_SECTION_LABELS,
  ADMIN_SECTION_ROOTS,
} from '../config/nav';
import { BRAND_NAME } from '../brand/brand';

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

interface Crumb {
  label: string;
  to?: string;
}

function resolveTitle(pathname: string): string {
  if (pathname === '/quan-tri' || pathname === '/quan-tri/tong-quan') {
    return 'Tổng quan';
  }
  const root = ADMIN_SECTION_ROOTS.find(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (!root) {
    return 'Trang quản trị';
  }
  const section = ADMIN_SECTION_LABELS[root] || 'Trang quản trị';
  if (pathname === `${root}/moi`) {
    return `Thêm mới ${section.toLowerCase()}`;
  }
  if (pathname.startsWith(`${root}/`)) {
    const detail = ADMIN_DETAIL_LABELS[root];
    return detail ? `${detail} ${section.toLowerCase()}` : `Chỉnh sửa ${section.toLowerCase()}`;
  }
  return section;
}

function resolveBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/quan-tri' || pathname === '/quan-tri/tong-quan') {
    return [{ label: 'Quản trị' }, { label: 'Tổng quan' }];
  }

  const root = ADMIN_SECTION_ROOTS.find(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (!root) {
    return [{ label: 'Quản trị' }, { label: 'Trang quản trị' }];
  }

  const section = ADMIN_SECTION_LABELS[root] || 'Trang quản trị';

  if (pathname === root) {
    return [{ label: 'Quản trị' }, { label: section }];
  }

  const leaf =
    pathname === `${root}/moi`
      ? 'Thêm mới'
      : ADMIN_DETAIL_LABELS[root] || 'Chỉnh sửa';

  return [{ label: 'Quản trị' }, { label: section, to: root }, { label: leaf }];
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

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const crumbs = resolveBreadcrumbs(location.pathname);
  const displayName = user?.fullName || user?.email || 'Quản trị viên';

  useEffect(() => {
    document.title = `${resolveTitle(location.pathname)} · Quản trị ${BRAND_NAME}`;
  }, [location.pathname]);

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
              &#9662;
            </span>
          </button>

          {menuOpen && (
            <div className="adm-usermenu-panel" role="menu">
              <Link to="/" role="menuitem" className="adm-usermenu-item">
                <span className="adm-usermenu-item-icon" aria-hidden="true">
                  &#8592;
                </span>
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
