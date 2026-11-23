import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Crown,
  LogOut,
  MessageCircle,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { useToast } from '../context/ToastContext';
import { AccountProfile } from '../components/account/AccountProfile';
import { AccountOrders } from '../components/account/AccountOrders';
import { AccountPremium } from '../components/account/AccountPremium';
import { AccountFeedback } from '../components/account/AccountFeedback';
import { useAccountI18n } from '../components/account/accountI18n';
import { formatAccountDate } from '../components/account/accountFormatters';
import '../styles/account.css';

const VALID_TABS = ['profile', 'orders', 'feedback', 'premium'] as const;
type TabId = (typeof VALID_TABS)[number];

function isValidTab(id: string): id is TabId {
  return VALID_TABS.includes(id as TabId);
}

export const AccountPage: React.FC = () => {
  const { user, status, logout } = useAuth();
  const { isPremium } = usePremium();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t } = useAccountI18n();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const signingOutRef = useRef(false);

  const tabFromHash = location.hash.replace(/^#/, '');
  const [active, setActive] = useState<TabId>(() =>
    isValidTab(tabFromHash) ? tabFromHash : 'profile'
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'guest' && !signingOutRef.current) {
      navigate('/dang-nhap', { state: { from: '/tai-khoan' }, replace: true });
    }
  }, [status, navigate]);

  useEffect(() => {
    const fromHash = location.hash.replace(/^#/, '');
    if (isValidTab(fromHash) && fromHash !== active) {
      setActive(fromHash);
    }
  }, [location.hash, active]);

  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || user?.email || '';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0] ?? '';
    if (parts.length >= 2) {
      const last = parts[parts.length - 1] ?? '';
      return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  }, [user]);

  const navItems = useMemo(
    () => [
      { id: 'profile' as const, label: t.navProfile, icon: UserRound },
      { id: 'orders' as const, label: t.navOrders, icon: ShoppingBag },
      { id: 'feedback' as const, label: 'Tin nhắn hỗ trợ', icon: MessageCircle },
      { id: 'premium' as const, label: t.navPremium, icon: Crown },
    ],
    [t]
  );

  const memberSince = formatAccountDate(user?.createdAt, lang);

  const selectTab = (id: TabId) => {
    setActive(id);
    navigate({ pathname: location.pathname, search: location.search, hash: id });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      targetIndex = (index + 1) % navItems.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      targetIndex = (index - 1 + navItems.length) % navItems.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = navItems.length - 1;
    }

    if (targetIndex >= 0) {
      const target = navItems[targetIndex];
      if (target) {
        selectTab(target.id);
        tabRefs.current[target.id]?.focus();
      }
    }
  };

  const handleLogout = async () => {
    signingOutRef.current = true;
    await logout();
    showToast(t.signedOut);
    navigate('/', { replace: true });
  };

  const isLoading = status === 'loading' || !user;

  return (
    <section className="s ac-page">
      <header className="ac-head">
        <div className="ac-head-copy">
          <p className="ac-kicker">{t.kicker}</p>
          <h1
            className="ac-title"
            style={{ fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)' }}
          >
            {t.pageTitle}
          </h1>
          <p className="ac-subtitle">{t.pageSubtitle}</p>
        </div>

        {!isLoading && user && (
          <div className="ac-head-meta">
            <span className="ac-head-chip">
              <CalendarDays size={15} strokeWidth={1.9} aria-hidden="true" />
              {t.memberSince} {memberSince}
            </span>
          </div>
        )}
      </header>

      {isLoading || !user ? (
        <div className="ac-loading">
          <p className="ac-muted">{t.loading}</p>
        </div>
      ) : (
        <div className="ac-shell">
          <aside className="ac-aside">
            <div className="ac-identity">
              <div className="ac-avatar" aria-hidden="true">
                {initials}
              </div>
              <div className="ac-identity-copy">
                <span className="ac-identity-name" title={user.fullName || user.email}>
                  {user.fullName || user.email}
                </span>
                <span className="ac-identity-email" title={user.email}>{user.email}</span>
                <span className={`ac-plan-pill${isPremium ? ' is-premium' : ''}`}>
                  {isPremium ? t.planPremium : t.planFree}
                </span>
              </div>
            </div>

            <nav
              className="ac-nav"
              role="tablist"
              aria-label={t.menuLabel}
              aria-orientation="vertical"
            >
              {navItems.map((item, index) => {
                const isSelected = active === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    ref={(el) => {
                      tabRefs.current[item.id] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={item.id}
                    tabIndex={isSelected ? 0 : -1}
                    className={`ac-nav-link ${isSelected ? 'is-active' : ''}`.trim()}
                    onClick={() => selectTab(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button type="button" className="ac-signout" onClick={handleLogout}>
              <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>{t.signOut}</span>
            </button>
          </aside>

          <div className="ac-main">
            {active === 'profile' && <AccountProfile />}
            {active === 'orders' && <AccountOrders />}
            {active === 'feedback' && <AccountFeedback />}
            {active === 'premium' && <AccountPremium />}
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;
