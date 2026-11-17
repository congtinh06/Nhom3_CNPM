import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';

export const AccountSecurity: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useAccountI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      showToast(t.logoutAllDone);
      await logout();
      navigate('/');
    } catch {
      showToast(t.logoutAllFailed);
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <AccountSection id="security" title={t.securityTitle} description={t.securityDesc}>
      <aside className="ac-card ac-danger">
        <h3>{t.securitySessionsTitle}</h3>
        <p>{t.logoutAllNote}</p>
        <button
          type="button"
          className="ac-btn ac-btn-ghost"
          onClick={handleLogoutAll}
          disabled={loggingOutAll}
        >
          {loggingOutAll ? t.loggingOutAll : t.logoutAll}
        </button>
      </aside>
    </AccountSection>
  );
};

export default AccountSecurity;
