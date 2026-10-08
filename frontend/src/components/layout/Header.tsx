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
  const [activeSection, setActiveSection] = useState<string>('#top');

  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileExploreExpanded, setIsMobileExploreExpanded] = useState(false);

  const exploreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDropdownTimers = useCallback(() => {
    if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
    if (accountTimerRef.current) clearTimeout(accountTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      clearDropdownTimers();
    };
  }, [clearDropdownTimers]);

  const handleExploreEnter = () => {
    if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    setIsExploreOpen(true);
  };

  const handleExploreLeave = () => {
    if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    exploreTimerRef.current = setTimeout(() => {
      setIsExploreOpen(false);
    }, 250);
  };

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

  const handleAccountEnter = () => {
    if (accountTimerRef.current) clearTimeout(accountTimerRef.current);
    setIsAccountOpen(true);
  };

  const handleAccountLeave = () => {
    if (accountTimerRef.current) clearTimeout(accountTimerRef.current);
    accountTimerRef.current = setTimeout(() => {
      setIsAccountOpen(false);
    }, 250);
  };

  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const isHomePage = location.pathname === '/';
  const isAttractionsPage =
    location.pathname.startsWith('/diem-du-lich') ||
    location.pathname.startsWith('/gan-toi');
  const isOrdersPage = location.pathname === '/don-hang';

  const handleScroll = useCallback(() => {
    const y = window.scrollY || 0;
    setIsScrolled(y > 50);

    if (isMenuOpen || y < 120 || y < lastScrollY.current - 6) {
      setIsHidden(false);
    } else if (y > lastScrollY.current + 6) {
      setIsHidden(true);
    }

    lastScrollY.current = y;
  }, [isMenuOpen]);

  useEffect(() => {
    if (isHidden) {
      document.body.classList.add('header-hidden');
    } else {
      document.body.classList.remove('header-hidden');
    }
    return () => {
      document.body.classList.remove('header-hidden');
    };
  }, [isHidden]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Section observer for active link highlighting on homepage
  useEffect(() => {
    if (!isHomePage) {
      setActiveSection('');
      return;
    }

    if (!('IntersectionObserver' in window)) return;

    const sectionIds = ['top', 'van-hoa', 'am-thuc', 'thuc-uong', 'gioi-thieu', 'lien-he'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-30% 0px -40% 0px' }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }, [isHomePage, location.pathname]);

  // Close menus on route or language changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsExploreOpen(false);
    setIsLangOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname, location.hash, lang]);

  // Handle outside clicks and Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (exploreRef.current && !exploreRef.current.contains(target)) {
        setIsExploreOpen(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setIsLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExploreOpen(false);
        setIsLangOpen(false);
        setIsAccountOpen(false);
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
    setIsExploreOpen(false);
    setIsLangOpen(false);
    setIsAccountOpen(false);
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    closeAllMenus();

    if (!isHomePage) {
      navigate(`/${hash}`);
      return;
    }

    const targetId = hash.replace('#', '');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      if (window.__lenis) {
        window.__lenis.scrollTo(targetEl, { offset: targetId === 'top' ? 0 : -20, duration: 1.1 });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
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

  const isExploreActive =
    location.pathname.startsWith('/am-thuc') ||
    location.pathname.startsWith('/thuc-uong') ||
    location.pathname.startsWith('/am-thuc-thuc-uong') ||
    (isHomePage && ['#van-hoa', '#am-thuc', '#thuc-uong'].includes(activeSection));

  const exploreList = [
    {
      hash: '#van-hoa',
      path: null,
      title: t.exploreItems.culture.title,
      desc: t.exploreItems.culture.desc,
    },
    {
      hash: '#am-thuc',
      path: '/am-thuc',
      title: t.exploreItems.food.title,
      desc: t.exploreItems.food.desc,
    },
    {
      hash: '#thuc-uong',
      path: '/thuc-uong',
      title: t.exploreItems.drinks.title,
      desc: t.exploreItems.drinks.desc,
    },
  ];

  const handleExploreClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { hash: string; path?: string | null }
  ) => {
    e.preventDefault();
    closeAllMenus();
    if (item.path) {
      navigate(item.path);
    } else {
      handleAnchorClick(e, item.hash);
    }
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
      <nav id="nv" className="hd-nav" aria-label="Điều hướng chính">
        <a
          href="#top"
          className={`nav-link ${isHomePage && (activeSection === '#top' || !activeSection) ? 'active' : ''}`}
          onClick={(e) => handleAnchorClick(e, '#top')}
        >
          {t.home}
        </a>

        <a
          href="/diem-du-lich"
          className={`nav-link ${isAttractionsPage ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            closeAllMenus();
            navigate('/diem-du-lich');
          }}
        >
          {t.attractions}
        </a>

        {/* Khám phá Dropdown */}
        <div
          ref={exploreRef}
          className={`nav-dropdown ${isExploreOpen ? 'open' : ''}`}
          onMouseEnter={handleExploreEnter}
          onMouseLeave={handleExploreLeave}
        >
          <button
            type="button"
            className={`nav-link nav-dropdown-trigger ${isExploreActive ? 'active' : ''}`}
            aria-haspopup="true"
            aria-expanded={isExploreOpen}
            onClick={() => setIsExploreOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExploreOpen(true);
              }
            }}
          >
            <span>{t.explore}</span>
            <ChevronDown
              size={13}
              strokeWidth={1.75}
              className={`chevron ${isExploreOpen ? 'rotated' : ''}`}
              aria-hidden="true"
            />
          </button>

          <div
            className={`dropdown-menu explore-menu ${isExploreOpen ? 'visible' : ''}`}
            role="menu"
            aria-label={t.explore}
          >
            {exploreList.map((item) => {
              const isItemActive =
                (isHomePage && activeSection === item.hash) ||
                (item.path && location.pathname.startsWith(item.path));
              return (
                <a
                  key={item.hash}
                  href={item.path || item.hash}
                  role="menuitem"
                  className={`dropdown-item ${isItemActive ? 'active' : ''}`}
                  onClick={(e) => handleExploreClick(e, item)}
                >
                  <span className="dropdown-item-title">{item.title}</span>
                  <span className="dropdown-item-desc">{item.desc}</span>
                </a>
              );
            })}
          </div>
        </div>

        <a
          href="#gioi-thieu"
          className={`nav-link ${isHomePage && activeSection === '#gioi-thieu' ? 'active' : ''}`}
          onClick={(e) => handleAnchorClick(e, '#gioi-thieu')}
        >
          {t.about}
        </a>

        <a
          href="#lien-he"
          className={`nav-link ${isHomePage && activeSection === '#lien-he' ? 'active' : ''}`}
          onClick={(e) => handleAnchorClick(e, '#lien-he')}
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
          <div
            ref={accountRef}
            className={`nav-dropdown account-dropdown ${isAccountOpen ? 'open' : ''}`}
            onMouseEnter={handleAccountEnter}
            onMouseLeave={handleAccountLeave}
          >
            <button
              type="button"
              className="nav-link user-trigger-btn"
              aria-label="Mở trang tài khoản"
              aria-haspopup="true"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsAccountOpen(true);
                }
              }}
            >
              <span className="user-name">{displayName}</span>
              <ChevronDown
                size={13}
                strokeWidth={1.75}
                className={`chevron ${isAccountOpen ? 'rotated' : ''}`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`dropdown-menu account-menu ${isAccountOpen ? 'visible' : ''}`}
              role="menu"
              aria-label="Tùy chọn người dùng"
            >
              <a
                href="/don-hang"
                role="menuitem"
                className={`dropdown-item ${isOrdersPage ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  closeAllMenus();
                  navigate('/don-hang');
                }}
              >
                <span className="dropdown-item-title">{t.auth.myOrders}</span>
              </a>
              <button
                type="button"
                role="menuitem"
                className="dropdown-item logout-item"
                onClick={handleLogoutClick}
              >
                <span className="dropdown-item-title">{t.auth.logout}</span>
              </button>
            </div>
          </div>
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
        <nav className="mobile-nav-list" aria-label="Điều hướng di động">
          <a
            href="#top"
            className={`mobile-nav-item ${isHomePage && (activeSection === '#top' || !activeSection) ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, '#top')}
          >
            {t.home}
          </a>

          <a
            href="/diem-du-lich"
            className={`mobile-nav-item ${isAttractionsPage ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              closeAllMenus();
              navigate('/diem-du-lich');
            }}
          >
            {t.attractions}
          </a>

          {/* Khám phá Sub-accordion */}
          <div className="mobile-accordion">
            <button
              type="button"
              className={`mobile-nav-item mobile-accordion-trigger ${isExploreActive ? 'active' : ''}`}
              aria-expanded={isMobileExploreExpanded}
              onClick={() => setIsMobileExploreExpanded((prev) => !prev)}
            >
              <span>{t.explore}</span>
              <ChevronDown
                size={14}
                strokeWidth={1.75}
                className={`chevron ${isMobileExploreExpanded ? 'rotated' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isMobileExploreExpanded && (
              <div className="mobile-sub-list">
                {exploreList.map((item) => {
                  const isItemActive =
                    (isHomePage && activeSection === item.hash) ||
                    (item.path && location.pathname.startsWith(item.path));
                  return (
                    <a
                      key={item.hash}
                      href={item.path || item.hash}
                      className={`mobile-sub-item ${isItemActive ? 'active' : ''}`}
                      onClick={(e) => handleExploreClick(e, item)}
                    >
                      <span className="sub-item-title">{item.title}</span>
                      <span className="sub-item-desc">{item.desc}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <a
            href="#gioi-thieu"
            className={`mobile-nav-item ${isHomePage && activeSection === '#gioi-thieu' ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, '#gioi-thieu')}
          >
            {t.about}
          </a>

          <a
            href="#lien-he"
            className={`mobile-nav-item ${isHomePage && activeSection === '#lien-he' ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, '#lien-he')}
          >
            {t.contact}
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
