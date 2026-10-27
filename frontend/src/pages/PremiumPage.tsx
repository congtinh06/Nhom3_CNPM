import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgePercent,
  BookOpen,
  Check,
  CreditCard,
  Crown,
  Headphones,
  Languages,
  Loader2,
  Lock,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Youtube,
} from 'lucide-react';
import { PREMIUM_COPY, formatPremiumText } from '../content/premiumI18n';
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
const DEFAULT_POI_PRICE = 20000;

type PoiPaymentMethod = 'VNPAY' | 'VIETQR';

/** Giá mua lẻ thực tế của POI: premiumPrice riêng nếu có, không thì giá mặc định. */
export function poiPremiumPrice(premiumPrice?: number | null): number {
  return premiumPrice != null && premiumPrice > 0 ? premiumPrice : DEFAULT_POI_PRICE;
}

/** Cut copy riêng cho khối mua lẻ theo điểm (không đưa vào premiumI18n để gọn). */
const POI_SECTION_COPY: Record<
  SupportedLanguage,
  {
    title: string;
    subtitle: string;
    columnStop: string;
    columnPrice: string;
    columnAction: string;
    buyCta: string;
    buyVnPay: string;
    buyQr: string;
    processing: string;
    purchased: string;
    requestedNote: string;
    validityNote: string;
    priceLabel: string;
    videoLabel: string;
    detailsLabel: string;
    discountLabel: string;
    searchPlaceholder: string;
    noResults: string;
    tapHint: string;
    listenCta: string;
  }
> = {
  vi: {
    title: 'Mua lẻ theo điểm thuyết minh',
    subtitle:
      'Chỉ cần mở khóa điểm bạn quan tâm. Mỗi điểm gồm thuyết minh tiếng Anh, Nhật, Hàn, nội dung chi tiết và video giới thiệu.',
    columnStop: 'Điểm dừng',
    columnPrice: 'Giá',
    columnAction: 'Mở khóa',
    buyCta: 'Mua gói điểm này',
    buyVnPay: 'VNPAY',
    buyQr: 'VietQR',
    processing: 'Đang tạo thanh toán…',
    purchased: 'Đã mở khóa',
    requestedNote: 'Gói ngoại ngữ bạn đang mở khóa:',
    validityNote: 'Giá cho 365 ngày, áp dụng cho thuyết minh ngoại ngữ của điểm này.',
    priceLabel: 'Mở khóa lẻ',
    videoLabel: 'Video giới thiệu',
    detailsLabel: 'Nội dung thuyết minh chi tiết',
    discountLabel: 'Giảm 10% quà lưu niệm',
    searchPlaceholder: 'Tìm điểm đến muốn mở khóa...',
    noResults: 'Không tìm thấy điểm đến phù hợp.',
    tapHint: 'Nhấn vào một điểm bất kỳ để mở khóa ngay.',
    listenCta: 'Nghe thuyết minh',
  },
  en: {
    title: 'Buy narration stops one by one',
    subtitle:
      "Only unlock the stops you care about. Each stop includes English, Japanese and Korean narration, detailed stories and an intro video.",
    columnStop: 'Stop',
    columnPrice: 'Price',
    columnAction: 'Unlock',
    buyCta: 'Buy this stop',
    buyVnPay: 'VNPAY',
    buyQr: 'VietQR',
    processing: 'Creating payment…',
    purchased: 'Unlocked',
    requestedNote: 'The narration package you are unlocking:',
    validityNote: 'Price for 365 days, covering this stop in foreign languages.',
    priceLabel: 'Single unlock',
    videoLabel: 'Intro video',
    detailsLabel: 'Detailed narration content',
    discountLabel: '10% off souvenirs',
    searchPlaceholder: 'Find a stop to unlock...',
    noResults: 'No matching stops found.',
    tapHint: 'Tap any stop to unlock it instantly.',
    listenCta: 'Listen to narration',
  },
  ja: {
    title: 'スポット単位での購入',
    subtitle:
      '必要なスポットだけを解除できます。各スポットには英語・日本語・韓国語のナレーション、詳細な解説、紹介動画が含まれます。',
    columnStop: 'スポット',
    columnPrice: '価格',
    columnAction: '解除',
    buyCta: 'このスポットを購入',
    buyVnPay: 'VNPAY',
    buyQr: 'VietQR',
    processing: '決済を作成中…',
    purchased: '解除済み',
    requestedNote: '解除中のナレーションパッケージ:',
    validityNote: '365日間の価格（このスポットの外国語ナレーション対象）。',
    priceLabel: '個別解除',
    videoLabel: '紹介動画',
    detailsLabel: '詳細なナレーション内容',
    discountLabel: 'お土産10%オフ',
    searchPlaceholder: '解除したいスポットを検索...',
    noResults: '該当するスポットが見つかりません。',
    tapHint: '任意のスポットをタップするとすぐに解除できます。',
    listenCta: 'ナレーションを聞く',
  },
  ko: {
    title: '명소별 개별 구매',
    subtitle:
      '필요한 명소만 해제하세요. 각 명소에는 영어, 일본어, 한국어 해설, 상세 콘텐츠, 소개 영상이 포함됩니다.',
    columnStop: '명소',
    columnPrice: '가격',
    columnAction: '해제',
    buyCta: '이 명소 구매',
    buyVnPay: 'VNPAY',
    buyQr: 'VietQR',
    processing: '결제 생성 중…',
    purchased: '해제됨',
    requestedNote: '해제 중인 해설 패키지:',
    validityNote: '365일 가격(이 명소의 외국어 해설 대상)。',
    priceLabel: '개별 해제',
    videoLabel: '소개 영상',
    detailsLabel: '상세 해설 콘텐츠',
    discountLabel: '기념품 10% 할인',
    searchPlaceholder: '해제할 명소 검색...',
    noResults: '일치하는 명소가 없습니다.',
    tapHint: '명소를 누르면 바로 해제됩니다.',
    listenCta: '해설 듣기',
  },
};

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const FEATURE_ICONS = [Languages, Headphones, Youtube, BadgePercent];

function poiVideoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${name} Sài Gòn giới thiệu`
  )}`;
}

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

  // Kiem tra ket qua thanh toan tra ve tu VNPAY hoac session dang cho
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
          // Don hang da thanh toan nhung quyen co the duoc cap bat dong bo
          // qua outbox, nen tiep tuc lam moi entitlement thay vi mo khoa sai.
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
        // Tiep tuc poll neu loi mang
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

  // Danh sách điểm thuyết minh + giá mua lẻ (nguồn chung với trang du khách).
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

  const hasGuideData = Boolean(poiGuides && poiGuides.length > 0);

  const dynamicNarrationCount = useMemo(() => {
    if (!poiGuides || poiGuides.length === 0) return 0;
    return poiGuides.reduce((total, guide) => {
      const count = PREMIUM_LANGUAGES.filter((language) => {
        const tr = guide.translations?.[language];
        return Boolean(
          tr && (tr.audioUrl || tr.description || (tr.chapters && tr.chapters.length > 0))
        );
      }).length;
      return total + count;
    }, 0);
  }, [poiGuides]);

  const values = {
    count: hasGuideData ? dynamicNarrationCount : '…',
    poiCount: hasGuideData ? poiGuides?.length ?? 0 : '…',
    languageCount: hasGuideData ? PREMIUM_LANGUAGES.length : '…',
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

  // Nhấn vào cả hàng: điểm đã mở thì mở nội dung, chưa mở thì bắt đầu thanh toán
  // VNPAY cho đúng điểm đó (hai nút bên cạnh vẫn cho chọn VietQR riêng).
  const handlePoiRowActivate = (poi: PoiGuide) => {
    if (canAccessPoi(poi.id)) {
      const slug = poi.slug || String(poi.id);
      navigate(`/diem-du-lich?stop=${encodeURIComponent(slug)}`);
      return;
    }
    void handlePoiCheckout(poi.id, 'VNPAY');
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

        {spotlightPoi && !canAccessPoi(spotlightPoi.id) && (
          <section className="premium-spotlight-card" aria-label="Mở khóa nhanh điểm thuyết minh">
            <div className="spotlight-badge">
              <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
              <span>{poiCopy.requestedNote}</span>
            </div>
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
                  <div className="spotlight-languages">
                    <span className="lang-tag is-free">VI (Miễn phí)</span>
                    <span className="lang-tag is-premium">EN</span>
                    <span className="lang-tag is-premium">JA</span>
                    <span className="lang-tag is-premium">KO</span>
                  </div>
                </div>
                <p className="spotlight-desc">
                  Mở khóa toàn bộ thuyết minh ngoại ngữ Tiếng Anh, Tiếng Nhật và Tiếng Hàn cho riêng điểm này trong 365 ngày với chất lượng âm thanh HD.
                </p>
                <div className="spotlight-footer">
                  <div className="spotlight-price-wrap">
                    <span className="spotlight-price-label">Giá mở khóa lẻ:</span>
                    <span className="spotlight-price-val">{formatPrice(poiPremiumPrice(spotlightPoi.premiumPrice))}</span>
                    <span className="spotlight-price-term">/ 365 ngày</span>
                  </div>
                  <div className="spotlight-actions">
                    <button
                      type="button"
                      className="spotlight-vnpay-btn"
                      onClick={() => handlePoiCheckout(spotlightPoi.id, 'VNPAY')}
                      disabled={poiCheckout === spotlightPoi.id}
                      title="Thanh toán an toàn qua cổng VNPay"
                    >
                      <CreditCard size={17} strokeWidth={2} aria-hidden="true" />
                      <span>
                        {poiCheckout === spotlightPoi.id
                          ? poiCopy.processing
                          : `Thanh toán ${formatPrice(poiPremiumPrice(spotlightPoi.premiumPrice))} qua VNPAY`}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="spotlight-qr-btn"
                      onClick={() => handlePoiCheckout(spotlightPoi.id, 'VIETQR')}
                      disabled={poiCheckout === spotlightPoi.id}
                      title="Quét mã VietQR"
                    >
                      <QrCode size={16} strokeWidth={2} aria-hidden="true" />
                      <span>VietQR</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {requestedPoiId && !spotlightPoi && (
          <div className="premium-request-note" role="status">
            <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
            <p>
              {poiCopy.requestedNote}{' '}
              <strong>
                {poiGuides?.find((g) => g.id === requestedPoiId)?.name ??
                  `POI #${requestedPoiId}`}
              </strong>
            </p>
          </div>
        )}

        {notice && (
          <p className="premium-notice" role="alert">
            {notice}
          </p>
        )}

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
          <section className="premium-stops poi-purchase-section" aria-labelledby="premium-poi-purchase-title">
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

            <p className="premium-poi-tap-hint">{poiCopy.tapHint}</p>

            {filteredPois.length === 0 ? (
              <p className="premium-poi-empty">{poiCopy.noResults}</p>
            ) : (
              <div className="premium-poi-list">
                {filteredPois.map((poi, index) => {
                  const isRequested = poi.id === requestedPoiId;
                  const unlocked = canAccessPoi(poi.id);
                  const price = poiPremiumPrice(poi.premiumPrice);
                  const imageSrc = resolveImagePath(poi.thumbnailUrl ?? undefined, poi.slug ?? undefined);
                  const category = poi.categoryNameVi || poi.categoryCode || copy.stopsTitle;

                  return (
                    <article
                      className={`premium-poi-card premium-poi-row ${
                        isRequested ? 'is-requested' : ''
                      } ${unlocked ? 'is-unlocked' : ''}`}
                      ref={isRequested ? (el) => { requestPoiCardRef.current = el; } : undefined}
                      key={poi.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${unlocked ? poiCopy.listenCta : poiCopy.buyCta}: ${poi.name}`}
                      onClick={() => handlePoiRowActivate(poi)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handlePoiRowActivate(poi);
                        }
                      }}
                    >
                      <div className="premium-poi-media">
                        <img
                          src={imageSrc}
                          alt={poi.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/pois/buu-dien-trung-tam.jpg';
                          }}
                        />
                        {unlocked && (
                          <span className="premium-poi-owned">
                            <Check size={13} strokeWidth={2.4} aria-hidden="true" />
                            {poiCopy.purchased}
                          </span>
                        )}
                      </div>

                      <div className="premium-poi-body">
                        <div className="premium-poi-title-row">
                          <span className="premium-poi-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3>{poi.name}</h3>
                            <p className="premium-poi-category">{category}</p>
                          </div>
                        </div>

                        <div className="premium-poi-languages">
                          <span className="is-free" title={copy.freeLabel}>VI</span>
                          {PREMIUM_LANGUAGES.map((language) => (
                            <span
                              key={language}
                              className={unlocked ? 'is-free' : 'is-locked'}
                              title={
                                unlocked
                                  ? LANGUAGE_NAMES[language]
                                  : `${LANGUAGE_NAMES[language]} - ${copy.premiumLabel}`
                              }
                            >
                              {language.toUpperCase()}
                              {unlocked ? null : (
                                <Lock size={11} strokeWidth={2} aria-hidden="true" />
                              )}
                            </span>
                          ))}
                        </div>

                        <ul className="premium-poi-perks">
                          <li>
                            <BookOpen size={15} strokeWidth={1.9} aria-hidden="true" />
                            <span>{poiCopy.detailsLabel}</span>
                          </li>
                          <li>
                            <a
                              href={poiVideoSearchUrl(poi.name)}
                              target="_blank"
                              rel="noreferrer"
                              title={`${poiCopy.videoLabel}: ${poi.name}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Youtube size={15} strokeWidth={1.9} aria-hidden="true" />
                              <span>{poiCopy.videoLabel}</span>
                            </a>
                          </li>
                          <li>
                            <BadgePercent size={15} strokeWidth={1.9} aria-hidden="true" />
                            <span>{poiCopy.discountLabel}</span>
                          </li>
                        </ul>
                      </div>

                      <div className="premium-poi-side">
                        <div className="premium-poi-price">
                          <span>{formatPrice(price)}</span>
                          <small>{poiCopy.priceLabel}</small>
                        </div>

                        <div className="premium-poi-actions">
                          {unlocked ? (
                            <span className="premium-poi-status is-open">
                              <Check size={14} strokeWidth={2.3} aria-hidden="true" />
                              {poiCopy.listenCta}
                            </span>
                          ) : (
                            <div className="premium-poi-buy-actions">
                              <button
                                type="button"
                                className="premium-poi-vnpay-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handlePoiCheckout(poi.id, 'VNPAY');
                                }}
                                disabled={poiCheckout === poi.id}
                                title="Thanh toán an toàn qua cổng VNPay"
                              >
                                <CreditCard size={14} strokeWidth={2} aria-hidden="true" />
                                <span>VNPAY</span>
                              </button>
                              <button
                                type="button"
                                className="premium-btn premium-btn-primary premium-poi-buy-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handlePoiCheckout(poi.id, 'VIETQR');
                                }}
                                disabled={poiCheckout === poi.id}
                                title="Quét mã VietQR"
                              >
                                <QrCode size={14} strokeWidth={2} aria-hidden="true" />
                                <span>VietQR</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="premium-poi-term">{poiCopy.validityNote}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section
          className={`premium-discount-banner ${isPremium ? 'is-active' : ''}`}
          aria-labelledby="premium-discount-title"
        >
          <span className="premium-discount-icon" aria-hidden="true">
            <BadgePercent size={26} strokeWidth={1.8} />
          </span>
          <div>
            <span className="premium-discount-kicker">{copy.packageBadge}</span>
            <h2 id="premium-discount-title">{copy.discountTitle}</h2>
            <p>{copy.discountDescription}</p>
          </div>
          <Link to="/am-thuc" className="premium-discount-cta">
            {copy.discountCta}
          </Link>
        </section>

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

          <aside
            className={`premium-offer ${
              isPremium ? 'is-active' : isPremiumPending ? 'is-pending' : ''
            }`}
          >
            {isPremium ? (
              <>
                <div className="premium-offer-head">
                  <span className="premium-offer-icon" aria-hidden="true">
                    <Crown size={22} strokeWidth={1.75} />
                  </span>
                  <span className="premium-offer-label">{copy.activeBadge}</span>
                </div>

                <h2>{copy.purchaseTitle}</h2>
                <p className="premium-offer-value is-active-value">{copy.activeCta}</p>
                {premiumExpiresAt && (
                  <p className="premium-expiry">
                    {copy.expiryLabel}: <strong>{formatDateTime(premiumExpiresAt)}</strong>
                  </p>
                )}
                <p className="premium-offer-description">
                  {formatPremiumText(copy.purchaseDescription, values)}
                </p>

                <div className="premium-language-badges" aria-label={copy.languagesTitle}>
                  <span className="is-free">VI</span>
                  {PREMIUM_LANGUAGES.map((language) => (
                    <span key={language} className="is-open" title={LANGUAGE_NAMES[language]}>
                      {language.toUpperCase()}
                      <Check size={11} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="premium-btn premium-btn-primary premium-continue-btn"
                  onClick={handleBackToTour}
                >
                  {copy.continueCta}
                </button>

                <p className="premium-secure-note">
                  <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
                  <span>{copy.secureNote}</span>
                </p>
              </>
            ) : isPremiumPending ? (
              <>
                <div className="premium-offer-head">
                  <span className="premium-offer-icon" aria-hidden="true">
                    {pollingStatus === 'timeout' ? (
                      <X size={22} strokeWidth={1.75} />
                    ) : (
                      <Loader2 size={22} strokeWidth={1.75} className="premium-spin" />
                    )}
                  </span>
                  <span className="premium-offer-label">{copy.pendingBadge}</span>
                </div>

                <h2>{copy.purchaseTitle}</h2>
                <p className="premium-offer-value is-pending-value">
                  {pollingStatus === 'timeout' ? copy.pendingTimedOut : copy.pendingValue}
                </p>
                <p className="premium-offer-description">{copy.pendingDescription}</p>

                <div className="premium-language-badges" aria-label={copy.languagesTitle}>
                  <span className="is-free">VI</span>
                  {PREMIUM_LANGUAGES.map((language) => (
                    <span key={language} className="is-locked" title={LANGUAGE_NAMES[language]}>
                      {language.toUpperCase()}
                      <Lock size={11} strokeWidth={2} aria-hidden="true" />
                    </span>
                  ))}
                </div>

                <div className="premium-pending-actions">
                  <button
                    type="button"
                    className="premium-btn premium-btn-primary premium-pay-btn"
                    onClick={handleCheckAgain}
                  >
                    <Loader2
                      size={17}
                      strokeWidth={2}
                      className={pollingStatus === 'polling' ? 'premium-spin' : undefined}
                      aria-hidden="true"
                    />
                    <span>{copy.pendingCheckAgain}</span>
                  </button>
                  {pollingStatus === 'timeout' && (
                    <button
                      type="button"
                      className="premium-btn premium-btn-outline premium-pay-btn"
                      onClick={handleRetryCheckout}
                      disabled={isSubmitting}
                    >
                      <CreditCard size={17} strokeWidth={2} aria-hidden="true" />
                      <span>{copy.retryCheckout}</span>
                    </button>
                  )}
                </div>

                <p className="premium-secure-note">
                  <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
                  <span>{copy.secureNote}</span>
                </p>
              </>
            ) : isEntitlementError ? (
              <>
                <div className="premium-offer-head">
                  <span className="premium-offer-icon" aria-hidden="true">
                    <Lock size={22} strokeWidth={1.75} />
                  </span>
                  <span className="premium-offer-label">{copy.entitlementErrorTitle}</span>
                </div>

                <h2>{copy.purchaseTitle}</h2>
                <p
                  className="premium-offer-value is-pending-value"
                  title={entitlementError ?? undefined}
                >
                  {copy.entitlementErrorDescription}
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
                  onClick={() => void refreshEntitlement()}
                >
                  <ShieldCheck size={17} strokeWidth={2} aria-hidden="true" />
                  <span>{copy.retry}</span>
                </button>

                <p className="premium-secure-note">
                  <ShieldCheck size={14} strokeWidth={1.9} aria-hidden="true" />
                  <span>{copy.secureNote}</span>
                </p>
              </>
            ) : (
              <>
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

                {notice && (
                  <div className="premium-notice-wrap" role="alert">
                    <p className="premium-notice-text">{notice}</p>
                    <button
                      type="button"
                      className="premium-notice-retry-btn"
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      Thử lại
                    </button>
                  </div>
                )}

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
              </>
            )}
          </aside>
        </section>

        <section className="premium-languages" aria-labelledby="premium-packages-title">
          <div className="premium-section-head">
            <h2 id="premium-packages-title">
              {formatPremiumText(copy.languagesTitle, values)}
            </h2>
            <p className="premium-lead">{copy.languagesSubtitle}</p>
          </div>

          <article className="premium-package-card premium-package-single">
            <div className="premium-package-media">
              <img
                src="/images/pois/buu-dien-trung-tam.jpg"
                alt={copy.packageTitle}
                loading="lazy"
                decoding="async"
              />
              <span className="premium-package-code">ALL</span>
              <div className="premium-package-language-overlay" aria-hidden="true">
                <span className="is-free">VI</span>
                {PREMIUM_LANGUAGES.map((language) => (
                  <span key={language}>{language.toUpperCase()}</span>
                ))}
              </div>
            </div>

            <div className="premium-package-body">
              <span className="premium-package-kicker">{copy.packageBadge}</span>
              <h3>{copy.offerBadge}</h3>
              <p>{copy.packageDescription}</p>

              <div className="premium-package-language-list">
                <div className="premium-package-language is-free">
                  <span className="premium-package-language-code">VI</span>
                  <div>
                    <strong>{LANGUAGE_NAMES.vi}</strong>
                    <small>{copy.freeLabel}</small>
                  </div>
                  <Check size={16} strokeWidth={2.3} aria-hidden="true" />
                </div>
                {PREMIUM_LANGUAGES.map((language) => (
                  <div
                    className={`premium-package-language ${
                      isPremium ? 'is-open' : 'is-locked'
                    }`}
                    key={language}
                  >
                    <span className="premium-package-language-code">
                      {language.toUpperCase()}
                    </span>
                    <div>
                      <strong>{LANGUAGE_NAMES[language]}</strong>
                      <small>{isPremium ? copy.openLabel : copy.lockedLabel}</small>
                    </div>
                    {isPremium ? (
                      <Check size={16} strokeWidth={2.3} aria-hidden="true" />
                    ) : (
                      <Lock size={16} strokeWidth={2.1} aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>

              <div className="premium-package-includes">
                <span>{copy.packageIncludesLabel}</span>
                <ul>
                  {copy.benefits.map((benefit) => (
                    <li key={benefit.title}>
                      <Check size={14} strokeWidth={2.3} aria-hidden="true" />
                      {formatPremiumText(benefit.title, values)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
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
            {isPremium ? (
              <button
                type="button"
                className="premium-btn premium-btn-light"
                onClick={handleBackToTour}
              >
                {copy.continueCta}
              </button>
            ) : isPremiumPending ? (
              <button
                type="button"
                className="premium-btn premium-btn-light"
                onClick={pollingStatus === 'timeout' ? handleRetryCheckout : handleCheckAgain}
                disabled={isSubmitting}
              >
                {pollingStatus === 'timeout' ? copy.retryCheckout : copy.pendingCheckAgain}
              </button>
            ) : (
              <button
                type="button"
                className="premium-btn premium-btn-light"
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? copy.checkoutPending : copy.checkoutCta}
              </button>
            )}
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
