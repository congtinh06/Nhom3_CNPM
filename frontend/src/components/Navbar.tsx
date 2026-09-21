import React from 'react';

export interface NavbarProps {
  navState?: 'PUBLIC' | 'USER' | 'ADMIN';
  activeTab?: string;
  userName?: string;
  onTabClick?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  navState = 'PUBLIC',
  activeTab,
  userName,
  onTabClick,
}) => {
  const handleClick = (e: React.MouseEvent, tab: string) => {
    e.preventDefault();
    onTabClick?.(tab);
  };

  return (
    <header className="topbar">
      <div className="app-container topbar-inner">
        <div className="topbar-left">
        <a
          href="#"
          className="brand-logo"
          onClick={(e) => handleClick(e, 'Kiểm tra')}
        >
          <svg className="brand-shield" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>BankShield</span>
        </a>
      </div>

      <div className="topbar-right">
        {navState === 'PUBLIC' && (
          <nav className="nav-tabs">
            <a
              href="#"
              className={`nav-tab ${activeTab === 'Kiểm tra' ? 'active' : ''}`}
              onClick={(e) => handleClick(e, 'Kiểm tra')}
            >
              Kiểm tra
            </a>
            <a
              href="#"
              className={`nav-tab ${activeTab === 'Kiến trúc' ? 'active' : ''}`}
              onClick={(e) => handleClick(e, 'Kiến trúc')}
            >
              Kiến trúc
            </a>
            <a
              href="#"
              className={`nav-tab ${activeTab === 'Đăng nhập' ? 'active' : ''}`}
              onClick={(e) => handleClick(e, 'Đăng nhập')}
            >
              Đăng nhập
            </a>
            <a
              href="#"
              className={`nav-tab ${activeTab === 'Đăng ký' ? 'active' : ''}`}
              onClick={(e) => handleClick(e, 'Đăng ký')}
            >
              Đăng ký
            </a>
          </nav>
        )}
        {navState === 'USER' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <nav className="nav-tabs">
              <a
                href="#"
                className={`nav-tab ${activeTab === 'Kiểm tra' ? 'active' : ''}`}
                onClick={(e) => handleClick(e, 'Kiểm tra')}
              >
                Kiểm tra
              </a>
              <a
                href="#"
                className={`nav-tab ${activeTab === 'Lịch sử của tôi' ? 'active' : ''}`}
                onClick={(e) => handleClick(e, 'Lịch sử của tôi')}
              >
                Lịch sử của tôi
              </a>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="muted-text" style={{ fontSize: '14px' }}>
                {userName || 'Nguyễn Văn An'}
              </span>
              <a
                href="#"
                className="accent-link"
                style={{ fontSize: '14px' }}
                onClick={(e) => handleClick(e, 'Đăng xuất')}
              >
                Đăng xuất
              </a>
            </div>
          </div>
        )}

        {navState === 'ADMIN' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <nav className="nav-tabs">
              <a
                href="#"
                className={`nav-tab ${activeTab === 'Báo cáo' ? 'active' : ''}`}
                onClick={(e) => handleClick(e, 'Báo cáo')}
              >
                Báo cáo
              </a>
              <a
                href="#"
                className={`nav-tab ${activeTab === 'Thống kê' ? 'active' : ''}`}
                onClick={(e) => handleClick(e, 'Thống kê')}
              >
                Thống kê
              </a>
              <a
                href="#"
                className={`nav-tab ${activeTab === 'Thông báo' ? 'active' : ''}`}
                onClick={(e) => handleClick(e, 'Thông báo')}
              >
                Thông báo
              </a>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="muted-text mono" style={{ fontSize: '13px' }}>
                {userName || 'admin'}
              </span>
              <a
                href="#"
                className="accent-link"
                style={{ fontSize: '13px' }}
                onClick={(e) => handleClick(e, 'Đăng xuất')}
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
