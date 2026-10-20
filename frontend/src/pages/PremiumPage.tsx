import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  Crown,
  Headphones,
  Languages,
  Lock,
  MapPin,
  QrCode,
  Sparkles,
} from 'lucide-react';
import nearbyPoisData from '../content/nearbyPois.json';
import { PREMIUM_COPY, formatPremiumText } from '../content/premiumI18n';
import { useNavbarLanguage } from '../content/languages';
import { usePremium, PREMIUM_LANGUAGES } from '../context/PremiumContext';
import { PageHero } from '../components/common/PageHero';
import { HERO_CONFIG } from '../config/heroImages';
import { SupportedLanguage } from '../types';
import '../styles/premium.css';

interface PremiumPoi {
  id: string;
  slug?: string;
  name: Record<SupportedLanguage, string>;
  category: Record<SupportedLanguage, string>;
  transcript?: Partial<Record<SupportedLanguage, string>>;
  narration?: {
    short?: Partial<Record<SupportedLanguage, string>>;
    full?: Partial<Record<SupportedLanguage, string[]>>;
  };
}

const POIS = nearbyPoisData as unknown as PremiumPoi[];

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const FEATURE_ICONS = [Languages, Headphones, QrCode, MapPin];

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function requestedPremiumLanguage(value: string | null): SupportedLanguage | null {
  if (!value) return null;
  const match = PREMIUM_LANGUAGES.find((language) => language === value);
  return match ?? null;
}

export const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, changeLanguage } = useNavbarLanguage();
  const { isPremium, activatePremium, deactivatePremium } = usePremium();
  const [notice, setNotice] = useState('');

  const copy = PREMIUM_COPY[lang] ?? PREMIUM_COPY.vi;
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const requestedLanguage = requestedPremiumLanguage(searchParams.get('lang'));

  const foreignScriptCount = useMemo(
    () =>
      POIS.reduce(
        (total, poi) =>
          total +
          PREMIUM_LANGUAGES.filter((language) => {
            const shortNarration = poi.narration?.short?.[language];
            const fullNarration = poi.narration?.full?.[language];
            return Boolean(
              poi.transcript?.[language] ||
                shortNarration ||
                (fullNarration && fullNarration.length > 0)
            );
          }).length,
        0
      ),
    []
  );

  const values = {
    count: foreignScriptCount,
    poiCount: POIS.length,
  };

  const handleActivate = () => {
    activatePremium();
    if (requestedLanguage) {
      changeLanguage(requestedLanguage);
    }
    setNotice(copy.unlockedNotice);
    if (returnTo) {
      navigate(returnTo, { replace: true });
    }
  };

  const handleContinue = () => {
    if (requestedLanguage) {
      changeLanguage(requestedLanguage);
    }
    navigate(returnTo || '/diem-du-lich');
  };

  const handleDeactivate = () => {
    deactivatePremium();
    if (lang !== 'vi') {
      changeLanguage('vi');
    }
    setNotice(copy.deactivatedNote);
  };

  return (
    <div className="premium-page">
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        imageSrc={HERO_CONFIG.diemDuLich.src}
        imageSrcMobile={HERO_CONFIG.diemDuLich.srcMobile}
        imagePosition={HERO_CONFIG.diemDuLich.position}
        imageCredit={HERO_CONFIG.diemDuLich.credit}
        rightSlot={<span>{isPremium ? copy.activeBadge : copy.freeBadge}</span>}
      />

      <main className="premium-shell">
        {requestedLanguage && !isPremium && (
          <div className="premium-request-note" role="status">
            <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
            <p>
              {copy.requestedLanguageNote}{' '}
              <strong>{LANGUAGE_NAMES[requestedLanguage]}</strong>
            </p>
          </div>
        )}

        {notice && (
          <p className="premium-notice" role="status" aria-live="polite">
            {notice}
          </p>
        )}

        <section className="premium-intro-grid" aria-labelledby="premium-benefits-title">
          <div className="premium-benefits-panel">
            <p className="premium-kicker">{copy.offerTitle}</p>
            <h2 id="premium-benefits-title">{copy.benefitsTitle}</h2>
            <p className="premium-lead">{copy.benefitsSubtitle}</p>

            <div className="premium-benefit-grid">
              {copy.benefits.map((benefit, index) => {
                const Icon = FEATURE_ICONS[index] ?? Sparkles;
                return (
                  <article className="premium-benefit-card" key={benefit.title}>
                    <span className="premium-benefit-icon" aria-hidden="true">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3>{formatPremiumText(benefit.title, values)}</h3>
                      <p>{formatPremiumText(benefit.description, values)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className={`premium-offer ${isPremium ? 'is-active' : ''}`}>
            <div className="premium-offer-head">
              <span className="premium-offer-icon" aria-hidden="true">
                {isPremium ? (
                  <BadgeCheck size={22} strokeWidth={1.75} />
                ) : (
                  <Crown size={22} strokeWidth={1.75} />
                )}
              </span>
              <span className="premium-offer-label">{copy.demoLabel}</span>
            </div>

            <p className="premium-offer-value">{isPremium ? copy.activeCta : copy.demoValue}</p>
            <p className="premium-offer-description">
              {formatPremiumText(copy.offerDescription, values)}
            </p>

            <div className="premium-language-badges" aria-label={copy.benefits[0]?.title}>
              <span className="is-free">VI</span>
              {PREMIUM_LANGUAGES.map((language) => (
                <span
                  key={language}
                  className={isPremium ? 'is-open' : 'is-locked'}
                  title={LANGUAGE_NAMES[language]}
                >
                  {language.toUpperCase()}
                  {!isPremium && <Lock size={11} strokeWidth={2} aria-hidden="true" />}
                </span>
              ))}
            </div>

            {isPremium ? (
              <>
                <button type="button" className="premium-btn premium-btn-primary" onClick={handleContinue}>
                  {copy.continueCta}
                </button>
                <button type="button" className="premium-btn premium-btn-quiet" onClick={handleDeactivate}>
                  {copy.deactivateCta}
                </button>
              </>
            ) : (
              <button type="button" className="premium-btn premium-btn-primary" onClick={handleActivate}>
                {copy.activateCta}
              </button>
            )}

            <p className="premium-demo-note">{copy.demoNote}</p>
          </aside>
        </section>

        <section className="premium-content-section" aria-labelledby="premium-content-title">
          <div className="premium-section-head">
            <h2 id="premium-content-title">
              {formatPremiumText(copy.contentTitle, values)}
            </h2>
            <p className="premium-lead">{copy.contentSubtitle}</p>
          </div>

          <div className="premium-poi-grid">
            {POIS.map((poi, index) => (
              <article className="premium-poi-card" key={poi.id}>
                <span className="premium-poi-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="premium-poi-copy">
                  <h3>{poi.name[lang] || poi.name.vi}</h3>
                  <p>{poi.category[lang] || poi.category.vi}</p>
                </div>
                <div className="premium-poi-languages">
                  <span className="is-free" title={copy.freeLanguage}>
                    VI
                  </span>
                  {PREMIUM_LANGUAGES.map((language) => (
                    <span
                      key={language}
                      className={isPremium ? 'is-open' : 'is-locked'}
                      title={`${LANGUAGE_NAMES[language]} - ${copy.premiumLanguage}`}
                    >
                      {language.toUpperCase()}
                      {isPremium ? (
                        <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Lock size={11} strokeWidth={2} aria-hidden="true" />
                      )}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="premium-steps-section" aria-labelledby="premium-steps-title">
          <div className="premium-section-head">
            <h2 id="premium-steps-title">{copy.stepsTitle}</h2>
          </div>

          <ol className="premium-steps">
            {copy.steps.map((step, index) => (
              <li key={step.title}>
                <span className="premium-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="premium-closing">
          <div>
            <h2>{copy.closingTitle}</h2>
            <p>{copy.closingDescription}</p>
          </div>
          <div className="premium-closing-actions">
            {!isPremium ? (
              <button type="button" className="premium-btn premium-btn-light" onClick={handleActivate}>
                {copy.activateCta}
              </button>
            ) : (
              <button type="button" className="premium-btn premium-btn-light" onClick={handleContinue}>
                {copy.continueCta}
              </button>
            )}
            <button
              type="button"
              className="premium-btn premium-btn-outline-light"
              onClick={() => navigate('/diem-du-lich')}
            >
              {copy.backToTour}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PremiumPage;
