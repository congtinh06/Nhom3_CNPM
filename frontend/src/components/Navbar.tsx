import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export interface NavbarProps {
  navState?: 'PUBLIC' | 'USER' | 'ADMIN';
  activeTab?: string;
  userName?: string;
  onTabClick?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  navState: propNavState,
  activeTab: propActiveTab,
  userName: propUserName,
  onTabClick,
}) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve current nav state from AuthContext if not overridden by props
  const resolvedNavState =
    propNavState ||
    (role === 'admin' ? 'ADMIN' : role === 'user' ? 'USER' : 'PUBLIC');

  const getIsActive = (path: string, tabName: string) => {
    if (propActiveTab) {
      return propActiveTab === tabName;
    }
    if (path === '/check' && (location.pathname === '/' || location.pathname === '/check')) {
      return true;
    }
    return location.pathname === path;
  };

  const handleNav = (e: React.MouseEvent, path: string, tabName: string) => {
    e.preventDefault();
    if (onTabClick) {
      onTabClick(tabName);
    } else {
      navigate(path);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onTabClick) {
      onTabClick('Đăng xuất');
    } else {
      logout();
      navigate('/login');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onTabClick) {
      onTabClick('Kiểm tra');
    } else {
      navigate(role === 'admin' ? '/reports' : '/check');
    }
  };

  return (
    <header className="topbar">
      <div className="app-container topbar-inner">
        <div className="topbar-left">
          <a
            href="#"
            className="brand-logo"
            onClick={handleLogoClick}
          >
            <svg className="brand-shield" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>BankShield</span>
          </a>
        </div>

        <div className="topbar-right">
          {resolvedNavState === 'PUBLIC' && (
            <nav className="nav-tabs">
              <a
                href="/check"
                className={`nav-tab ${getIsActive('/check', 'Kiểm tra') ? 'active' : ''}`}
                onClick={(e) => handleNav(e, '/check', 'Kiểm tra')}
              >
                Kiểm tra
              </a>
              <a
                href="/architecture"
                className={`nav-tab ${getIsActive('/architecture', 'Kiến trúc') ? 'active' : ''}`}
                onClick={(e) => handleNav(e, '/architecture', 'Kiến trúc')}
              >
                Kiến trúc
              </a>
              <a
                href="/login"
                className={`nav-tab ${getIsActive('/login', 'Đăng nhập') ? 'active' : ''}`}
                onClick={(e) => handleNav(e, '/login', 'Đăng nhập')}
              >
                Đăng nhập
              </a>
              <a
                href="/register"
                className={`nav-tab ${getIsActive('/register', 'Đăng ký') ? 'active' : ''}`}
                onClick={(e) => handleNav(e, '/register', 'Đăng ký')}
              >
                Đăng ký
              </a>
            </nav>
          )}

          {resolvedNavState === 'USER' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <nav className="nav-tabs">
                <a
                  href="/check"
                  className={`nav-tab ${getIsActive('/check', 'Kiểm tra') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/check', 'Kiểm tra')}
                >
                  Kiểm tra
                </a>
                <a
                  href="/history"
                  className={`nav-tab ${getIsActive('/history', 'Lịch sử của tôi') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/history', 'Lịch sử của tôi')}
                >
                  Lịch sử của tôi
                </a>
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="muted-text" style={{ fontSize: '14px' }}>
                  {user?.name || propUserName || 'Nguyễn Văn An'}
                </span>
                <a
                  href="#"
                  className="accent-link"
                  style={{ fontSize: '14px' }}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </a>
              </div>
            </div>
          )}

          {resolvedNavState === 'ADMIN' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <nav className="nav-tabs">
                <a
                  href="/reports"
                  className={`nav-tab ${getIsActive('/reports', 'Báo cáo') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/reports', 'Báo cáo')}
                >
                  Báo cáo
                </a>
                <a
                  href="/stats"
                  className={`nav-tab ${getIsActive('/stats', 'Thống kê') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/stats', 'Thống kê')}
                >
                  Thống kê
                </a>
                <a
                  href="/notifications"
                  className={`nav-tab ${getIsActive('/notifications', 'Thông báo') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/notifications', 'Thông báo')}
                >
                  Thông báo
                </a>
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="muted-text mono" style={{ fontSize: '13px' }}>
                  {user?.email || propUserName || 'admin'}
                </span>
                <a
                  href="#"
                  className="accent-link"
                  style={{ fontSize: '13px' }}
                  onClick={handleLogout}
                >
                  Đăng xuất
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
