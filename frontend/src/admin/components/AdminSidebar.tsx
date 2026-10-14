import { AdminLogo } from '../brand/AdminLogo';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AdminNavItem } from '../types';

export interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    path: '/quan-tri/tong-quan',
  },
  {
    id: 'pois',
    label: 'Điểm thuyết minh',
    path: '/quan-tri/diem-thuyet-minh',
    badge: 'Sắp có',
    isUpcoming: true,
  },
  {
    id: 'products',
    label: 'Sản phẩm',
    path: '/quan-tri/san-pham',
  },
  {
    id: 'orders',
    label: 'Đơn hàng',
    path: '/quan-tri/don-hang',
    badge: 'Sắp có',
    isUpcoming: true,
  },
  {
    id: 'users',
    label: 'Người dùng',
    path: '/quan-tri/nguoi-dung',
    badge: 'Sắp có',
    isUpcoming: true,
  },
];

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
          <ul className="adm-nav-list">
            {NAV_ITEMS.map((item) => {
              const isNestedActive =
                item.path !== '/quan-tri' &&
                item.path !== '/quan-tri/tong-quan' &&
                location.pathname.startsWith(item.path);

              return (
                <li key={item.id} className="adm-nav-item">
                  {item.isUpcoming ? (
                    <div
                      className="adm-nav-link adm-nav-link-disabled"
                      aria-disabled="true"
                      title="Phân hệ đang trong lộ trình phát triển"
                    >
                      <span className="adm-nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="adm-nav-badge">{item.badge}</span>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `adm-nav-link ${isActive || isNestedActive ? 'adm-nav-link-active' : ''}`
                      }
                      onClick={onClose}
                    >
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
