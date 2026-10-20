import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useNavbarLanguage } from '../../content/languages';
import { usePremium, buildPremiumPath } from '../../context/PremiumContext';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';

export const AccountPreferences: React.FC = () => {
  const { lang, t } = useAccountI18n();
  const { changeLanguage } = useNavbarLanguage();
  const navigate = useNavigate();
  const { canAccessLanguage } = usePremium();

  return (
    <AccountSection id="preferences" title={t.preferencesTitle} description={t.preferencesDesc}>
      <div className="ac-lang" role="group" aria-label={t.language}>
        {SUPPORTED_LANGUAGES.map((option) => {
          const active = option.code === lang;
          const locked = !canAccessLanguage(option.code);
          return (
            <button
              key={option.code}
              type="button"
              className={`ac-lang-option ${active ? 'ac-lang-active' : ''} ${
                locked ? 'ac-lang-locked' : ''
              }`.trim()}
              aria-pressed={active}
              onClick={() => {
                if (locked) {
                  navigate(buildPremiumPath(option.code, '/tai-khoan'));
                  return;
                }
                changeLanguage(option.code);
              }}
            >
              <span className="ac-lang-name">{option.label}</span>
              <span className="ac-lang-code">
                {locked && <Lock size={11} strokeWidth={2} aria-hidden="true" />}
                {option.short}
              </span>
            </button>
          );
        })}
      </div>
    </AccountSection>
  );
};

export default AccountPreferences;
