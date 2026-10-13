import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { AccountSection } from './AccountSection';
import { accountLocale, useAccountI18n } from './accountI18n';

export const AccountProfile: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { lang, t } = useAccountI18n();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(accountLocale(lang))
    : '—';

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
        <div className="ac-detail-row">
          <dt>{t.memberSince}</dt>
          <dd>{memberSince}</dd>
        </div>
        <div className="ac-detail-row">
          <dt>{t.emailStatus}</dt>
          <dd>
            <span className={`ac-status ${user.emailVerified ? 'ac-status-ok' : 'ac-status-warn'}`}>
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
      </dl>
    </AccountSection>
  );
};

export default AccountProfile;
