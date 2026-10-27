import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ExternalLink, Headphones, Loader2, Lock, Play, Search, X } from 'lucide-react';
import { PREMIUM_COPY, formatPremiumText } from '../content/premiumI18n';
import {
  getPremiumVideo,
  youtubeEmbedUrl,
} from '../content/premiumVideos';
import { useNavbarLanguage } from '../content/languages';
import { useAuth } from '../context/AuthContext';
import {
  usePremium,
  PREMIUM_LANGUAGES,
  buildPremiumPath,
} from '../context/PremiumContext';
import {
  createPremiumOrder,
  createPoiPremiumOrder,
  createVnPayPayment,
  getOrderByCode,
} from '../services/orderService';
import { formatPrice, formatDateTime } from '../utils/formatters';
import { api } from '../api/client';
import { HERO_CONFIG } from '../config/heroImages';
import { PoiGuide, SupportedLanguage } from '../types';
import { resolveImagePath } from '../components/nearby/PoiCard';
import '../styles/premium.css';

const PREMIUM_PRICE = 500000;
/** Giá mua lẻ mặc định cho một điểm thuyết minh (365 ngày). */
const DEFAULT_POI_PRICE = 100000;

type PoiPaymentMethod = 'VNPAY' | 'VIETQR';

/** Giá mua lẻ thực tế của POI: premiumPrice riêng nếu có, không thì giá mặc định. */
export function poiPremiumPrice(premiumPrice?: number | null): number {
  return premiumPrice != null && premiumPrice > 0 ? premiumPrice : DEFAULT_POI_PRICE;
}

interface PoiSectionCopy {
  title: string;
  subtitle: string;
  listNote: string;
  requestedNote: string;
  unlockCta: string;
  processing: string;
  purchased: string;
  priceLabel: string;
  validityNote: string;
  searchPlaceholder: string;
  noResults: string;
}

const POI_SECTION_COPY: Record<SupportedLanguage, PoiSectionCopy> = {
  vi: {
    title: 'Mua lẻ theo điểm thuyết minh',
    subtitle:
      'Chọn đúng điểm bạn muốn nghe. Mỗi điểm mở khóa thuyết minh tiếng Anh, Nhật và Hàn trong 365 ngày.',
    listNote:
      'Mua lẻ 100.000đ/điểm. Combo 7 điểm 500.000đ. Mỗi điểm gồm thuyết minh chi tiết, video giới thiệu, giảm 10% quà lưu niệm. Giá áp dụng 365 ngày.',
    requestedNote: 'Gói ngoại ngữ bạn đang mở khóa:',
    unlockCta: 'Mở khóa',
    processing: 'Đang tạo thanh toán…',
    purchased: 'Đã mở khóa',
    priceLabel: 'Mở khóa lẻ',
    validityNote: 'Giá cho 365 ngày, áp dụng cho thuyết minh ngoại ngữ của điểm này.',
    searchPlaceholder: 'Tìm điểm đến muốn mở khóa...',
    noResults: 'Không tìm thấy điểm đến phù hợp.',
  },
  en: {
    title: 'Buy narration stops one by one',
    subtitle:
      'Unlock only the stops you care about. Each stop includes English, Japanese and Korean narration for 365 days.',
    listNote:
      'Single stop: 100,000₫. 7-stop combo: 500,000₫. Each stop includes detailed narration, an intro video and 10% off souvenirs. The price is valid for 365 days.',
    requestedNote: 'The narration package you are unlocking:',
    unlockCta: 'Unlock',
    processing: 'Creating payment…',
    purchased: 'Unlocked',
    priceLabel: 'Single unlock',
    validityNote: 'Price for 365 days, covering foreign-language narration for this stop.',
    searchPlaceholder: 'Find a stop to unlock...',
    noResults: 'No matching stops found.',
  },
  ja: {
    title: 'スポット単位での購入',
    subtitle:
      '必要なスポットだけを解除できます。各スポットは英語・日本語・韓国語のナレーションを365日間利用できます。',
    listNote:
      '単品は1スポット100,000đ、7スポットセットは500,000đ。各スポットには詳細なナレーション、紹介動画、お土産10%オフが含まれます。価格は365日間有効です。',
    requestedNote: '解除中のナレーションパッケージ:',
    unlockCta: '解除',
    processing: '決済を作成中…',
    purchased: '解除済み',
    priceLabel: '個別解除',
    validityNote: '365日間の価格（このスポットの外国語ナレーション対象）。',
    searchPlaceholder: '解除したいスポットを検索...',
    noResults: '該当するスポットが見つかりません。',
  },
  ko: {
    title: '명소별 개별 구매',
    subtitle:
      '필요한 명소만 해제하세요. 각 명소는 영어, 일본어, 한국어 해설을 365일 동안 이용할 수 있습니다.',
    listNote:
      '단품은 명소당 100,000đ, 7개 명소 콤보는 500,000đ입니다. 각 명소에는 상세 해설, 소개 영상, 기념품 10% 할인이 포함됩니다. 가격은 365일 동안 유효합니다.',
    requestedNote: '해제 중인 해설 패키지:',
    unlockCta: '해제',
    processing: '결제 생성 중…',
    purchased: '해제됨',
    priceLabel: '개별 해제',
    validityNote: '365일 가격(이 명소의 외국어 해설 대상).',
    searchPlaceholder: '해제할 명소 검색...',
    noResults: '일치하는 명소가 없습니다.',
  },
};

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

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

const PENDING_PREMIUM_ORDER_KEY = 'echora:pending_premium_order';
const PENDING_ORDER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface PendingPremiumOrder {
  orderCode: string;
  createdAt: number;
}

function readPendingPremiumOrder(): PendingPremiumOrder | null {
  const raw = sessionStorage.getItem(PENDING_PREMIUM_ORDER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingPremiumOrder> | string;
    if (typeof parsed === 'string') {
      return { orderCode: parsed, createdAt: Date.now() };
    }
    if (parsed && typeof parsed.orderCode === 'string') {
      const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now();
      if (Date.now() - createdAt <= PENDING_ORDER_MAX_AGE_MS) {
        return { orderCode: parsed.orderCode, createdAt };
      }
    }
  } catch {
    return { orderCode: raw, createdAt: Date.now() };
  }
  sessionStorage.removeItem(PENDING_PREMIUM_ORDER_KEY);
  return null;
}

function savePendingPremiumOrder(orderCode: string) {
  const value: PendingPremiumOrder = { orderCode, createdAt: Date.now() };
  sessionStorage.setItem(PENDING_PREMIUM_ORDER_KEY, JSON.stringify(value));
}

function clearPendingPremiumOrder() {
  sessionStorage.removeItem(PENDING_PREMIUM_ORDER_KEY);
}

export const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, changeLanguage } = useNavbarLanguage();
  const {
    isPremium,
    premiumExpiresAt,
    canAccessPoi,
    refreshEntitlement,
    entitlementStatus,
    entitlementError,
  } = usePremium();
  const { isAuthenticated } = useAuth();
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<
    'idle' | 'polling' | 'failed' | 'cancelled' | 'timeout'
  >('idle');
  const [pendingOrderCode, setPendingOrderCode] = useState<string | null>(
    () => readPendingPremiumOrder()?.orderCode ?? null
  );
  const [poiGuides, setPoiGuides] = useState<PoiGuide[] | null>(null);
  const [poiGuidesError, setPoiGuidesError] = useState(false);
  const [poiCheckout, setPoiCheckout] = useState<number | null>(null);
  const [poiMenuOpen, setPoiMenuOpen] = useState<number | null>(null);
  const [expandedExperienceId, setExpandedExperienceId] = useState<number | null>(null);

  const copy = PREMIUM_COPY[lang] ?? PREMIUM_COPY.vi;
  const poiCopy = POI_SECTION_COPY[lang] ?? POI_SECTION_COPY.vi;
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const requestedLanguage = requestedPremiumLanguage(searchParams.get('lang'));
  const requestedPoiIdRaw = Number(searchParams.get('poi'));
  const requestedPoiId =
    Number.isFinite(requestedPoiIdRaw) && requestedPoiIdRaw > 0 ? requestedPoiIdRaw : null;

  const [poiSearch, setPoiSearch] = useState('');

  const spotlightPoi = useMemo(() => {
    if (!requestedPoiId || !poiGuides) return null;
    return poiGuides.find((g) => g.id === requestedPoiId) ?? null;
  }, [requestedPoiId, poiGuides]);

  const filteredPois = useMemo(() => {
    if (!poiGuides) return [];
    if (!poiSearch.trim()) return poiGuides;
    const q = poiSearch.trim().toLowerCase();
    return poiGuides.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryNameVi && p.categoryNameVi.toLowerCase().includes(q))
    );
  }, [poiGuides, poiSearch]);

  useEffect(() => {
    if (isPremium) {
      clearPendingPremiumOrder();
      setPendingOrderCode(null);
      setPollingStatus('idle');
      setNotice('');
      return;
    }

    const returnOrderCode =
      searchParams.get('orderCode') ||
      searchParams.get('vnp_TxnRef') ||
      readPendingPremiumOrder()?.orderCode ||
      null;
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const queryStatus = searchParams.get('status');

    if (queryStatus === 'cancelled' || vnpResponseCode === '24') {
      clearPendingPremiumOrder();
      setPendingOrderCode(null);
      setPollingStatus('cancelled');
      setNotice(copy.paymentCancelled);
      return;
    }

    if (queryStatus === 'failed' || (vnpResponseCode && vnpResponseCode !== '00')) {
      clearPendingPremiumOrder();
      setPendingOrderCode(null);
      setPollingStatus('failed');
      setNotice(copy.paymentFailed);
      return;
    }

    if (!returnOrderCode) {
      setPendingOrderCode(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;
    setPendingOrderCode(returnOrderCode);
    setPollingStatus('polling');

    const checkStatus = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const order = await getOrderByCode(returnOrderCode);
        if (cancelled) return;
        if (order && (order.status === 'PAID' || order.paymentStatus === 'SUCCESS')) {
          await refreshEntitlement();
          if (cancelled) return;
        } else if (order && (order.status === 'CANCELLED' || order.paymentStatus === 'FAILED')) {
          clearPendingPremiumOrder();
          setPendingOrderCode(null);
          setPollingStatus(order.status === 'CANCELLED' ? 'cancelled' : 'failed');
          setNotice(
            order.status === 'CANCELLED' ? copy.paymentCancelled : copy.paymentFailed
          );
          return;
        }
      } catch {
        // Tiếp tục poll nếu lỗi mạng.
      }

      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 2000);
      } else if (!cancelled) {
        setPollingStatus('timeout');
        setNotice(copy.pendingTimedOut);
        await refreshEntitlement();
      }
    };

    void checkStatus();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    isPremium,
    refreshEntitlement,
    copy.paymentCancelled,
    copy.paymentFailed,
    copy.pendingTimedOut,
  ]);

  const loadPoiGuides = useCallback(async () => {
    if (typeof api.getPoiGuides !== 'function') {
      setPoiGuides([]);
      setPoiGuidesError(false);
      return;
    }
    setPoiGuidesError(false);
    try {
      const guides = await api.getPoiGuides();
      setPoiGuides(guides ?? []);
    } catch {
      setPoiGuides([]);
      setPoiGuidesError(true);
    }
  }, []);

  useEffect(() => {
    void loadPoiGuides();
  }, [loadPoiGuides]);

  const requestPoiCardRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!requestedPoiId || !poiGuides) return;
    const frame = window.requestAnimationFrame(() => {
      requestPoiCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requestedPoiId, poiGuides]);

  useEffect(() => {
    if (expandedExperienceId == null) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`premium-poi-experience-${expandedExperienceId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [expandedExperienceId]);

  useEffect(() => {
    if (poiMenuOpen == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPoiMenuOpen(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.premium-poi-unlock-wrap')) setPoiMenuOpen(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [poiMenuOpen]);

  const hasGuideData = Boolean(poiGuides && poiGuides.length > 0);

  const narrationCount = useMemo(() => {
    if (!poiGuides || poiGuides.length === 0) return 0;
    return poiGuides.length * PREMIUM_LANGUAGES.length;
  }, [poiGuides]);

  const values = {
    count: hasGuideData ? narrationCount : '…',
    poiCount: hasGuideData ? poiGuides?.length ?? 0 : '…',
  };

  const isPremiumPending = !isPremium && Boolean(pendingOrderCode);
  const isEntitlementError = entitlementStatus === 'error';

  const handleCheckout = async () => {
    if (isPremium) {
      handleBackToTour();
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
      savePendingPremiumOrder(order.orderCode);
      setPendingOrderCode(order.orderCode);
      setPollingStatus('polling');
      const paymentUrl = order.paymentUrl ?? (await createVnPayPayment(order.orderCode));
      if (!paymentUrl) {
        throw new Error(copy.paymentError);
      }
      window.location.assign(paymentUrl);
    } catch (error) {
      clearPendingPremiumOrder();
      setPendingOrderCode(null);
      setPollingStatus('idle');
      setNotice(error instanceof Error ? error.message : copy.paymentError);
      setIsSubmitting(false);
    }
  };

  const handleCheckAgain = () => {
    if (!pendingOrderCode) return;
    const params = new URLSearchParams(searchParams);
    params.set('orderCode', pendingOrderCode);
    setNotice('');
    navigate(`/nang-cap?${params.toString()}`, { replace: true });
  };

  const handleRetryCheckout = () => {
    clearPendingPremiumOrder();
    setPendingOrderCode(null);
    setPollingStatus('idle');
    setNotice('');
    void handleCheckout();
  };

  const handlePoiCheckout = async (poiId: number, method: PoiPaymentMethod) => {
    setPoiMenuOpen(null);
    if (canAccessPoi(poiId)) {
      navigate(returnTo || '/diem-du-lich');
      return;
    }
    if (!isAuthenticated) {
      navigate('/dang-nhap', {
        state: { from: `/nang-cap?poi=${poiId}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}` },
      });
      return;
    }

    setNotice('');
    setPoiCheckout(poiId);
    try {
      const order = await createPoiPremiumOrder(poiId, method);
      if (method === 'VNPAY') {
        const paymentUrl = order.paymentUrl ?? (await createVnPayPayment(order.orderCode));
        if (!paymentUrl) {
          throw new Error(copy.paymentError);
        }
        window.location.assign(paymentUrl);
        return;
      }
      navigate(`/thanh-toan/qr/${encodeURIComponent(order.orderCode)}`, {
        state: { from: returnTo || '/diem-du-lich' },
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.paymentError);
      setPoiCheckout(null);
    }
  };

  const handleBackToTour = () => {
    navigate(returnTo || '/diem-du-lich');
  };

  const handleWatchVideo = () => {
    const target = poiGuides?.find(
      (poi) => getPremiumVideo(poi.slug) && canAccessPoi(poi.id)
    );
    if (target) {
      setExpandedExperienceId(target.id);
      return;
    }
    document
      .getElementById('premium-poi-purchase')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const planStatusLabel = isPremium
    ? copy.activeBadge
    : isPremiumPending
      ? copy.pendingBadge
      : isEntitlementError
        ? copy.entitlementErrorTitle
        : copy.offerBadge;

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
              <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>{copy.backToTour}</span>
            </button>
          </div>

          <div className="premium-hero-copy">
            <h1 id="premium-page-title">{copy.title}</h1>
            <p className="premium-hero-subtitle">{copy.subtitle}</p>
          </div>
        </div>
      </section>

      <main className="premium-shell">
        {requestedLanguage && (
          <p className="premium-request-note" role="status">
            {copy.requestedLanguageNote} <strong>{LANGUAGE_NAMES[requestedLanguage]}</strong>
          </p>
        )}

        {spotlightPoi && !canAccessPoi(spotlightPoi.id) && (
          <section className="premium-spotlight-card" aria-label={poiCopy.requestedNote}>
            <p className="premium-spotlight-label">{poiCopy.requestedNote}</p>
            <div className="spotlight-main">
              <div className="spotlight-media">
                <img
                  src={resolveImagePath(spotlightPoi.thumbnailUrl ?? undefined, spotlightPoi.slug ?? undefined)}
                  alt={spotlightPoi.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/pois/buu-dien-trung-tam.jpg';
                  }}
                />
              </div>
              <div className="spotlight-content">
                <div className="spotlight-header">
                  <h2 className="spotlight-title">{spotlightPoi.name}</h2>
                  <div className="premium-language-badges spotlight-languages">
                    <span className="is-free">VI</span>
                    {PREMIUM_LANGUAGES.map((language) => (
                      <span key={language} className="is-locked" title={LANGUAGE_NAMES[language]}>
                        {language.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="spotlight-desc">{poiCopy.validityNote}</p>
                <div className="spotlight-footer">
                  <p className="spotlight-price">
                    {formatPrice(poiPremiumPrice(spotlightPoi.premiumPrice))}
                    <span>{poiCopy.priceLabel}</span>
                  </p>
                  <div className="spotlight-actions">
                    <button
                      type="button"
                      className="premium-btn premium-btn-primary"
                      onClick={() => handlePoiCheckout(spotlightPoi.id, 'VNPAY')}
                      disabled={poiCheckout === spotlightPoi.id}
                    >
                      {poiCheckout === spotlightPoi.id
                        ? poiCopy.processing
                        : `Thanh toán ${formatPrice(poiPremiumPrice(spotlightPoi.premiumPrice))} qua VNPAY`}
                    </button>
                    <button
                      type="button"
                      className="premium-btn premium-btn-outline"
                      onClick={() => handlePoiCheckout(spotlightPoi.id, 'VIETQR')}
                      disabled={poiCheckout === spotlightPoi.id}
                    >
                      VietQR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {requestedPoiId && !spotlightPoi && (
          <p className="premium-request-note" role="status">
            {poiCopy.requestedNote}{' '}
            <strong>
              {poiGuides?.find((g) => g.id === requestedPoiId)?.name ??
                `POI #${requestedPoiId}`}
            </strong>
          </p>
        )}

        {notice && !isPremiumPending && (
          <p className="premium-notice" role="alert">
            {notice}
          </p>
        )}

        <section className="premium-plan" aria-labelledby="premium-plan-title">
          <div className="premium-section-head">
            <h2 id="premium-plan-title">{copy.benefitsTitle}</h2>
            <p className="premium-lead">{copy.benefitsSubtitle}</p>
          </div>

          <div className={`premium-offer premium-plan-card${isPremium ? ' is-active' : ''}${isPremiumPending ? ' is-pending' : ''}`}>
            <div className="premium-plan-left">
              <p className="premium-plan-label">{planStatusLabel}</p>
              <h3 className="premium-plan-name">{copy.purchaseTitle}</h3>

              <ul className="premium-plan-benefits">
                {copy.benefits.map((benefit) => (
                  <li key={benefit.title}>
                    <strong>{formatPremiumText(benefit.title, values)}</strong>
                    <span>{formatPremiumText(benefit.description, values)}</span>
                  </li>
                ))}
              </ul>

              <div className="premium-plan-perk">
                <span className="premium-plan-perk-badge">10%</span>
                <div className="premium-plan-perk-copy">
                  <strong>{copy.souvenirDiscountLabel}</strong>
                  <span>{isPremium ? copy.discountActiveNote : copy.discountInactiveNote}</span>
                </div>
                <Link to="/am-thuc" className="premium-plan-perk-link">
                  {copy.discountCta}
                </Link>
              </div>
            </div>

            <div className="premium-plan-right">
              {isPremium ? (
                <>
                  <p className="premium-plan-price is-state">{copy.activeCta}</p>
                  {premiumExpiresAt && (
                    <p className="premium-expiry">
                      {copy.expiryLabel}: <strong>{formatDateTime(premiumExpiresAt)}</strong>
                    </p>
                  )}
                </>
              ) : isPremiumPending ? (
                <>
                  <p className={`premium-plan-price is-state${pollingStatus === 'timeout' ? ' is-warning' : ''}`}>
                    {pollingStatus === 'timeout' ? copy.pendingTimedOut : copy.pendingValue}
                  </p>
                  <p className="premium-plan-desc">{copy.pendingDescription}</p>
                </>
              ) : isEntitlementError ? (
                <>
                  <p className="premium-plan-price is-state is-warning">{copy.entitlementErrorTitle}</p>
                  <p className="premium-plan-desc" title={entitlementError ?? undefined}>
                    {copy.entitlementErrorDescription}
                  </p>
                </>
              ) : (
                <>
                  <p className="premium-plan-price">
                    {formatPrice(PREMIUM_PRICE)}
                    <span>{copy.priceUnit}</span>
                  </p>
                  <p className="premium-plan-desc">
                    {formatPremiumText(copy.purchaseDescription, values)}
                  </p>
                </>
              )}

              <h4 className="premium-plan-subtitle">
                {formatPremiumText(copy.languagesTitle, values)}
              </h4>
              <div className="premium-language-badges" aria-label={copy.languagesTitle}>
                <span className="is-free">VI</span>
                {PREMIUM_LANGUAGES.map((language) => (
                  <span
                    key={language}
                    className={isPremium ? 'is-open' : 'is-locked'}
                    title={LANGUAGE_NAMES[language]}
                  >
                    {language.toUpperCase()}
                  </span>
                ))}
              </div>

              {notice && (
                <div className="premium-notice-wrap" role="alert">
                  <p className="premium-notice-text">{notice}</p>
                  <button
                    type="button"
                    className="premium-notice-retry-btn"
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                  >
                    {copy.retry}
                  </button>
                </div>
              )}

              {isPremium ? (
                <div className="premium-plan-actions">
                  <button
                    type="button"
                    className="premium-btn premium-btn-primary premium-pay-btn"
                    onClick={handleWatchVideo}
                  >
                    <Play size={15} strokeWidth={2.2} fill="currentColor" aria-hidden="true" />
                    <span>{copy.mediaExperienceCta}</span>
                  </button>
                  <button
                    type="button"
                    className="premium-btn premium-btn-outline premium-pay-btn"
                    onClick={handleBackToTour}
                  >
                    {copy.continueCta}
                  </button>
                </div>
              ) : isPremiumPending ? (
                <div className="premium-pending-actions">
                  <button
                    type="button"
                    className="premium-btn premium-btn-primary premium-pay-btn"
                    onClick={handleCheckAgain}
                  >
                    {pollingStatus === 'polling' && (
                      <Loader2 size={16} strokeWidth={2} className="premium-spin" aria-hidden="true" />
                    )}
                    <span>{copy.pendingCheckAgain}</span>
                  </button>
                  {pollingStatus === 'timeout' && (
                    <button
                      type="button"
                      className="premium-btn premium-btn-outline premium-pay-btn"
                      onClick={handleRetryCheckout}
                      disabled={isSubmitting}
                    >
                      {copy.retryCheckout}
                    </button>
                  )}
                </div>
              ) : isEntitlementError ? (
                <button
                  type="button"
                  className="premium-btn premium-btn-primary premium-pay-btn"
                  onClick={() => void refreshEntitlement()}
                >
                  {copy.retry}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="premium-btn premium-btn-primary premium-pay-btn"
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} strokeWidth={2} className="premium-spin" aria-hidden="true" />
                        <span>{copy.checkoutPending}</span>
                      </>
                    ) : (
                      <span>{copy.checkoutCta}</span>
                    )}
                  </button>
                  {!isAuthenticated && <p className="premium-login-note">{copy.loginNote}</p>}
                </>
              )}

              <p className="premium-secure-note">{copy.secureNote}</p>
            </div>
          </div>
        </section>

        {!hasGuideData && (
          <div className={`premium-data-state ${poiGuidesError ? 'is-error' : ''}`} role="status">
            {poiGuidesError ? (
              <>
                <p>{copy.dataError}</p>
                <button
                  type="button"
                  className="premium-btn premium-btn-outline"
                  onClick={() => void loadPoiGuides()}
                >
                  {copy.retry}
                </button>
              </>
            ) : (
              <>
                <Loader2 size={18} strokeWidth={2} className="premium-spin" aria-hidden="true" />
                <p>{copy.dataLoading}</p>
              </>
            )}
          </div>
        )}

        {hasGuideData && poiGuides && poiGuides.length > 0 && (
          <section
            id="premium-poi-purchase"
            className="premium-stops poi-purchase-section"
            aria-labelledby="premium-poi-purchase-title"
          >
            <div className="premium-section-head">
              <h2 id="premium-poi-purchase-title">{poiCopy.title}</h2>
              <p className="premium-lead">{poiCopy.subtitle}</p>
            </div>

            <div className="premium-poi-search-wrap">
              <Search size={16} strokeWidth={2} className="premium-poi-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="premium-poi-search-input"
                value={poiSearch}
                onChange={(e) => setPoiSearch(e.target.value)}
                placeholder={poiCopy.searchPlaceholder}
                aria-label={poiCopy.searchPlaceholder}
              />
              {poiSearch && (
                <button
                  type="button"
                  className="premium-poi-search-clear"
                  onClick={() => setPoiSearch('')}
                  aria-label={copy.clearSearch}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            <p className="premium-poi-note">{poiCopy.listNote}</p>

            {filteredPois.length === 0 ? (
              <p className="premium-poi-empty">{poiCopy.noResults}</p>
            ) : (
              <div className="premium-poi-list">
                {filteredPois.map((poi) => {
                  const isRequested = poi.id === requestedPoiId;
                  const unlocked = canAccessPoi(poi.id);
                  const price = poiPremiumPrice(poi.premiumPrice);
                  const imageSrc = resolveImagePath(poi.thumbnailUrl ?? undefined, poi.slug ?? undefined);
                  const category = poi.categoryNameVi || poi.categoryCode || copy.stopsTitle;
                  const menuOpen = poiMenuOpen === poi.id;
                  const video = getPremiumVideo(poi.slug);
                  const experienceOpen = Boolean(video && unlocked && expandedExperienceId === poi.id);

                  return (
                    <article
                      className={`premium-poi-card premium-poi-row${isRequested ? ' is-requested' : ''}${unlocked ? ' is-unlocked' : ''}`}
                      ref={isRequested ? (el) => { requestPoiCardRef.current = el; } : undefined}
                      key={poi.id}
                    >
                      <div className={`premium-poi-media${video && unlocked ? ' has-video' : ''}`}>
                        <img
                          src={imageSrc}
                          alt={poi.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/pois/buu-dien-trung-tam.jpg';
                          }}
                        />
                        {video && unlocked && (
                          <button
                            type="button"
                            className="premium-poi-media-play"
                            onClick={() => setExpandedExperienceId(experienceOpen ? null : poi.id)}
                            aria-label={`${copy.videoWatchCta}: ${poi.name}`}
                          >
                            <span className="premium-poi-media-play-icon" aria-hidden="true">
                              <Play size={15} strokeWidth={2} fill="currentColor" />
                            </span>
                          </button>
                        )}
                        {video && !unlocked && (
                          <span className="premium-poi-media-lock" aria-hidden="true">
                            <Lock size={12} strokeWidth={2.2} />
                          </span>
                        )}
                      </div>

                      <div className="premium-poi-body">
                        <h3>{poi.name}</h3>
                        <p className="premium-poi-category">{category}</p>
                        <div className="premium-poi-languages">
                          <span className="is-free" title={copy.freeLabel}>VI</span>
                          {PREMIUM_LANGUAGES.map((language) => (
                            <span
                              key={language}
                              className={unlocked ? 'is-open' : 'is-locked'}
                              title={
                                unlocked
                                  ? LANGUAGE_NAMES[language]
                                  : `${LANGUAGE_NAMES[language]} - ${copy.premiumLabel}`
                              }
                            >
                              {language.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        {video && unlocked && (
                          <button
                            type="button"
                            className="premium-poi-experience-btn"
                            onClick={() => setExpandedExperienceId(experienceOpen ? null : poi.id)}
                            aria-expanded={experienceOpen}
                            aria-controls={`premium-poi-experience-${poi.id}`}
                            aria-label={`${copy.mediaExperienceCta}: ${poi.name}`}
                          >
                            <Play size={13} strokeWidth={2.2} aria-hidden="true" />
                            <span>{copy.mediaExperienceCta}</span>
                            <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true" />
                          </button>
                        )}
                        {video && !unlocked && (
                          <p className="premium-poi-media-locked">
                            <Lock size={12} strokeWidth={2.2} aria-hidden="true" />
                            <span>{copy.mediaLockedNote}</span>
                          </p>
                        )}
                      </div>

                      <div className="premium-poi-side">
                        <p className="premium-poi-price">
                          {formatPrice(price)}
                          <small>{poiCopy.priceLabel}</small>
                        </p>

                        {unlocked ? (
                          <span className="premium-poi-status is-open">
                            <Check size={14} strokeWidth={2.3} aria-hidden="true" />
                            {poiCopy.purchased}
                          </span>
                        ) : (
                          <div className="premium-poi-unlock-wrap">
                            <button
                              type="button"
                              className="premium-btn premium-btn-primary premium-poi-unlock"
                              onClick={() => setPoiMenuOpen(menuOpen ? null : poi.id)}
                              disabled={poiCheckout === poi.id}
                              aria-haspopup="menu"
                              aria-expanded={menuOpen}
                            >
                              {poiCheckout === poi.id ? poiCopy.processing : poiCopy.unlockCta}
                            </button>
                            {menuOpen && (
                              <div className="premium-poi-popover" role="menu" aria-label={poiCopy.unlockCta}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => void handlePoiCheckout(poi.id, 'VNPAY')}
                                >
                                  VNPAY
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => void handlePoiCheckout(poi.id, 'VIETQR')}
                                >
                                  VietQR
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {experienceOpen && video && (
                        <div className="premium-poi-experience" id={`premium-poi-experience-${poi.id}`}>
                          <div className="premium-poi-video">
                            <iframe
                              className="premium-video-iframe"
                              src={youtubeEmbedUrl(video.videoId)}
                              title={`${copy.videoLabel}: ${poi.name}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          </div>

                          <div className="premium-poi-experience-side">
                            <p className="premium-video-label">{copy.videoLabel}</p>
                            <h4>{poi.name}</h4>
                            <p className="premium-video-source">
                              {copy.videoSourceLabel}:{' '}
                              <a href={video.sourceUrl} target="_blank" rel="noreferrer noopener">
                                {video.channel}
                                <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
                              </a>
                            </p>
                            <div className="premium-poi-experience-actions">
                              <Link
                                to={`/diem-du-lich?stop=${encodeURIComponent(poi.slug ?? '')}&lang=${lang}`}
                                className="premium-btn premium-btn-primary"
                              >
                                <Headphones size={15} strokeWidth={2} aria-hidden="true" />
                                {copy.listenCta}
                              </Link>
                              <button
                                type="button"
                                className="premium-btn premium-btn-outline"
                                onClick={() => setExpandedExperienceId(null)}
                              >
                                {copy.videoCloseCta}
                              </button>
                            </div>
                            <p className="premium-video-note">{copy.videoSectionNote}</p>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

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
          <p className="premium-closing-text">{copy.closingTitle}</p>
          {isPremium ? (
            <button
              type="button"
              className="premium-btn premium-btn-primary"
              onClick={handleBackToTour}
            >
              {copy.continueCta}
            </button>
          ) : isPremiumPending ? (
            <button
              type="button"
              className="premium-btn premium-btn-primary"
              onClick={pollingStatus === 'timeout' ? handleRetryCheckout : handleCheckAgain}
              disabled={isSubmitting}
            >
              {pollingStatus === 'timeout' ? copy.retryCheckout : copy.pendingCheckAgain}
            </button>
          ) : (
            <button
              type="button"
              className="premium-btn premium-btn-primary"
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? copy.checkoutPending : copy.checkoutCta}
            </button>
          )}
        </section>
      </main>
    </div>
  );
};

export default PremiumPage;
