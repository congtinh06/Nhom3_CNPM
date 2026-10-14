import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/quan-tri': 'Tổng quan',
  '/quan-tri/tong-quan': 'Tổng quan',
  '/quan-tri/diem-thuyet-minh': 'Điểm thuyết minh',
  '/quan-tri/san-pham': 'Sản phẩm',
  '/quan-tri/don-hang': 'Đơn hàng',
  '/quan-tri/nguoi-dung': 'Người dùng',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const currentSection = BREADCRUMB_MAP[location.pathname] || 'Trang quản trị';
  const displayName = user?.fullName || user?.email || 'Quản trị viên';

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Bỏ qua lỗi mạng khi logout
    }
  };

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
          <span className="adm-breadcrumb-root">Quản trị</span>
          <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
          {location.pathname === '/quan-tri/san-pham/moi' ? (
            <>
              <Link to="/quan-tri/san-pham" className="adm-breadcrumb-root">
                Sản phẩm
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Thêm mới</span>
            </>
          ) : location.pathname.startsWith('/quan-tri/san-pham/') ? (
            <>
              <Link to="/quan-tri/san-pham" className="adm-breadcrumb-root">
                Sản phẩm
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Chỉnh sửa</span>
            </>
          ) : (
            <span className="adm-breadcrumb-current">{currentSection}</span>
          )}
        </nav>
      </div>

      <div className="adm-header-right">
        <div className="adm-user-info">
          <span className="adm-user-name">{displayName}</span>
          <span className="adm-user-role">Quản trị viên</span>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-ghost adm-btn-sm adm-logout-btn"
          onClick={handleLogout}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
};
