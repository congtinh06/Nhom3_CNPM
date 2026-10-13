import React from 'react';
import { Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useNavbarLanguage } from '../../content/languages';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';

export const AccountPreferences: React.FC = () => {
  const { lang, t } = useAccountI18n();
  const { changeLanguage } = useNavbarLanguage();

  return (
    <AccountSection id="preferences" title={t.preferencesTitle} description={t.preferencesDesc}>
      <div className="ac-lang" role="group" aria-label={t.language}>
        {SUPPORTED_LANGUAGES.map((option) => {
          const active = option.code === lang;
          return (
            <button
              key={option.code}
              type="button"
              className={`ac-lang-option ${active ? 'ac-lang-active' : ''}`.trim()}
              aria-pressed={active}
              onClick={() => changeLanguage(option.code)}
            >
              <span className="ac-lang-name">{option.label}</span>
              <span className="ac-lang-code">{option.short}</span>
              {active && <Check size={15} strokeWidth={2} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </AccountSection>
  );
};

export default AccountPreferences;
