import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Crown,
  Headphones,
  Languages,
  Loader2,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import nearbyPoisData from '../content/nearbyPois.json';
import { PREMIUM_COPY, formatPremiumText } from '../content/premiumI18n';
import { useNavbarLanguage } from '../content/languages';
import { useAuth } from '../context/AuthContext';
import {
  usePremium,
  PREMIUM_LANGUAGES,
  buildPremiumPath,
} from '../context/PremiumContext';
import { createPremiumOrder, createVnPayPayment } from '../services/orderService';
import { formatPrice } from '../utils/formatters';
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

type PackageLanguage = 'en' | 'ja' | 'ko';

interface PremiumPackage {
  language: PackageLanguage;
  image: string;
}

const POIS = nearbyPoisData as unknown as PremiumPoi[];
const PREMIUM_PRICE = 500000;

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const PREMIUM_PACKAGES: PremiumPackage[] = [
  { language: 'en', image: '/images/pois/buu-dien-trung-tam.jpg' },
  { language: 'ja', image: '/images/pois/nha-tho-duc-ba.jpg' },
  { language: 'ko', image: '/images/pois/cho-ben-thanh.jpg' },
];

const FEATURE_ICONS = [Languages, Headphones, QrCode, MapPin];

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function requestedPremiumLanguage(value: string | null): SupportedLanguage | null {
  if (!value) return null;
  return PREMIUM_LANGUAGES.includes(value as SupportedLanguage)
    ? (value as SupportedLanguage)
    : null;
}

export const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, changeLanguage } = useNavbarLanguage();
  const { isPremium } = usePremium();
  const { isAuthenticated } = useAuth();
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = PREMIUM_COPY[lang] ?? PREMIUM_COPY.vi;
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const requestedLanguage = requestedPremiumLanguage(searchParams.get('lang'));

  useEffect(() => {
    if (isPremium) {
      navigate('/tai-khoan#premium', { replace: true });
    }
  }, [isPremium, navigate]);

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
    languageCount: PREMIUM_LANGUAGES.length,
  };

  const handleCheckout = async () => {
    if (isPremium) {
      navigate('/tai-khoan#premium');
      return;
    }
    if (requestedLanguage) {
      changeLanguage(requestedLanguage);
    }
    if (!isAuthenticated) {
      navigate('/dang-nhap', {
        state: { from: buildPremiumPath(requestedLanguage ?? undefined, returnTo) },
      });
      return;
    }

    setNotice('');
    setIsSubmitting(true);
    try {
      const order = await createPremiumOrder();
      const paymentUrl = order.paymentUrl ?? (await createVnPayPayment(order.orderCode));
      if (!paymentUrl) {
        throw new Error(copy.paymentError);
      }
      window.location.assign(paymentUrl);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.paymentError);
      setIsSubmitting(false);
    }
  };

  const handleBackToTour = () => {
    navigate(returnTo || '/diem-du-lich');
  };

  return (
    <div className="premium-page">
      <section className="premium-hero" aria-labelledby="premium-page-title">
        <img
          className="premium-hero-image"
          src={HERO_CONFIG.diemDuLich.src}
          alt=""
          style={{ objectPosition: HERO_CONFIG.diemDuLich.position }}
          loading="eager"
          decoding="async"
        />
        <div className="premium-hero-overlay" aria-hidden="true" />

        <div className="premium-hero-inner">
          <div className="premium-hero-top">
            <button type="button" className="premium-back-link" onClick={handleBackToTour}>
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
              <span>{copy.backToTour}</span>
            </button>
          </div>

          <div className="premium-hero-copy">
            <p className="premium-eyebrow">{copy.eyebrow}</p>
            <h1 id="premium-page-title">{copy.title}</h1>
            <p className="premium-hero-subtitle">{copy.subtitle}</p>
          </div>
        </div>

        <span className="premium-hero-credit">{HERO_CONFIG.diemDuLich.credit}</span>
      </section>

      <main className="premium-shell">
        {requestedLanguage && (
          <div className="premium-request-note" role="status">
            <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
            <p>
              {copy.requestedLanguageNote}{' '}
              <strong>{LANGUAGE_NAMES[requestedLanguage]}</strong>
            </p>
          </div>
        )}

        {notice && (
          <p className="premium-notice" role="alert">
            {notice}
          </p>
        )}

        <section className="premium-overview" aria-labelledby="premium-benefits-title">
          <div className="premium-benefits">
            <div className="premium-section-head">
              <h2 id="premium-benefits-title">{copy.benefitsTitle}</h2>
              <p className="premium-lead">{copy.benefitsSubtitle}</p>
            </div>

            <div className="premium-benefit-grid">
              {copy.benefits.map((benefit, index) => {
                const Icon = FEATURE_ICONS[index] ?? Languages;
                return (
                  <article className="premium-benefit-card" key={benefit.title}>
                    <span className="premium-benefit-icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.75} />
                    </span>
                    <h3>{formatPremiumText(benefit.title, values)}</h3>
                    <p>{formatPremiumText(benefit.description, values)}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="premium-offer">
            <div className="premium-offer-head">
              <span className="premium-offer-icon" aria-hidden="true">
                <Crown size={22} strokeWidth={1.75} />
              </span>
              <span className="premium-offer-label">{copy.offerBadge}</span>
            </div>

            <h2>{copy.purchaseTitle}</h2>
            <p className="premium-offer-value">
              {formatPrice(PREMIUM_PRICE)}
              <span>{copy.priceUnit}</span>
            </p>
            <p className="premium-offer-description">
              {formatPremiumText(copy.purchaseDescription, values)}
            </p>

            <div className="premium-language-badges" aria-label={copy.languagesTitle}>
              <span className="is-free">VI</span>
              {PREMIUM_LANGUAGES.map((language) => (
                <span key={language} className="is-locked" title={LANGUAGE_NAMES[language]}>
                  {language.toUpperCase()}
                  <Lock size={11} strokeWidth={2} aria-hidden="true" />
                </span>
              ))}
            </div>

            <button
              type="button"
              className="premium-btn premium-btn-primary premium-pay-btn"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={17}
                    strokeWidth={2}
                    className="premium-spin"
                    aria-hidden="true"
                  />
                  <span>{copy.checkoutPending}</span>
                </>
              ) : (
                <>
                  <CreditCard size={17} strokeWidth={2} aria-hidden="true" />
                  <span>{copy.checkoutCta}</span>
                </>
              )}
            </button>
            {!isAuthenticated && <p className="premium-login-note">{copy.loginNote}</p>}

            <p className="premium-secure-note">
              <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
              <span>{copy.secureNote}</span>
            </p>
          </aside>
        </section>

        <section className="premium-languages" aria-labelledby="premium-packages-title">
          <div className="premium-section-head">
            <h2 id="premium-packages-title">
              {formatPremiumText(copy.languagesTitle, values)}
            </h2>
            <p className="premium-lead">{copy.languagesSubtitle}</p>
          </div>

          <div className="premium-package-grid">
            {PREMIUM_PACKAGES.map((pkg) => (
              <article className="premium-package-card" key={pkg.language}>
                <div className="premium-package-media">
                  <img
                    src={pkg.image}
                    alt={`${LANGUAGE_NAMES[pkg.language]} - ${copy.title}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="premium-package-code">{pkg.language.toUpperCase()}</span>
                </div>
                <div className="premium-package-body">
                  <h3>{LANGUAGE_NAMES[pkg.language]}</h3>
                  <p>{copy.languageDescriptions[pkg.language]}</p>
                  <span className="premium-package-status is-locked">
                    <Lock size={13} strokeWidth={2.2} aria-hidden="true" />
                    {copy.lockedLabel}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="premium-stops" aria-labelledby="premium-content-title">
          <div className="premium-section-head">
            <h2 id="premium-content-title">
              {formatPremiumText(copy.stopsTitle, values)}
            </h2>
            <p className="premium-lead">{copy.stopsSubtitle}</p>
          </div>

          <div className="premium-stop-table">
            <div className="premium-stop-head" aria-hidden="true">
              <span>{copy.stopColumn}</span>
              <span>{copy.languagesColumn}</span>
              <span>{copy.statusColumn}</span>
            </div>

            {POIS.map((poi, index) => (
              <article className="premium-poi-card" key={poi.id}>
                <div className="premium-poi-copy">
                  <span className="premium-poi-number">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{poi.name[lang] || poi.name.vi}</h3>
                    <p>{poi.category[lang] || poi.category.vi}</p>
                  </div>
                </div>
                <div className="premium-poi-languages">
                  <span className="is-free" title={copy.freeLabel}>
                    VI
                  </span>
                  {PREMIUM_LANGUAGES.map((language) => (
                    <span
                      key={language}
                      className="is-locked"
                      title={`${LANGUAGE_NAMES[language]} - ${copy.premiumLabel}`}
                    >
                      {language.toUpperCase()}
                      <Lock size={11} strokeWidth={2} aria-hidden="true" />
                    </span>
                  ))}
                </div>
                <span className="premium-poi-status is-locked">{copy.premiumLabel}</span>
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
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
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
            <button
              type="button"
              className="premium-btn premium-btn-light"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? copy.checkoutPending : copy.checkoutCta}
            </button>
            <button
              type="button"
              className="premium-btn premium-btn-outline-light"
              onClick={handleBackToTour}
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
