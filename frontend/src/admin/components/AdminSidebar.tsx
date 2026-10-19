import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AdminLogo } from '../brand/AdminLogo';
import {
  AdminNavIcon,
  AdminChevronIcon,
  AdminChevronLeftIcon,
  AdminSidebarCollapseIcon,
} from './AdminNavIcon';
import {
  getVisibleAdminMenu,
  isMenuChildActive,
  isMenuItemActive,
  resolveAdminMenuMatch,
  type AdminMenuItem,
  type AdminMenuLeaf,
} from '../config/adminMenu';
import { useAuth } from '../../context/AuthContext';

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const COLLAPSED_STORAGE_KEY = 'echora_admin_sidebar_collapsed';

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getOpenGroupStorageKey(userId?: number | string): string {
  return `echora_admin_open_group_${userId ?? 'guest'}`;
}

function readStoredOpenGroup(userId?: number | string): string | null {
  try {
    return localStorage.getItem(getOpenGroupStorageKey(userId));
  } catch {
    return null;
  }
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(readStoredCollapsed);
  const isCollapsed = isCollapsedProp ?? internalCollapsed;

  const visibleMenu = useMemo(() => getVisibleAdminMenu(user?.role), [user?.role]);

  const currentMatch = useMemo(
    () => resolveAdminMenuMatch(location.pathname, location.search),
    [location.pathname, location.search]
  );

  const activeParentId = currentMatch?.item?.children && currentMatch.item.children.length > 1
    ? currentMatch.item.id
    : null;

  const [openItemId, setOpenItemId] = useState<string | null>(() => {
    return activeParentId ?? readStoredOpenGroup(user?.id);
  });

  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  useEffect(() => {
    if (activeParentId) {
      setOpenItemId(activeParentId);
    }
  }, [activeParentId]);

  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
        } catch {
          // Bỏ qua lỗi lưu trữ
        }
        return next;
      });
    }
  }, [onToggleCollapse]);

  const handleToggleItem = useCallback(
    (itemId: string) => {
      setOpenItemId((prev) => {
        const next = prev === itemId ? null : itemId;
        try {
          const key = getOpenGroupStorageKey(user?.id);
          if (next) {
            localStorage.setItem(key, next);
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          // Bỏ qua lỗi lưu trữ
        }
        return next;
      });
    },
    [user?.id]
  );

  const handleNavKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        if (activePopoverId) {
          setActivePopoverId(null);
          e.stopPropagation();
        } else if (openItemId) {
          setOpenItemId(null);
          e.stopPropagation();
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const nav = navRef.current;
        if (!nav) return;
        const focusable = Array.from(
          nav.querySelectorAll<HTMLElement>(
            'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'
          )
        );
        const index = focusable.indexOf(document.activeElement as HTMLElement);
        if (index === -1) return;
        e.preventDefault();
        if (e.key === 'ArrowDown') {
          const next = focusable[(index + 1) % focusable.length];
          next?.focus();
        } else {
          const prev = focusable[(index - 1 + focusable.length) % focusable.length];
          prev?.focus();
        }
      }
    },
    [activePopoverId, openItemId]
  );

  const renderLeaf = (leaf: AdminMenuLeaf) => {
    if (leaf.isUpcoming || !leaf.path) {
      return (
        <li key={leaf.id} className="adm-nav-subitem">
          <div
            className="adm-nav-sublink adm-nav-sublink-disabled"
            aria-disabled="true"
            title="Tính năng đang trong lộ trình phát triển"
          >
            <span className="adm-nav-sublabel">{leaf.label}</span>
            <span className="adm-nav-badge">Sắp có</span>
          </div>
        </li>
      );
    }

    // Tô sáng đúng mục con đang active (dùng mục con đã giải cụ thể nhất).
    const childActive = currentMatch?.child?.id === leaf.id;
    const fullPath = leaf.path + (leaf.matchSearch ? `?${leaf.matchSearch}` : '');

    return (
      <li key={leaf.id} className="adm-nav-subitem">
        <NavLink
          to={fullPath}
          className={`adm-nav-sublink ${childActive ? 'adm-nav-sublink-active' : ''}`}
          onClick={onClose}
          aria-current={childActive ? 'page' : undefined}
        >
          <span className="adm-nav-sublabel">{leaf.label}</span>
        </NavLink>
      </li>
    );
  };

  const renderItem = (item: AdminMenuItem) => {
    const hasMultipleChildren = Boolean(item.children && item.children.length > 1);
    const hasSingleChild = Boolean(item.children && item.children.length === 1);

    if (hasSingleChild) {
      const child = item.children![0]!;
      if (child.isUpcoming || !child.path) {
        return (
          <li key={item.id} className="adm-nav-item">
            <div
              className="adm-nav-link adm-nav-link-disabled"
              aria-disabled="true"
              title={isCollapsed ? `${child.label} (Sắp có)` : 'Tính năng đang trong lộ trình phát triển'}
            >
              <span className="adm-nav-icon" aria-hidden="true">
                <AdminNavIcon id={item.icon} />
              </span>
              {!isCollapsed && <span className="adm-nav-label">{child.label}</span>}
              {!isCollapsed && <span className="adm-nav-badge">Sắp có</span>}
            </div>
          </li>
        );
      }

      const active = isMenuChildActive(child, location.pathname, location.search);
      const fullPath = child.path + (child.matchSearch ? `?${child.matchSearch}` : '');

      return (
        <li key={item.id} className="adm-nav-item">
          <NavLink
            to={fullPath}
            className={`adm-nav-link ${active ? 'adm-nav-link-active' : ''}`}
            onClick={onClose}
            aria-current={active ? 'page' : undefined}
            title={isCollapsed ? child.label : undefined}
          >
            <span className="adm-nav-icon" aria-hidden="true">
              <AdminNavIcon id={item.icon} />
            </span>
            {!isCollapsed && <span className="adm-nav-label">{child.label}</span>}
          </NavLink>
        </li>
      );
    }

    if (hasMultipleChildren) {
      const isOpen = openItemId === item.id;
      const isParentActive = isMenuItemActive(item, location.pathname, location.search);
      const isPopoverOpen = isCollapsed && activePopoverId === item.id;

      return (
        <li
          key={item.id}
          className="adm-nav-item adm-nav-item-collapsible"
          onMouseEnter={() => isCollapsed && setActivePopoverId(item.id)}
          onMouseLeave={() => isCollapsed && setActivePopoverId(null)}
          onFocus={() => isCollapsed && setActivePopoverId(item.id)}
          onBlur={(e) => {
            if (isCollapsed && !e.currentTarget.contains(e.relatedTarget as Node)) {
              setActivePopoverId(null);
            }
          }}
        >
          <button
            type="button"
            className={`adm-nav-link adm-nav-link-trigger ${
              isParentActive ? 'adm-nav-parent-active' : ''
            }`}
            onClick={() => handleToggleItem(item.id)}
            aria-expanded={isOpen}
            aria-controls={`adm-submenu-${item.id}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="adm-nav-icon" aria-hidden="true">
              <AdminNavIcon id={item.icon} />
            </span>
            {!isCollapsed && <span className="adm-nav-label">{item.label}</span>}
            {!isCollapsed && (
              <span className="adm-nav-chevron-wrap" aria-hidden="true">
                <AdminChevronIcon open={isOpen} />
              </span>
            )}
          </button>

          {!isCollapsed && isOpen && (
            <ul
              id={`adm-submenu-${item.id}`}
              className="adm-nav-submenu"
              role="region"
              aria-label={item.label}
            >
              {item.children!.map((leaf) => renderLeaf(leaf))}
            </ul>
          )}

          {isPopoverOpen && (
            <div
              className="adm-nav-popover"
              role="region"
              aria-label={item.label}
              onMouseEnter={() => setActivePopoverId(item.id)}
              onMouseLeave={() => setActivePopoverId(null)}
            >
              <div className="adm-nav-popover-title">{item.label}</div>
              <ul className="adm-nav-popover-list">
                {item.children!.map((leaf) => renderLeaf(leaf))}
              </ul>
            </div>
          )}
        </li>
      );
    }

    if (item.isUpcoming || !item.path) {
      const isPopoverOpen = isCollapsed && activePopoverId === item.id;
      return (
        <li
          key={item.id}
          className="adm-nav-item"
          onMouseEnter={() => isCollapsed && setActivePopoverId(item.id)}
          onMouseLeave={() => isCollapsed && setActivePopoverId(null)}
        >
          <div
            className="adm-nav-link adm-nav-link-disabled"
            aria-disabled="true"
            title={isCollapsed ? `${item.label} (Sắp có)` : 'Phân hệ đang trong lộ trình phát triển'}
          >
            <span className="adm-nav-icon" aria-hidden="true">
              <AdminNavIcon id={item.icon} />
            </span>
            {!isCollapsed && <span className="adm-nav-label">{item.label}</span>}
            {!isCollapsed && <span className="adm-nav-badge">Sắp có</span>}
          </div>
          {isPopoverOpen && (
            <div className="adm-nav-popover" role="region" aria-label={item.label}>
              <div className="adm-nav-popover-title">{item.label}</div>
              <div className="adm-nav-popover-upcoming">
                <span className="adm-nav-badge">Sắp có</span>
              </div>
            </div>
          )}
        </li>
      );
    }

    const isActive = isMenuItemActive(item, location.pathname, location.search);
    const isPopoverOpen = isCollapsed && activePopoverId === item.id;

    return (
      <li
        key={item.id}
        className="adm-nav-item"
        onMouseEnter={() => isCollapsed && setActivePopoverId(item.id)}
        onMouseLeave={() => isCollapsed && setActivePopoverId(null)}
      >
        <NavLink
          to={item.path}
          className={`adm-nav-link ${isActive ? 'adm-nav-link-active' : ''}`}
          onClick={onClose}
          aria-current={isActive ? 'page' : undefined}
          title={isCollapsed ? item.label : undefined}
        >
          <span className="adm-nav-icon" aria-hidden="true">
            <AdminNavIcon id={item.icon} />
          </span>
          {!isCollapsed && <span className="adm-nav-label">{item.label}</span>}
        </NavLink>
        {isPopoverOpen && (
          <div className="adm-nav-popover" role="region" aria-label={item.label}>
            <div className="adm-nav-popover-title">{item.label}</div>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="adm-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`adm-sidebar ${isOpen ? 'adm-sidebar-open' : ''} ${
          isCollapsed ? 'adm-sidebar-collapsed' : ''
        }`.trim()}
      >
        <div className="adm-sidebar-head">
          <AdminLogo showSubtitle={!isCollapsed} />
          <button
            type="button"
            className="adm-sidebar-close"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>

        <nav
          ref={navRef}
          className="adm-sidebar-nav"
          aria-label="Menu quản trị"
          onKeyDown={handleNavKeyDown}
        >
          {visibleMenu.map((group) => (
            <div key={group.id} className="adm-nav-section">
              {group.label && !isCollapsed && (
                <p className="adm-nav-section-label">{group.label}</p>
              )}
              <ul className="adm-nav-list">
                {group.items.map((item) => renderItem(item))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <button
            type="button"
            className="adm-sidebar-collapse-btn"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <span className="adm-exit-icon" aria-hidden="true">
              <AdminSidebarCollapseIcon collapsed={isCollapsed} />
            </span>
            {!isCollapsed && <span>Thu gọn</span>}
          </button>

          <Link
            to="/"
            className="adm-exit-link"
            onClick={onClose}
            title={isCollapsed ? 'Về website du khách' : undefined}
          >
            <span className="adm-exit-icon" aria-hidden="true">
              <AdminChevronLeftIcon />
            </span>
            {!isCollapsed && <span>Về website du khách</span>}
          </Link>
        </div>
      </aside>
    </>
  );
};

