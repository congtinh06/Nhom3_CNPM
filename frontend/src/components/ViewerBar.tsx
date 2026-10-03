import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleKey, useAuth } from '../context/AuthContext';

export interface ViewerBarProps {
  activeRole?: 'public' | 'user' | 'admin';
  onSelectRole?: (role: 'public' | 'user' | 'admin') => void;
  activePage?: string;
  onSelectPage?: (page: string) => void;
  activeState?: string;
  onSelectState?: (state: string) => void;
}

export const ViewerBar: React.FC<ViewerBarProps> = ({
  activeRole: propActiveRole,
  onSelectRole,
  activePage: propActivePage,
  onSelectPage,
  activeState = 'Mặc định',
  onSelectState,
}) => {
  // Chỉ hiển thị khi biến môi trường VITE_SHOW_VIEWER là "true"
  const isEnabled = import.meta.env.VITE_SHOW_VIEWER === 'true';
  const [isOpen, setIsOpen] = useState(false);
  const [internalState, setInternalState] = useState(activeState);

  const { role, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isEnabled) {
    return null;
  }

  const currentRole = propActiveRole || role;

  const pageRouteMap: Record<string, string> = {
    guide: '/guide',
    check: '/check',
    visits: '/admin/visits',
    arch: '/architecture',
    login: '/login',
    register: '/register',
    history: '/history',
    denied: '/403',
    reports: '/reports',
    stats: '/stats',
    notifications: '/notifications',
  };

  const getActivePageKey = () => {
    if (propActivePage) return propActivePage;
    const p = location.pathname;
    if (p === '/' || p === '/guide') return 'guide';
    if (p === '/check') return 'check';
    if (p === '/admin/visits' || p === '/visits') return 'visits';
    if (p === '/architecture') return 'arch';
    if (p === '/login') return 'login';
    if (p === '/register') return 'register';
    if (p === '/history') return 'history';
    if (p === '/403') return 'denied';
    if (p === '/reports') return 'reports';
    if (p === '/stats') return 'stats';
    if (p === '/notifications') return 'notifications';
    return '';
  };

  const currentPageKey = getActivePageKey();

  const handleRoleClick = (newRole: 'public' | 'user' | 'admin') => {
    if (onSelectRole) {
      onSelectRole(newRole);
    } else {
      switchRole(newRole as RoleKey);
    }
  };

  const handlePageClick = (pageKey: string) => {
    if (onSelectPage) {
      onSelectPage(pageKey);
    } else {
      const targetRoute = pageRouteMap[pageKey] || '/check';
      navigate(targetRoute);
    }
  };

  const handleStateClick = (state: string) => {
    setInternalState(state);
    if (onSelectState) {
      onSelectState(state);
    }
  };

  const roleOptions: { key: 'public' | 'user' | 'admin'; label: string }[] = [
    { key: 'public', label: 'Khách' },
    { key: 'user', label: 'Người dùng' },
    { key: 'admin', label: 'Quản trị' },
  ];

  const pageOptions: { key: string; label: string }[] = [
    { key: 'guide', label: 'Hướng dẫn viên' },
    { key: 'check', label: 'Kiểm tra' },
    { key: 'visits', label: 'Lượt nghe POI' },
    { key: 'arch', label: 'Kiến trúc' },
    { key: 'login', label: 'Đăng nhập' },
    { key: 'register', label: 'Đăng ký' },
    { key: 'history', label: 'Lịch sử' },
    { key: 'denied', label: '403 Bị chặn' },
    { key: 'reports', label: 'Báo cáo' },
    { key: 'stats', label: 'Thống kê' },
    { key: 'notifications', label: 'Thông báo' },
  ];

  const stateOptions = [
    'Mặc định',
    'Lỗi nhập liệu',
    'Lừa đảo',
    'An toàn',
    'Đang chờ',
    'Giới hạn 5 lần/phút',
  ];

  return (
    <div className="demo-viewer-container">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          className="demo-viewer-float-btn"
          onClick={() => setIsOpen(true)}
          title="Mở công cụ xem thử demo (Chỉ hiển thị khi VITE_SHOW_VIEWER=true)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Xem thử (Demo)</span>
        </button>
      )}

      {/* Floating Demo Control Panel */}
      {isOpen && (
        <div className="demo-viewer-panel">
          <div className="demo-viewer-header">
            <div className="demo-viewer-title">
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Demo Viewer</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                VITE_SHOW_VIEWER=true
              </span>
            </div>
            <button
              type="button"
              className="demo-viewer-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <div className="demo-viewer-body">
            {/* 1. Group: Vai trò */}
            <div className="demo-group">
              <div className="demo-group-label">Vai trò</div>
              <div className="demo-button-row">
                {roleOptions.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={`demo-btn ${currentRole === r.key ? 'active' : ''}`}
                    onClick={() => handleRoleClick(r.key)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Group: Trang */}
            <div className="demo-group">
              <div className="demo-group-label">Trang</div>
              <div className="demo-button-grid">
                {pageOptions.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={`demo-btn ${currentPageKey === p.key ? 'active' : ''}`}
                    onClick={() => handlePageClick(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Group: Trạng thái */}
            <div className="demo-group">
              <div className="demo-group-label">Trạng thái</div>
              <div className="demo-button-grid">
                {stateOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`demo-btn ${(onSelectState ? activeState : internalState) === s ? 'active' : ''}`}
                    onClick={() => handleStateClick(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
