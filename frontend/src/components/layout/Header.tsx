import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ChevronDown,
  Crown,
  Eye,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToastOptional } from '../../context/ToastContext';
import { usePremium, buildPremiumPath } from '../../context/PremiumContext';
import { exitGuestMode, useGuestMode } from '../../lib/guestMode';
import {
  useNavbarLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../../content/languages';
import { CountryFlag } from '../common/CountryFlag';
import { UserMenu } from './UserMenu';
import { GuestMenu } from './GuestMenu';
import { footerContent } from '../../content/staticSections';

export const Header: React.FC = () => {
  const { totalCount, openCart } = useCart();
  const { lang, currentOption, t, changeLanguage } = useNavbarLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isPremium, canAccessLanguage } = usePremium();
  const { showToast } = useToastOptional();
  const guestMode = useGuestMode();
  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : '');

  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [cartBumpCount, setCartBumpCount] = useState(0);

  const langTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDropdownTimers = useCallback(() => {
    if (langTimerRef.current) clearTimeout(langTimerRef.current);
  }, []);

  // Thay đổi số lượng giỏ hàng -> hiệu ứng nảy badge (1 -> 1.15 -> 1)
  useEffect(() => {
    setCartBumpCount((prev) => prev + 1);
  }, [totalCount]);

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
  }, []);

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

  const openPremiumPage = useCallback(
    (requestedLanguage?: LanguageOption['code']) => {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      setIsLangOpen(false);
      setIsMenuOpen(false);
      navigate(buildPremiumPath(requestedLanguage, returnTo));
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  const handleLanguageSelect = (option: LanguageOption) => {
    if (!canAccessLanguage(option.code)) {
      showToast('Cần nâng cấp Premium để nghe thuyết minh bằng ngôn ngữ này.');
      openPremiumPage(option.code);
      return;
    }
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
    !isHomePage ? 'solid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header
      ref={headerRef}
      className={headerClasses}
    >
      <div className="hd-inner">
      {/* 1. Trái: Logo */}
      <div className="hd-left">
        <b
          className="brand"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          aria-label={`${footerContent.brand} - Về trang chủ`}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBrandClick()}
        >
          {footerContent.brand}
        </b>
      </div>

      {/* 2. Giữa: Trang chủ | Điểm du lịch | Khám phá (dropdown) | Giới thiệu | Liên hệ */}
      {/* 2. Giữa: Trang chủ | Điểm du lịch | Ẩm thực | Tin tức | Liên hệ */}
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
            <CountryFlag code={currentOption.code} width={18} height={13} />
            <span className="lang-trigger-label">{currentOption.label}</span>
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
            {SUPPORTED_LANGUAGES.map((opt) => {
              const locked = !canAccessLanguage(opt.code);
              return (
                <button
                  key={opt.code}
                  type="button"
                  role="menuitem"
                  className={`dropdown-item lang-item ${
                    opt.code === lang ? 'active' : ''
                  } ${locked ? 'is-locked' : ''}`.trim()}
                  title={locked ? 'Cần Premium để nghe thuyết minh' : undefined}
                  onClick={() => handleLanguageSelect(opt)}
                >
                  <div className="lang-item-left">
                    <CountryFlag code={opt.code} width={18} height={13} />
                    <span className="lang-name">{opt.label}</span>
                  </div>
                  <span className="lang-item-right">
                    {locked && (
                      <Lock
                        size={11}
                        strokeWidth={2}
                        className="lang-lock-icon"
                        aria-hidden="true"
                      />
                    )}
                    <span className="lang-short-tag">{opt.short}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Giỏ hàng (chỉ icon, badge tròn nhỏ góc trên phải khi totalCount > 0) */}
        <button
          type="button"
          className={`hd-premium-btn ${isPremium ? 'is-active' : ''}`}
          aria-label={isPremium ? 'Premium đang hoạt động' : 'Nâng cấp Premium'}
          onClick={() => openPremiumPage()}
        >
          <Crown size={15} strokeWidth={1.9} aria-hidden="true" />
        </button>

        <button
          type="button"
          id="cb"
          className="cart-btn"
          aria-label={`${t.cart}: ${totalCount}`}
          onClick={openCart}
        >
          <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
          {totalCount > 0 && (
            <span key={cartBumpCount} id="cc" className="cart-badge">
              {totalCount}
            </span>
          )}
        </button>

        {/* Cụm Auth / User */}
        {!isAuthenticated ? (
          guestMode ? (
            <GuestMenu />
          ) : (
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
          )
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
              guestMode ? (
                <div className="mobile-guest-profile" data-testid="mobile-guest-profile">
                  <div className="mobile-guest-badge">
                    <span className="mobile-guest-avatar" aria-hidden="true">
                      <Eye size={18} strokeWidth={1.8} />
                    </span>
                    <div className="mobile-guest-info">
                      <strong>{t.auth.guestTitle}</strong>
                      <p>{t.auth.guestBannerNote}</p>
                    </div>
                  </div>
                  <div className="mobile-guest-actions">
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
                    <button
                      type="button"
                      className="mobile-guest-exit-btn"
                      onClick={() => {
                        closeAllMenus();
                        exitGuestMode();
                        navigate('/');
                      }}
                    >
                      <span>{t.auth.exitGuestMode}</span>
                    </button>
                  </div>
                </div>
              ) : (
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
              )
            ) : (
              <div className="mobile-user-box">
                <div className="mobile-user-header">
                  <span className="mobile-user-name">{displayName}</span>
                </div>
                <div className="mobile-user-links">
                  <a
                    href="/quet-ma"
                    className="mobile-sub-item"
                    onClick={(e) => {
                      e.preventDefault();
                      closeAllMenus();
                      navigate('/quet-ma');
                    }}
                  >
                    <span>{t.scanPoiQr}</span>
                  </a>
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
