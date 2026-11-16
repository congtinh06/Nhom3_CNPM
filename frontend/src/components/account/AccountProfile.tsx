import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { getMyOrders } from '../../services/orderService';
import { BackendOrder } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { StatusBadge } from '../orders/StatusBadge';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';
import { formatAccountDate } from './accountFormatters';
import { normalizeApiError } from '../../api/errors';

export const AccountProfile: React.FC = () => {
  const { user, isAdmin, reloadUser } = useAuth();
  const { isPremium } = usePremium();
  const { lang, t } = useAccountI18n();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersFailed, setOrdersFailed] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? '');
  }, [user?.fullName]);

  useEffect(() => {
    let cancelled = false;

    void getMyOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOrdersFailed(true);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const activeStatuses: BackendOrder['status'][] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING'];
    return {
      total: orders.length,
      active: orders.filter((order) => activeStatuses.includes(order.status)).length,
      spent: orders
        .filter((order) => order.status !== 'CANCELLED')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    };
  }, [orders]);

  if (!user) return null;

  const memberSince = formatAccountDate(user.createdAt, lang);

  const handleResend = async () => {
    if (!user.email) return;
    setResending(true);
    try {
      await authApi.resendVerification(user.email);
      showToast(t.resent);
    } catch {
      showToast(t.resendFailed);
    } finally {
      setResending(false);
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextName = fullName.trim();
    if (nextName.length < 2) {
      setProfileError(t.fullNameTooShort);
      return;
    }
    setSaving(true);
    setProfileError('');
    try {
      await authApi.updateProfile({ fullName: nextName });
      await reloadUser();
      setEditing(false);
      showToast(t.profileUpdated);
    } catch (err) {
      setProfileError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountSection id="profile" title={t.profileTitle} description={t.profileDesc}>
      <div className="ac-profile-stack">
        <div className="ac-profile-grid">
        <article className="ac-card">
          <header className="ac-card-head">
            <span className="ac-card-icon" aria-hidden="true">
              <UserRound size={18} strokeWidth={1.8} />
            </span>
            <h3>{t.profileInfoTitle}</h3>
          </header>
          {editing ? (
            <form className="ac-profile-form" onSubmit={handleSaveProfile} noValidate>
              <label htmlFor="account-full-name">{t.fullName}</label>
              <input
                id="account-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                maxLength={150}
                required
              />
              <p className="ac-form-note">{t.profileEmailNote}</p>
              {profileError && <p className="ac-error" role="alert">{profileError}</p>}
              <div className="ac-form-actions">
                <button type="submit" className="ac-btn ac-btn-primary" disabled={saving}>
                  {saving ? t.savingProfile : t.saveProfile}
                </button>
                <button type="button" className="ac-btn ac-btn-ghost" onClick={() => { setEditing(false); setFullName(user.fullName ?? ''); setProfileError(''); }} disabled={saving}>
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <>
              <dl className="ac-detail">
                <div className="ac-detail-row">
                  <dt>{t.fullName}</dt>
                  <dd>{user.fullName}</dd>
                </div>
                <div className="ac-detail-row">
                  <dt>{t.email}</dt>
                  <dd>{user.email}</dd>
                </div>
                <div className="ac-detail-row">
                  <dt>{t.role}</dt>
                  <dd>{isAdmin ? t.roleAdmin : t.roleUser}</dd>
                </div>
              </dl>
              <div className="ac-form-actions">
                <button type="button" className="ac-btn ac-btn-ghost" onClick={() => setEditing(true)}>
                  {t.editProfile}
                </button>
              </div>
            </>
          )}
        </article>

        <article className="ac-card">
          <header className="ac-card-head">
            <span className="ac-card-icon" aria-hidden="true">
              <ShieldCheck size={18} strokeWidth={1.8} />
            </span>
            <h3>{t.profileStatusTitle}</h3>
          </header>
          <dl className="ac-detail">
            <div className="ac-detail-row">
              <dt>{t.memberSince}</dt>
              <dd>{memberSince}</dd>
            </div>
            <div className="ac-detail-row">
              <dt>{t.emailStatus}</dt>
              <dd>
                <span
                  className={`ac-status ${user.emailVerified ? 'ac-status-ok' : 'ac-status-warn'}`}
                >
                  {user.emailVerified ? t.verified : t.unverified}
                </span>
                {!user.emailVerified && (
                  <button
                    type="button"
                    className="ac-btn ac-btn-ghost ac-resend"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? t.resending : t.resend}
                  </button>
                )}
              </dd>
            </div>
            <div className="ac-detail-row">
              <dt>{t.planLabel}</dt>
              <dd>{isPremium ? t.planPremium : t.planFree}</dd>
            </div>
          </dl>
        </article>
        </div>

        <div className="ac-stats">
          <div className="ac-stat">
            <span className="ac-stat-value">{ordersLoading ? '—' : stats.total}</span>
            <span className="ac-stat-label">{t.quickStatsOrders}</span>
          </div>
          <div className="ac-stat">
            <span className="ac-stat-value">{ordersLoading ? '—' : stats.active}</span>
            <span className="ac-stat-label">{t.quickStatsActive}</span>
          </div>
          <div className="ac-stat">
            <span className="ac-stat-value">
              {ordersLoading ? '—' : formatPrice(stats.spent)}
            </span>
            <span className="ac-stat-label">{t.quickStatsSpent}</span>
          </div>
        </div>

        <article className="ac-card">
          <header className="ac-card-head ac-card-head-spread">
            <span className="ac-card-icon" aria-hidden="true">
              <ShoppingBag size={18} strokeWidth={1.8} />
            </span>
            <h3>{t.recentOrdersTitle}</h3>
            <Link className="ac-card-link" to="/tai-khoan#orders">
              {t.viewAllOrders}
            </Link>
          </header>
          {ordersLoading && <p className="ac-muted">{t.ordersLoading}</p>}
          {!ordersLoading && ordersFailed && <p className="ac-error">{t.ordersError}</p>}
          {!ordersLoading && !ordersFailed && orders.length === 0 && (
            <p className="ac-muted">{t.ordersEmpty}</p>
          )}
          {!ordersLoading && !ordersFailed && orders.length > 0 && (
            <ul className="ac-orders">
              {orders.slice(0, 2).map((order) => (
                <li key={order.orderCode} className="ac-order">
                  <div className="ac-order-main">
                    <span className="ac-order-code">
                      <span className="ac-order-label">{t.orderCode}</span>
                      {order.orderCode}
                    </span>
                    <span className="ac-order-date">
                      <span className="ac-order-label">{t.orderDate}</span>
                      {formatAccountDate(order.createdAt, lang)}
                    </span>
                    <span className="ac-order-total">
                      <span className="ac-order-label">{t.orderTotal}</span>
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </AccountSection>
  );
};

export default AccountProfile;
