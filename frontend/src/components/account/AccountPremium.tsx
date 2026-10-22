import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Headphones, Languages, Lock, QrCode, ShieldCheck } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';
import { formatAccountDate } from './accountFormatters';

export const AccountPremium: React.FC = () => {
  const { lang, t } = useAccountI18n();
  const navigate = useNavigate();
  const { isPremium, premiumExpiresAt } = usePremium();

  const expiry = isPremium
    ? premiumExpiresAt
      ? formatAccountDate(premiumExpiresAt, lang)
      : t.premiumNoExpiry
    : '-';

  const benefits = [
    {
      icon: Languages,
      title: t.premiumLanguagesTitle,
      description: t.premiumLanguagesDesc,
    },
    {
      icon: Headphones,
      title: t.premiumAudioTitle,
      description: t.premiumAudioDesc,
    },
    {
      icon: QrCode,
      title: t.premiumQrTitle,
      description: t.premiumQrDesc,
    },
  ];

  return (
    <AccountSection id="premium" title={t.premiumTitle} description={t.premiumDesc}>
      <div className={`ac-premium-hero${isPremium ? ' is-active' : ''}`}>
        <div className="ac-premium-identity">
          <span className="ac-premium-crown" aria-hidden="true">
            <Crown size={24} strokeWidth={1.8} />
          </span>
          <div className="ac-premium-copy">
            <p className="ac-premium-eyebrow">{t.planLabel}</p>
            <h3 className="ac-premium-plan">{isPremium ? t.planPremium : t.planFree}</h3>
            <p className="ac-premium-state">
              {isPremium ? t.premiumActive : t.premiumInactive}
            </p>
            <p className="ac-premium-note">
              {isPremium ? t.premiumActiveNote : t.premiumFreeNote}
            </p>
          </div>
        </div>

        <div className="ac-premium-facts">
          <div className="ac-premium-fact">
            <span>{t.premiumStatusLabel}</span>
            <strong className={isPremium ? 'is-active' : undefined}>
              {isPremium ? t.premiumStatusActive : t.premiumStatusInactive}
            </strong>
          </div>
          <div className="ac-premium-fact">
            <span>{t.premiumExpires}</span>
            <strong>{expiry}</strong>
          </div>
        </div>

        <div className="ac-premium-languages" aria-label={t.premiumLanguagesTitle}>
          <span className="is-free" title={t.premiumFreeLanguages}>
            VI
          </span>
          {(['EN', 'JA', 'KO'] as const).map((code) => (
            <span key={code} className={isPremium ? 'is-open' : 'is-locked'}>
              {code}
              {isPremium ? (
                <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Lock size={11} strokeWidth={2} aria-hidden="true" />
              )}
            </span>
          ))}
        </div>

        {isPremium ? (
          <span className="ac-premium-badge">
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
            {t.premiumStatusActive}
          </span>
        ) : (
          <button
            type="button"
            className="ac-btn ac-btn-primary ac-premium-cta"
            onClick={() => navigate('/nang-cap')}
          >
            {t.premiumUpgrade}
          </button>
        )}
      </div>

      <div className="ac-premium-benefits">
        <div className="ac-premium-benefits-head">
          <h3>{t.premiumBenefitsTitle}</h3>
          <p>{isPremium ? t.premiumActiveNote : t.premiumFreeLanguages}</p>
        </div>
        <div className="ac-premium-benefit-grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className={`ac-premium-benefit${isPremium ? ' is-open' : ' is-locked'}`}
            >
              <span className="ac-premium-benefit-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
              <span className="ac-premium-benefit-state">
                {isPremium ? t.premiumUnlocked : t.premiumLocked}
              </span>
            </article>
          ))}
        </div>
      </div>
    </AccountSection>
  );
};

export default AccountPremium;
