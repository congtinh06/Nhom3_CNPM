import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AdminLogo } from '../brand/AdminLogo';
import { AdminNavIcon } from './AdminNavIcon';
import { ADMIN_NAV_SECTIONS } from '../config/nav';
import type { AdminNavItem } from '../types';

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const isItemActive = (pathname: string, item: AdminNavItem): boolean => {
  if (item.path === '/quan-tri/tong-quan') {
    return pathname === '/quan-tri' || pathname === '/quan-tri/tong-quan';
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="adm-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`adm-sidebar ${isOpen ? 'adm-sidebar-open' : ''}`}>
        <div className="adm-sidebar-head">
          <AdminLogo />
          <button
            type="button"
            className="adm-sidebar-close"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
          >
            &times;
          </button>
        </div>

        <nav className="adm-sidebar-nav" aria-label="Menu quản trị">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="adm-nav-section">
              {section.label && (
                <p className="adm-nav-section-label">{section.label}</p>
              )}
              <ul className="adm-nav-list">
                {section.items.map((item) => {
                  const active = isItemActive(location.pathname, item);

                  return (
                    <li key={item.id} className="adm-nav-item">
                      {item.isUpcoming ? (
                        <div
                          className="adm-nav-link adm-nav-link-disabled"
                          aria-disabled="true"
                          title="Phân hệ đang trong lộ trình phát triển"
                        >
                          <span className="adm-nav-icon" aria-hidden="true">
                            <AdminNavIcon id={item.id} />
                          </span>
                          <span className="adm-nav-label">{item.label}</span>
                          {item.badge && (
                            <span className="adm-nav-badge">{item.badge}</span>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.path}
                          className={`adm-nav-link ${active ? 'adm-nav-link-active' : ''}`}
                          onClick={onClose}
                        >
                          <span className="adm-nav-icon" aria-hidden="true">
                            <AdminNavIcon id={item.id} />
                          </span>
                          <span className="adm-nav-label">{item.label}</span>
                          {item.badge && (
                            <span className="adm-nav-badge">{item.badge}</span>
                          )}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <Link to="/" className="adm-exit-link" onClick={onClose}>
            <span className="adm-exit-icon" aria-hidden="true">
              &larr;
            </span>
            <span>Về website du khách</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
