import React, { useState } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';
import { formatAccountDate } from './accountFormatters';

export const AccountProfile: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isPremium } = usePremium();
  const { lang, t } = useAccountI18n();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);

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

  return (
    <AccountSection id="profile" title={t.profileTitle} description={t.profileDesc}>
      <div className="ac-profile-grid">
        <article className="ac-card">
          <header className="ac-card-head">
            <span className="ac-card-icon" aria-hidden="true">
              <UserRound size={18} strokeWidth={1.8} />
            </span>
            <h3>{t.profileInfoTitle}</h3>
          </header>
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
    </AccountSection>
  );
};

export default AccountProfile;
