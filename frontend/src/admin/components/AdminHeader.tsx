import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/quan-tri': 'Tổng quan',
  '/quan-tri/tong-quan': 'Tổng quan',
  '/quan-tri/diem-thuyet-minh': 'Điểm thuyết minh',
  '/quan-tri/khu-vuc': 'Khu vực',
  '/quan-tri/lo-trinh': 'Lộ trình',
  '/quan-tri/san-pham': 'Sản phẩm',
  '/quan-tri/don-hang': 'Đơn hàng',
  '/quan-tri/nguoi-dung': 'Người dùng',
};

const SECTION_ROOTS = ['/quan-tri/san-pham', '/quan-tri/diem-thuyet-minh', '/quan-tri/khu-vuc', '/quan-tri/lo-trinh', '/quan-tri/nguoi-dung'];

function resolveTitle(pathname: string): string {
  if (pathname === '/quan-tri' || pathname === '/quan-tri/tong-quan') {
    return 'Tổng quan';
  }
  const root = SECTION_ROOTS.find((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (!root) {
    return 'Trang quản trị';
  }
  const section = BREADCRUMB_MAP[root] || 'Trang quản trị';
  if (pathname === `${root}/moi`) {
    return `Thêm mới ${section.toLowerCase()}`;
  }
  if (pathname.startsWith(`${root}/`)) {
    return root === '/quan-tri/nguoi-dung' ? `Chi tiết ${section.toLowerCase()}` : `Chỉnh sửa ${section.toLowerCase()}`;
  }
  return section;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const currentSection = BREADCRUMB_MAP[location.pathname] || 'Trang quản trị';
  const displayName = user?.fullName || user?.email || 'Quản trị viên';

  useEffect(() => {
    document.title = `${resolveTitle(location.pathname)} · Quản trị SaigonVoice`;
  }, [location.pathname]);

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
          ) : location.pathname === '/quan-tri/diem-thuyet-minh/moi' ? (
            <>
              <Link to="/quan-tri/diem-thuyet-minh" className="adm-breadcrumb-root">
                Điểm thuyết minh
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Thêm mới</span>
            </>
          ) : location.pathname.startsWith('/quan-tri/diem-thuyet-minh/') ? (
            <>
              <Link to="/quan-tri/diem-thuyet-minh" className="adm-breadcrumb-root">
                Điểm thuyết minh
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Chỉnh sửa</span>
            </>
          ) : location.pathname === '/quan-tri/khu-vuc/moi' ? (
            <>
              <Link to="/quan-tri/khu-vuc" className="adm-breadcrumb-root">
                Khu vực
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Thêm mới</span>
            </>
          ) : location.pathname.startsWith('/quan-tri/khu-vuc/') ? (
            <>
              <Link to="/quan-tri/khu-vuc" className="adm-breadcrumb-root">
                Khu vực
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Chỉnh sửa</span>
            </>
          ) : location.pathname === '/quan-tri/lo-trinh/moi' ? (
            <>
              <Link to="/quan-tri/lo-trinh" className="adm-breadcrumb-root">
                Lộ trình
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Thêm mới</span>
            </>
          ) : location.pathname.startsWith('/quan-tri/lo-trinh/') ? (
            <>
              <Link to="/quan-tri/lo-trinh" className="adm-breadcrumb-root">
                Lộ trình
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Chỉnh sửa</span>
            </>
          ) : location.pathname.startsWith('/quan-tri/nguoi-dung/') ? (
            <>
              <Link to="/quan-tri/nguoi-dung" className="adm-breadcrumb-root">
                Người dùng
              </Link>
              <span className="adm-breadcrumb-sep" aria-hidden="true">/</span>
              <span className="adm-breadcrumb-current">Chi tiết</span>
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
