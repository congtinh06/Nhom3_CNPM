import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  useNavbarLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../../content/languages';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const { totalCount, openCart } = useCart();
  const { lang, currentOption, t, changeLanguage } = useNavbarLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : '');

  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLangOpen, setIsLangOpen] = useState(false);

  const langTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDropdownTimers = useCallback(() => {
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
  }, []);

  const handleLangEnter = () => {
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
    setIsLangOpen(true);
  };

  const handleLangLeave = () => {
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
    langTimerRef.current = setTimeout(() => {
      setIsLangOpen(false);
    }, 250);
  };

  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const isHomePage = location.pathname === '/';
  const isAttractionsActive =
    location.pathname.startsWith('/diem-du-lich') ||
    location.pathname.startsWith('/thuyet-minh') ||
    location.pathname.startsWith('/gan-toi');
  const isNewsActive = location.pathname.startsWith('/tin-tuc');
  const isContactActive = location.pathname.startsWith('/lien-he');
  const isFoodActive =
    location.pathname.startsWith('/am-thuc') ||
    location.pathname.startsWith('/thuc-uong') ||
    location.pathname.startsWith('/am-thuc-thuc-uong');

  const handleScroll = useCallback(() => {
    const y = window.scrollY || 0;
    setIsScrolled(y > 50);

    // On attractions routes (/diem-du-lich), keep header strictly visible and fixed to preserve layout stability
    if (isAttractionsActive) {
      setIsHidden(false);
      lastScrollY.current = y;
      return;
    }

    if (isMenuOpen || y < 120 || y < lastScrollY.current - 6) {
      setIsHidden(false);
    } else if (y > lastScrollY.current + 6) {
      setIsHidden(true);
    }

    lastScrollY.current = y;
  }, [isMenuOpen, isAttractionsActive]);

  // Ensure header is never hidden when navigating to attractions pages
  useEffect(() => {
    if (isAttractionsActive) {
      setIsHidden(false);
    }
  }, [isAttractionsActive]);

  useEffect(() => {
    if (isHidden) {
      document.body.classList.add('header-hidden');
      document.documentElement.setAttribute('data-header-hidden', 'true');
    } else {
      document.body.classList.remove('header-hidden');
      document.documentElement.removeAttribute('data-header-hidden');
    }
    return () => {
      document.body.classList.remove('header-hidden');
      document.documentElement.removeAttribute('data-header-hidden');
    };
  }, [isHidden]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);


  // Close menus on route or language changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsLangOpen(false);
  }, [location.pathname, location.hash, lang]);

  // Handle outside clicks and Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setIsLangOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLangOpen(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeAllMenus = () => {
    clearDropdownTimers();
    setIsMenuOpen(false);
    setIsLangOpen(false);
  };


  const handleBrandClick = () => {
    closeAllMenus();
    if (!isHomePage) {
      navigate('/');
    } else {
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { duration: 1.1 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleLanguageSelect = (option: LanguageOption) => {
    changeLanguage(option.code);
    setIsLangOpen(false);
    setIsMenuOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    }
    closeAllMenus();
  };


  const headerClasses = [
    'hd',
    isScrolled ? 'sc' : '',
    isHidden ? 'hide' : '',
    !isHomePage ? 'solid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header
      ref={headerRef}
      className={headerClasses}
      onFocus={() => setIsHidden(false)}
    >
      {/* 1. Trái: Logo */}
      <div className="hd-left">
        <b
          className="brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          aria-label="Sài Gòn - Về trang chủ"
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBrandClick()}
        >
          Sài Gòn
        </b>
      </div>

      {/* 2. Giữa: Trang chủ | Điểm du lịch | Khám phá (dropdown) | Giới thiệu | Liên hệ */}
      {/* 2. Giữa: Trang chủ | Điểm du lịch | Ẩm thực | Hướng dẫn | Liên hệ */}
      <nav id="nv" className="hd-nav" aria-label="Chính">
        <a
          href="/"
          className={`nav-link ${isHomePage ? 'active' : ''}`}
          aria-current={isHomePage ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            handleBrandClick();
          }}
        >
          {t.home}
        </a>

        <a
          href="/diem-du-lich"
          title={t.narration || 'Thuyết minh'}
          data-nav="thuyet-minh"
          className={`nav-link ${isAttractionsActive ? 'active' : ''}`}
          aria-current={isAttractionsActive ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            navigate('/diem-du-lich');
          }}
        >
          {t.attractions}
        </a>

        <a
          href="/am-thuc"
          className={`nav-link ${isFoodActive ? 'active' : ''}`}
          aria-current={isFoodActive ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            navigate('/am-thuc');
          }}
        >
          {t.food}
        </a>

        <a
          href="/tin-tuc"
          className={`nav-link ${isNewsActive ? 'active' : ''}`}
          aria-current={isNewsActive ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            navigate('/tin-tuc');
          }}
        >
          {t.news || 'Tin tức'}
        </a>

        <a
          href="/lien-he"
          className={`nav-link ${isContactActive ? 'active' : ''}`}
          aria-current={isContactActive ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            navigate('/lien-he');
          }}
        >
          {t.contact}
        </a>
      </nav>

      {/* 3. Phải: Ngôn ngữ | Giỏ hàng | Đăng nhập / Đăng ký (hoặc User Menu) */}
      <div className="hd-right">
        {/* Ngôn ngữ (chữ trơn, hover như nav) */}
        <div
          ref={langRef}
          className={`nav-dropdown lang-dropdown ${isLangOpen ? 'open' : ''}`}
          onMouseEnter={handleLangEnter}
          onMouseLeave={handleLangLeave}
        >
          <button
            type="button"
            className="nav-link lang-trigger-btn"
            aria-label="Chọn ngôn ngữ"
            aria-haspopup="true"
            aria-expanded={isLangOpen}
            onClick={() => setIsLangOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLangOpen(true);
              }
            }}
          >
            <span>{currentOption.short}</span>
            <ChevronDown
              size={13}
              strokeWidth={1.75}
              className={`chevron ${isLangOpen ? 'rotated' : ''}`}
              aria-hidden="true"
            />
          </button>

          <div
            className={`dropdown-menu lang-menu ${isLangOpen ? 'visible' : ''}`}
            role="menu"
            aria-label="Ngôn ngữ hỗ trợ"
          >
            {SUPPORTED_LANGUAGES.map((opt) => (
              <button
                key={opt.code}
                type="button"
                role="menuitem"
                className={`dropdown-item lang-item ${opt.code === lang ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(opt)}
              >
                <span className="lang-name">{opt.label}</span>
                <span className="lang-short-tag">{opt.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Giỏ hàng (chỉ icon, badge tròn nhỏ góc trên phải khi totalCount > 0) */}
        <button
          type="button"
          id="cb"
          className="cart-btn"
          aria-label={`${t.cart}: ${totalCount}`}
          onClick={openCart}
        >
          <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
          {totalCount > 0 && (
            <span id="cc" className="cart-badge">
              {totalCount}
            </span>
          )}
        </button>

        {/* Cụm Auth / User */}
        {!isAuthenticated ? (
          <>
            {location.pathname !== '/dang-nhap' && (
              <button
                type="button"
                className="nav-link hd-login-btn"
                aria-label={t.auth.login}
                onClick={() => {
                  closeAllMenus();
                  navigate('/dang-nhap', { state: { backgroundLocation: location } });
                }}
              >
                {t.auth.login}
              </button>
            )}

            {location.pathname !== '/dang-ky' && (
              <button
                type="button"
                className="hd-register-btn"
                aria-label={t.auth.register}
                onClick={() => {
                  closeAllMenus();
                  navigate('/dang-ky', { state: { backgroundLocation: location } });
                }}
              >
                {t.auth.register}
              </button>
            )}
          </>
        ) : (
          <UserMenu />
        )}

        {/* Nút Menu Mobile (< 900px) */}
        <button
          type="button"
          id="mn"
          className="menu-toggle"
          aria-label={isMenuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-panel"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? (
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* 4. Panel Mobile (< 900px) */}
      <div
        id="mobile-nav-panel"
        className={`mobile-panel ${isMenuOpen ? 'open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="mobile-nav-list" aria-label="Chính">
          <a
            href="/"
            className={`mobile-nav-item ${isHomePage ? 'active' : ''}`}
            aria-current={isHomePage ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              handleBrandClick();
            }}
          >
            <span>{t.home}</span>
          </a>

          <a
            href="/diem-du-lich"
            title={t.narration || 'Thuyết minh'}
            data-nav="thuyet-minh"
            className={`mobile-nav-item ${isAttractionsActive ? 'active' : ''}`}
            aria-current={isAttractionsActive ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              closeAllMenus();
              navigate('/diem-du-lich');
            }}
          >
            <span>{t.attractions}</span>
          </a>

          <a
            href="/am-thuc"
            className={`mobile-nav-item ${isFoodActive ? 'active' : ''}`}
            aria-current={isFoodActive ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              closeAllMenus();
              navigate('/am-thuc');
            }}
          >
            <span>{t.food}</span>
          </a>

          <a
            href="/tin-tuc"
            className={`mobile-nav-item ${isNewsActive ? 'active' : ''}`}
            aria-current={isNewsActive ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              closeAllMenus();
              navigate('/tin-tuc');
            }}
          >
            <span>{t.news || 'Tin tức'}</span>
          </a>

          <a
            href="/lien-he"
            className={`mobile-nav-item ${isContactActive ? 'active' : ''}`}
            aria-current={isContactActive ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              closeAllMenus();
              navigate('/lien-he');
            }}
          >
            <span>{t.contact}</span>
          </a>

          {/* Auth khu vực mobile */}
          <div className="mobile-account-section">
            {!isAuthenticated ? (
              <div className="mobile-auth-actions">
                {location.pathname !== '/dang-nhap' && (
                  <button
                    type="button"
                    className="mobile-btn-outline"
                    aria-label={t.auth.login}
                    onClick={() => {
                      closeAllMenus();
                      navigate('/dang-nhap', { state: { backgroundLocation: location } });
                    }}
                  >
                    <span>{t.auth.login}</span>
                  </button>
                )}
                {location.pathname !== '/dang-ky' && (
                  <button
                    type="button"
                    className="mobile-btn-primary"
                    aria-label={t.auth.register}
                    onClick={() => {
                      closeAllMenus();
                      navigate('/dang-ky', { state: { backgroundLocation: location } });
                    }}
                  >
                    <span>{t.auth.register}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="mobile-user-box">
                <div className="mobile-user-header">
                  <span className="mobile-user-name">{displayName}</span>
                </div>
                <div className="mobile-user-links">
                  <a
                    href="/don-hang"
                    className="mobile-sub-item"
                    onClick={(e) => {
                      e.preventDefault();
                      closeAllMenus();
                      navigate('/don-hang');
                    }}
                  >
                    <span>{t.auth.myOrders}</span>
                  </a>
                  <button
                    type="button"
                    className="mobile-sub-item mobile-logout-btn"
                    onClick={handleLogoutClick}
                  >
                    <span>{t.auth.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
