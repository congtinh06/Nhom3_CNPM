import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences, AppLanguage } from '../context/PreferencesContext';
import { useTranslation } from '../locales/i18n';
import {
  LogOut,
  History,
  ChevronDown,
  Globe,
  Settings,
  MapPin,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  User,
} from 'lucide-react';

const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
];

export interface NavbarProps {
  navState?: 'PUBLIC' | 'USER' | 'ADMIN';
  activeTab?: string;
  userName?: string;
  onTabClick?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  userName: propUserName,
  onTabClick,
}) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getIsActive = (path: string) => {
    if (propActiveTab) {
      if (path === '/guide' && propActiveTab === t.nav.guide) return true;
      if (path === '/learn' && propActiveTab === t.nav.learn) return true;
      if (path === '/check' && propActiveTab === t.nav.check) return true;
      if (path === '/history' && propActiveTab === t.nav.history) return true;
      if (path === '/help' && propActiveTab === t.nav.help) return true;
      if (path === '/settings' && propActiveTab === t.nav.settings) return true;
    }
    if (path === '/guide') {
      return location.pathname === '/' || location.pathname.startsWith('/guide');
    }
    return location.pathname.startsWith(path);
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
    setIsDropdownOpen(false);
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
      onTabClick(t.nav.guide);
    } else {
      navigate(role === 'admin' ? '/admin/visits' : '/guide');
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const displayName = user?.name || propUserName || (role === 'admin' ? 'Quản trị viên' : 'Thành viên');
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="topbar" style={{ fontFamily: 'var(--font-ui)', height: '64px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="app-container topbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: '12px' }}>
          {/* Left: Brand Logo */}
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <a href="#" className="brand-logo" onClick={handleLogoClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)' }}>
              <svg className="brand-shield" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', stroke: 'var(--primary)', fill: 'none', strokeWidth: 2 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em', color: 'var(--text)' }}>
                BankShield
              </span>
            </a>
          </div>

          {/* Desktop Navigation Tabs (hidden on < 768px via CSS .nav-tabs) */}
          <nav className="nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
            <a
              href="/guide"
              className={`nav-tab ${getIsActive('/guide') ? 'active' : ''}`}
              onClick={(e) => handleNav(e, '/guide', t.nav.guide)}
            >
              {t.nav.guide}
            </a>

            <a
              href="/learn"
              className={`nav-tab ${getIsActive('/learn') ? 'active' : ''}`}
              onClick={(e) => handleNav(e, '/learn', t.nav.learn)}
            >
              {t.nav.learn}
            </a>

            <a
              href="/check"
              className={`nav-tab ${getIsActive('/check') ? 'active' : ''}`}
              onClick={(e) => handleNav(e, '/check', t.nav.check)}
            >
              {t.nav.check}
            </a>

            <a
              href="/history"
              className={`nav-tab ${getIsActive('/history') ? 'active' : ''}`}
              onClick={(e) => handleNav(e, '/history', t.nav.history)}
            >
              {t.nav.history}
            </a>

            {/* Admin only routes */}
            {role === 'admin' && (
              <>
                <a
                  href="/admin/visits"
                  className={`nav-tab ${getIsActive('/admin/visits') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/admin/visits', 'Lượt nghe POI')}
                >
                  Lượt nghe POI
                </a>
                <a
                  href="/reports"
                  className={`nav-tab ${getIsActive('/reports') ? 'active' : ''}`}
                  onClick={(e) => handleNav(e, '/reports', 'Báo cáo')}
                >
                  Báo cáo
                </a>
              </>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Desktop Emergency Pill — hidden on mobile */}
            <a
              href="/help"
              className="nav-emergency-pill desktop-only"
              onClick={(e) => handleNav(e, '/help', t.nav.help)}
              aria-label={t.nav.help}
              style={{ display: 'inline-flex' }}
            >
              <AlertTriangle size={15} />
              <span>{t.nav.help}</span>
            </a>

            {/* Language Switcher (Native name, NO flag) */}
            <div ref={langDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Đổi ngôn ngữ"
                onClick={() => setIsLangOpen(!isLangOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isLangOpen ? 'var(--bg-subtle)' : 'var(--surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  minHeight: '38px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <Globe size={15} style={{ color: 'var(--text-muted)' }} />
                <span className="lang-label" style={{ fontSize: '13px' }}>{currentLangObj.label}</span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
              </button>

              {isLangOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    zIndex: 2100,
                    width: '160px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: '4px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {LANGUAGES.map((lang) => {
                    const isActive = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 14px',
                          border: 'none',
                          background: isActive ? 'var(--primary-light)' : 'transparent',
                          cursor: 'pointer',
                          color: isActive ? 'var(--primary)' : 'var(--text)',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '13px',
                          textAlign: 'left',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>{lang.label}</span>
                        {isActive && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Profile Dropdown or Login button */}
            {user || role === 'user' || role === 'admin' ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label="Tài khoản người dùng"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontWeight: 500,
                    minHeight: '38px',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {userInitial}
                  </div>
                  <span className="user-name-label" style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '44px',
                      right: 0,
                      zIndex: 2000,
                      width: '210px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      padding: '6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email || 'authenticated'}
                      </div>
                    </div>

                    <a
                      href="/history"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        navigate('/history');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 14px',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <History size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{t.nav.history}</span>
                    </a>

                    <a
                      href="/settings"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 14px',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Settings size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{t.nav.settings}</span>
                    </a>

                    <a
                      href="#"
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 14px',
                        color: 'var(--danger)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderTop: '1px solid var(--border)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={15} />
                      <span>{t.nav.logout}</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="btn-secondary"
                onClick={(e) => handleNav(e, '/login', t.nav.login)}
                style={{
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <User size={14} />
                <span>{t.nav.login}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính di động">
        <a
          href="/guide"
          className={`mobile-nav-item ${getIsActive('/guide') ? 'active' : ''}`}
          onClick={(e) => handleNav(e, '/guide', t.nav.guide)}
        >
          <MapPin size={18} />
          <span>{t.nav.guide}</span>
        </a>

        <a
          href="/learn"
          className={`mobile-nav-item ${getIsActive('/learn') ? 'active' : ''}`}
          onClick={(e) => handleNav(e, '/learn', t.nav.learn)}
        >
          <BookOpen size={18} />
          <span>{t.nav.learn}</span>
        </a>

        {/* Center Prominent Emergency Button */}
        <a
          href="/help"
          className="mobile-nav-emergency"
          onClick={(e) => handleNav(e, '/help', t.nav.help)}
          aria-label={t.nav.help}
        >
          <div className="mobile-nav-emergency-badge">
            <AlertTriangle size={17} />
          </div>
          <span>{t.nav.help}</span>
        </a>

        <a
          href="/check"
          className={`mobile-nav-item ${getIsActive('/check') ? 'active' : ''}`}
          onClick={(e) => handleNav(e, '/check', t.nav.check)}
        >
          <ShieldCheck size={18} />
          <span>{t.nav.check}</span>
        </a>

        <a
          href="/history"
          className={`mobile-nav-item ${getIsActive('/history') ? 'active' : ''}`}
          onClick={(e) => handleNav(e, '/history', t.nav.history)}
        >
          <History size={18} />
          <span>{t.nav.history}</span>
        </a>
      </nav>
    </>
  );
};
