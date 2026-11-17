import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Headphones, Languages, Lock, MapPin, QrCode, ShieldCheck } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { api } from '../../api/client';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';
import { formatAccountDate } from './accountFormatters';
import { SupportedLanguage } from '../../types';

const POI_OVERRIDES: Record<SupportedLanguage, { title: string; note: string; empty: string; listen: string }> = {
  vi: {
    title: 'Điểm thuyết minh đã mở khóa',
    note: 'Gói ngoại ngữ riêng cho từng điểm (365 ngày từ ngày mua).',
    empty: 'Bạn chưa mua gói riêng cho điểm nào.',
    listen: 'Nghe thuyết minh',
  },
  en: {
    title: 'Unlocked narration stops',
    note: 'Per-stop foreign-language package (365 days from purchase).',
    empty: "You haven't bought any per-stop package yet.",
    listen: 'Listen to narration',
  },
  ja: {
    title: '解除済みのナレーションスポット',
    note: 'スポットごとの外国語パッケージ（購入日から365日）。',
    empty: 'まだスポット単位のパッケージを購入していません。',
    listen: '音声ガイドを聞く',
  },
  ko: {
    title: '해제된 해설 명소',
    note: '명소별 외국어 패키지(구매일로부터 365일)。',
    empty: '아직 명소별 패키지를 구매하지 않았습니다.',
    listen: '해설 듣기',
  },
};

export const AccountPremium: React.FC = () => {
  const { lang, t } = useAccountI18n();
  const navigate = useNavigate();
  const { isPremium, premiumExpiresAt, purchasedPois } = usePremium();

  const expiry = isPremium
    ? premiumExpiresAt
      ? formatAccountDate(premiumExpiresAt, lang)
      : t.premiumNoExpiry
    : '-';

  // Tên POI cho gói mua lẻ (nguồn chung với trang du khách); lỗi mạng thì hiện id.
  const [poiNames, setPoiNames] = useState<Record<number, string>>({});
  const [poiSlugs, setPoiSlugs] = useState<Record<number, string>>({});
  useEffect(() => {
    if (purchasedPois.length === 0) return;
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPoiGuides !== 'function') return;
    let cancelled = false;
    api
      .getPoiGuides()
      .then((guides) => {
        if (!cancelled) {
          const names: Record<number, string> = {};
          const slugs: Record<number, string> = {};
          guides.forEach((guide) => {
            names[guide.id] = guide.name;
            if (guide.slug) slugs[guide.id] = guide.slug;
          });
          setPoiNames(names);
          setPoiSlugs(slugs);
        }
      })
      .catch(() => {
        // Bỏ qua: hiển thị theo id POI.
      });
    return () => {
      cancelled = true;
    };
  }, [purchasedPois.length]);

  const poiOverrides = POI_OVERRIDES[lang] ?? POI_OVERRIDES.vi;

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
      <div className="ac-premium-pois">
        <div className="ac-premium-benefits-head">
          <h3>{poiOverrides.title}</h3>
          <p>{poiOverrides.note}</p>
        </div>
        {purchasedPois.length === 0 ? (
          <p className="ac-premium-pois-empty">{poiOverrides.empty}</p>
        ) : (
          <ul className="ac-premium-poi-list">
            {purchasedPois.map((poi) => {
              const poiName = poiNames[poi.poiId] ?? `POI #${poi.poiId}`;
              const stopQuery = poiSlugs[poi.poiId] || String(poi.poiId);
              return (
                <li key={poi.poiId}>
                  <Link
                    className="ac-premium-poi-item"
                    to={`/diem-du-lich?stop=${encodeURIComponent(stopQuery)}`}
                    aria-label={`${poiName}: ${poiOverrides.listen}`}
                  >
                    <span className="ac-premium-poi-icon" aria-hidden="true">
                      <MapPin size={14} strokeWidth={1.9} />
                    </span>
                    <span className="ac-premium-poi-name">{poiName}</span>
                    <span className="ac-premium-poi-expiry">
                      {formatAccountDate(poi.expiresAt, lang)}
                    </span>
                    <span className="ac-premium-poi-play" aria-hidden="true">
                      <Headphones size={14} strokeWidth={1.9} />
                      <span className="ac-premium-poi-play-text">{poiOverrides.listen}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AccountSection>
  );
};

export default AccountPremium;
