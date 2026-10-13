import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AccountProfile } from '../components/account/AccountProfile';
import { AccountOrders } from '../components/account/AccountOrders';
import { AccountSecurity } from '../components/account/AccountSecurity';
import { AccountPreferences } from '../components/account/AccountPreferences';
import { useAccountI18n } from '../components/account/accountI18n';
import '../styles/account.css';

export const AccountPage: React.FC = () => {
  const { user, status, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t } = useAccountI18n();

  const [active, setActive] = useState('profile');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (status === 'guest') {
      navigate('/dang-nhap', { state: { from: '/tai-khoan' }, replace: true });
    }
  }, [status, navigate]);

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
      { id: 'profile', label: t.navProfile },
      { id: 'orders', label: t.navOrders },
      { id: 'security', label: t.navSecurity },
      { id: 'preferences', label: t.navPreferences },
    ],
    [t]
  );

  const goTo = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast(t.signedOut);
    navigate('/');
  };

  const isLoading = status === 'loading' || !user;

  return (
    <section className="s ac-page">
      <header className="ac-head">
        <p className="ac-kicker">{t.kicker}</p>
        <h1 className="ac-title">{t.pageTitle}</h1>
        <p className="ac-subtitle">{t.pageSubtitle}</p>
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
              <span className="ac-identity-name">{user.fullName}</span>
              <span className="ac-identity-email">{user.email}</span>
            </div>

            <nav className="ac-nav" aria-label={t.menuLabel}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ac-nav-link ${active === item.id ? 'is-active' : ''}`.trim()}
                  aria-current={active === item.id ? 'true' : undefined}
                  onClick={() => goTo(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button type="button" className="ac-signout" onClick={handleLogout}>
              {t.signOut}
            </button>
          </aside>

          <div className="ac-main">
            <AccountProfile />
            <AccountOrders />
            <AccountSecurity />
            <AccountPreferences />
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountPage;
