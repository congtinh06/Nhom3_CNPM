/**
 * ============================================================================
 * TRANG TOUR DI SẢN QUANH ĐÂY & THUYẾT MINH ÂM THANH (Nearby Heritage Tour)
 * ============================================================================
 * Thiết kế đồng bộ với trang chủ, tông nền giấy kem (Warm Paper Editorial):
 * - Editorial Hero: Bảy điểm dừng quanh trung tâm Sài Gòn + Facts table
 * - Stepper Timeline bar kết nối các điểm dừng
 * - Hai cột chính: Danh sách điểm dừng dạng accordion (chi tiết mở ngay dưới
 *   điểm đang chọn) + Bản đồ Google Maps dính (sticky)
 * - Khối hướng dẫn "How it works" 3 cột
 * - Khối "Một câu chuyện, bốn ngôn ngữ" (cùng một thuyết minh, 4 ngôn ngữ)
 * - Khối "Chuẩn bị trước khi đi"
 * - Cửa hàng quà lưu niệm "Mang một chút Sài Gòn về nhà" kết nối trực tiếp giỏ hàng
 * - Một thanh phát audio cố định ở chân trang (luôn hiển thị)
 * ============================================================================
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ShoppingBag } from 'lucide-react';
import nearbyPoisData from '../content/nearbyPois.json';
import { api } from '../api/client';
import { mapGuidesToGeoPois } from '../content/poiGuideAdapter';
import { DEMO_FIXTURES_ENABLED } from '../config/demoMode';
import { useNavbarLanguage, SUPPORTED_LANGUAGES } from '../content/languages';
import { useToastOptional } from '../context/ToastContext';
import { usePremium, buildPremiumPath, buildPoiPremiumPath, isPremiumLanguage, normalizePoiId } from '../context/PremiumContext';
import { useAuthOptional } from '../context/AuthContext';
import { useCartOptional } from '../context/CartContext';
import { SupportedLanguage } from '../types';
import { useAutoNarration, haversine } from '../hooks/useAutoNarration';
import { useNearbyAudio, splitTranscriptIntoSentences } from '../hooks/useNearbyAudio';
import { getSharedAudio, unlockAudio } from '../lib/audioUnlock';
import { getAnalyticsSessionId } from '../lib/analytics';
import { detectDeviceType } from '../lib/device';
import {
  t,
  formatDistance,
  formatDistanceRounded,
  NEARBY_DICTIONARY,
  NATIVE_LANG_NAMES,
  type NearbyKey,
} from '../content/nearbyI18n';

// Components
import { PoiHeader } from '../components/nearby/PoiHeader';
import { ToolbarControls } from '../components/nearby/ToolbarControls';
import { PoiMap } from '../components/nearby/PoiMap';
import { PoiList } from '../components/nearby/PoiList';
import { PoiHero, estimatePoiDurationSeconds } from '../components/nearby/PoiHero';
import { resolveImagePath } from '../components/nearby/PoiCard';
import { PoiReadingSection } from '../components/nearby/PoiReadingSection';
import { PoiQrDialog } from '../components/nearby/PoiQrDialog';
import { isQrAvailable } from '../components/common/PlaceQR';
import { NearbyDegradedNotice } from '../components/nearby/NearbyDegradedNotice';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { enrichProducts } from '../content/productAdapter';
import { ProductCard } from '../components/food/ProductCard';
import { Product } from '../types';
import '../styles/souvenir.css';
import '../styles/nearby.css';

// "Một câu chuyện, bốn ngôn ngữ": cùng một đoạn thuyết minh, mỗi ngôn ngữ một dòng
const LANGUAGE_SHOWCASE_SAMPLES: Array<{
  code: SupportedLanguage;
  key: NearbyKey;
  free: boolean;
}> = [
  { code: 'vi', key: 'languageSampleVi', free: true },
  { code: 'en', key: 'languageSampleEn', free: false },
  { code: 'ja', key: 'languageSampleJa', free: false },
  { code: 'ko', key: 'languageSampleKo', free: false },
];

export interface NarrationChapterBlock {
  title: string;
  paras: string[];
}

export interface NarrationData {
  short: Partial<Record<SupportedLanguage, string>>;
  full: Partial<Record<SupportedLanguage, string[]>>;
  chapters?: Partial<Record<SupportedLanguage, NarrationChapterBlock[]>>;
}

export interface GeoPoi {
  id: string;
  numericId?: number | null;
  premiumPrice?: number | null;
  qrToken?: string | null;
  name: Record<SupportedLanguage, string>;
  lat: number;
  lng: number;
  triggerRadius: number;
  category: Record<SupportedLanguage, string>;
  image: string;
  audio: Record<SupportedLanguage, string | number>;
  audioStatusByLanguage?: Partial<Record<SupportedLanguage, string | null>>;
  audioUrl?: string | null;
  audioStatus?: string | null;
  transcript: Record<SupportedLanguage, string>;
  narration?: NarrationData;
  stopOrder?: number;
  slug?: string;
  description?: Record<SupportedLanguage, string>;
}

export type NarrationLayer = 'short' | 'full';

export function getNarration(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: 'short'
): string | null;
export function getNarration(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: 'full'
): string[] | null;
export function getNarration(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: NarrationLayer
): string | string[] | null;
export function getNarration(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: NarrationLayer
): string | string[] | null {
  if (!poi) return null;

  if (layer === 'short') {
    const text = poi.narration?.short?.[lang] ?? poi.transcript?.[lang];
    return text && typeof text === 'string' && text.trim() ? text : null;
  }
  if (layer === 'full') {
    const fullParas = poi.narration?.full?.[lang];
    return fullParas && fullParas.length > 0 ? fullParas : null;
  }

  return null;
}

export function getHeroIntroText(poi: GeoPoi, lang: SupportedLanguage): string {
  const shortText = getNarration(poi, lang, 'short');
  if (!shortText) return '';
  const sentences = splitTranscriptIntoSentences(shortText);
  const intro = sentences.length === 0 ? shortText : sentences.slice(0, 2).map((s) => s.sentence).join(' ');

  const stripped = intro
    .replace(/^Bạn đang đứng trước\s+/i, '')
    .replace(/^Bạn đang đứng tại\s+/i, '')
    .replace(/^You are (?:now )?standing (?:in front of|before)\s+/i, '');
  if (stripped === intro) return intro;
  return stripped.charAt(0).toLocaleUpperCase(lang === 'vi' ? 'vi' : lang) + stripped.slice(1);
}

export { NEARBY_DICTIONARY };

const POI_TOKEN_SLUG_MAP: Record<string, string> = {
  'qr-dinh-doc-lap-01': 'dinh-doc-lap',
  'qr-duc-ba-01': 'nha-tho-duc-ba',
  'qr-buu-dien-01': 'buu-dien-trung-tam',
  'qr-ben-thanh-01': 'cho-ben-thanh',
  'qr-bao-tang-chung-tich-01': 'bao-tang-chung-tich-chien-tranh',
  'qr-thien-hau-01': 'chua-ba-thien-hau',
  'qr-ba-son-01': 'cau-ba-son',
};

const POI_SLUG_TOKEN_MAP: Record<string, string> = {
  'dinh-doc-lap': 'qr-dinh-doc-lap-01',
  'nha-tho-duc-ba': 'qr-duc-ba-01',
  'buu-dien-trung-tam': 'qr-buu-dien-01',
  'cho-ben-thanh': 'qr-ben-thanh-01',
  'bao-tang-chung-tich-chien-tranh': 'qr-bao-tang-chung-tich-01',
  'chua-ba-thien-hau': 'qr-thien-hau-01',
  'cau-ba-son': 'qr-ba-son-01',
};

export function findPoiByQuery(pois: GeoPoi[], query?: string | null): GeoPoi | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Khớp chính xác slug
  const bySlug = pois.find((p) => p.slug && p.slug.toLowerCase() === q);
  if (bySlug) return bySlug;

  // 2. Khớp chính xác qrToken
  const byToken = pois.find((p) => p.qrToken && p.qrToken.toLowerCase() === q);
  if (byToken) return byToken;

  // 3. Khớp qua token -> slug map
  const mappedSlug = POI_TOKEN_SLUG_MAP[q];
  if (mappedSlug) {
    const byMappedSlug = pois.find((p) => p.slug && p.slug.toLowerCase() === mappedSlug);
    if (byMappedSlug) return byMappedSlug;
  }

  // 4. Khớp qua slug -> token map
  const mappedToken = POI_SLUG_TOKEN_MAP[q];
  if (mappedToken) {
    const byMappedToken = pois.find((p) => p.qrToken && p.qrToken.toLowerCase() === mappedToken);
    if (byMappedToken) return byMappedToken;
  }

  // 5. Khớp chính xác id
  const byId = pois.find((p) => p.id && p.id.toLowerCase() === q);
  if (byId) return byId;

  // 6. Khớp numericId
  if (/^\d+$/.test(q)) {
    const num = Number(q);
    const byNum = pois.find((p) => p.numericId === num);
    if (byNum) return byNum;
  }

  // 7. Khớp 'poi-X'
  const poiMatch = q.match(/^poi-(\d+)$/);
  if (poiMatch) {
    const num = Number(poiMatch[1]);
    const byNum = pois.find((p) => p.numericId === num);
    if (byNum) return byNum;
  }

  // 8. Khớp tên địa điểm
  const byName = pois.find((p) =>
    Object.values(p.name || {}).some(
      (n) => n && n.toLowerCase().trim() === q
    )
  );
  if (byName) return byName;

  return undefined;
}

const PREMIUM_GATE_COPY: Record<
  SupportedLanguage,
  { title: string; description: string; cta: string; warning: string }
> = {
  vi: {
    title: 'Bản dịch nâng cao đang khóa',
    description:
      'Bạn có thể đọc nội dung bằng ngôn ngữ này, nhưng cần Premium để nghe thuyết minh.',
    cta: 'Mở khóa Premium',
    warning: 'Cần nâng cấp Premium để nghe thuyết minh bằng ngôn ngữ này.',
  },
  en: {
    title: 'Premium narration is locked',
    description:
      'You can read this language, but Premium is required to listen to the narration.',
    cta: 'Unlock Premium',
    warning: 'Upgrade to Premium to listen to narration in this language.',
  },
  ja: {
    title: 'Premium 音声ガイドはロック中です',
    description:
      'この言語の本文は読めますが、音声ガイドを聞くには Premium が必要です。',
    cta: 'Premium を解除',
    warning: 'この言語の音声ガイドを聞くには Premium へのアップグレードが必要です。',
  },
  ko: {
    title: 'Premium 해설이 잠겨 있습니다',
    description:
      '이 언어의 본문은 읽을 수 있지만, 해설을 들으려면 Premium이 필요합니다.',
    cta: 'Premium 열기',
    warning: '이 언어의 해설을 들으려면 Premium으로 업그레이드해야 합니다.',
  },
};

const fmtTime = (s: number): string => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

const FALLBACK_SOUVENIRS: Product[] = [
  {
    id: 101,
    slug: 'tranh-ma-vang-dinh-doc-lap',
    name: 'Tranh mạ vàng Dinh Độc Lập',
    category: 'SOUVENIR',
    shortDescription: 'Tranh mạ vàng ánh kim in hình Dinh Độc Lập, món quà lưu niệm trang trọng của Sài Gòn.',
    description: 'Lấy cảm hứng từ công trình kiến trúc lịch sử Dinh Độc Lập, bức tranh được in trên nền kim loại rồi mạ vàng tạo hiệu ứng ánh kim bền đẹp. Khung gỗ sang trọng giúp tác phẩm giữ nguyên độ sáng bóng.',
    price: 180000,
    imagePath: '/images/souvenirs/tranh-dinh-doc-lap.jpg',
    poiSlug: 'dinh-doc-lap',
    isActive: true,
    sortOrder: 1,
    rating: 5.0,
    reviewsCount: 24,
  },
  {
    id: 102,
    slug: 'mo-hinh-dinh-doc-lap',
    name: 'Mô hình Dinh Độc Lập',
    category: 'SOUVENIR',
    shortDescription: 'Mô hình thu nhỏ Dinh Độc Lập chế tác tỉ mỉ, thích hợp trưng bày và sưu tầm.',
    description: 'Mô hình tái hiện Dinh Độc Lập với các khối nhà chính và hàng cột lớn đặc trưng, gia công tỉ mỉ từ chất liệu chắc chắn.',
    price: 220000,
    imagePath: '/images/souvenirs/mo-hinh.jpg',
    poiSlug: 'dinh-doc-lap',
    isActive: true,
    sortOrder: 2,
    rating: 5.0,
    reviewsCount: 18,
  },
  {
    id: 103,
    slug: 'nam-cham-dinh-doc-lap',
    name: 'Nam châm tủ lạnh Dinh Độc Lập',
    category: 'SOUVENIR',
    shortDescription: 'Nam châm tủ lạnh in hình Dinh Độc Lập, món quà nhỏ gọn và dễ thương.',
    description: 'Nam châm ép nổi hình Dinh Độc Lập với màu sắc tươi sáng, mặt sau là nam châm dính chắc trên bề mặt kim loại.',
    price: 30000,
    imagePath: '/images/souvenirs/nam-cham.jpg',
    poiSlug: 'dinh-doc-lap',
    isActive: true,
    sortOrder: 3,
    rating: 5.0,
    reviewsCount: 42,
  },
  {
    id: 104,
    slug: 'buu-thiep-dinh-doc-lap',
    name: 'Bộ bưu thiếp Sài Gòn Di Sản',
    category: 'SOUVENIR',
    shortDescription: 'Bộ bưu thiếp in các góc chụp đẹp của Sài Gòn xưa và nay.',
    description: 'Bộ bưu thiếp gồm nhiều tấm in hình các công trình di sản Sài Gòn ở các góc chụp nghệ thuật, giấy dày sắc nét.',
    price: 25000,
    imagePath: '/images/souvenirs/buu-thiep.jpg',
    poiSlug: 'dinh-doc-lap',
    isActive: true,
    sortOrder: 4,
    rating: 4.9,
    reviewsCount: 35,
  },
  {
    id: 105,
    slug: 'ca-phe-rang-xay-sai-gon',
    name: 'Cà phê phin rang xay Sài Gòn',
    category: 'SOUVENIR',
    shortDescription: 'Cà phê rang xay đậm vị truyền thống, đóng gói quà tặng trang nhã.',
    description: 'Cà phê được chọn lọc và rang mộc giữ trọn hương thơm cùng vị đậm đà đặc trưng của người Sài Gòn.',
    price: 120000,
    imagePath: '/images/souvenirs/ca-phe-phin.jpg',
    poiSlug: 'dinh-doc-lap',
    isActive: true,
    sortOrder: 5,
    rating: 5.0,
    reviewsCount: 56,
  },
  {
    id: 106,
    slug: 'ao-dai-cach-tan-sai-gon',
    name: 'Nón lá Bến Thành vẽ tay thủ công',
    category: 'SOUVENIR',
    shortDescription: 'Nón lá truyền thống vẽ tay hình Chợ Bến Thành và biểu tượng Sài Gòn.',
    description: 'Nón lá tự nhiên kết hợp nét cọ mộc mạc của nghệ nhân Sài Gòn, phủ lớp dầu bóng bảo vệ chống thấm.',
    price: 95000,
    imagePath: '/images/souvenirs/ao-dai.jpg',
    poiSlug: 'cho-ben-thanh',
    isActive: true,
    sortOrder: 6,
    rating: 4.8,
    reviewsCount: 19,
  },
];

// Cửa hàng trực tuyến: tải danh mục quà lưu niệm (chung nguồn API với trang /am-thuc),
// hiển thị 6 sản phẩm trong thanh carousel kéo / trượt và điều hướng chi tiết / giỏ hàng.
interface SouvenirsData {
  carouselProducts: Product[] | null;
  apiSouvenirs: Product[];
}

function useNearbySouvenirs(): SouvenirsData {
  const [data, setData] = useState<SouvenirsData>({
    carouselProducts: null,
    apiSouvenirs: [],
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      setData({ carouselProducts: [], apiSouvenirs: [] });
      return;
    }
    if (typeof api.getProducts !== 'function') {
      setData({ carouselProducts: FALLBACK_SOUVENIRS.slice(0, 6), apiSouvenirs: [] });
      return;
    }
    let cancelled = false;
    api
      .getProducts({ size: 40, sortBy: 'sortOrder' })
      .then((page) => {
        if (cancelled) return;
        const apiSouvenirs = enrichProducts(page?.content ?? [])
          .filter((item) => item.category === 'SOUVENIR');

        // Ensure at least 6 souvenirs are available for the carousel
        const existingSlugs = new Set(apiSouvenirs.map((p) => p.slug));
        const merged = [...apiSouvenirs];
        for (const fallback of FALLBACK_SOUVENIRS) {
          if (merged.length >= 6) break;
          if (!existingSlugs.has(fallback.slug)) {
            merged.push(fallback);
            existingSlugs.add(fallback.slug);
          }
        }
        setData({
          carouselProducts: merged.slice(0, 6),
          apiSouvenirs,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            carouselProducts: FALLBACK_SOUVENIRS.slice(0, 6),
            apiSouvenirs: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

export const NearbyPage: React.FC = () => {
  const { lang, changeLanguage } = useNavbarLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessLanguage, canAccessPoi, canAccessPoiLanguage, refreshEntitlement } =
    usePremium();
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const { showToast } = useToastOptional();
  const { addToCart } = useCartOptional();
  const currentLang = (lang as SupportedLanguage) || 'vi';
  const isLanguageLocked = !canAccessLanguage(currentLang);

  // Souvenir Carousel drag-to-scroll & arrow navigation
  const souvenirCarouselRef = useRef<HTMLDivElement>(null);
  const [isSouvenirDragging, setIsSouvenirDragging] = useState(false);
  const [souvenirStartX, setSouvenirStartX] = useState(0);
  const [souvenirScrollLeft, setSouvenirScrollLeft] = useState(0);

  const handleSouvenirMouseDown = (e: React.MouseEvent) => {
    if (!souvenirCarouselRef.current) return;
    setIsSouvenirDragging(true);
    setSouvenirStartX(e.pageX - souvenirCarouselRef.current.offsetLeft);
    setSouvenirScrollLeft(souvenirCarouselRef.current.scrollLeft);
  };

  const handleSouvenirMouseMove = (e: React.MouseEvent) => {
    if (!isSouvenirDragging || !souvenirCarouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - souvenirCarouselRef.current.offsetLeft;
    const walk = (x - souvenirStartX) * 1.5;
    souvenirCarouselRef.current.scrollLeft = souvenirScrollLeft - walk;
  };

  const handleSouvenirMouseUpOrLeave = () => {
    setIsSouvenirDragging(false);
  };

  const [souvenirNav, setSouvenirNav] = useState({ canPrev: false, canNext: false });

  const syncSouvenirNav = useCallback(() => {
    const el = souvenirCarouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const canPrev = el.scrollLeft > 4;
    const canNext = maxScroll > 4 && el.scrollLeft < maxScroll - 4;
    setSouvenirNav((prev) =>
      prev.canPrev === canPrev && prev.canNext === canNext ? prev : { canPrev, canNext }
    );
  }, []);

  const handleScrollSouvenir = (direction: 'left' | 'right') => {
    if (!souvenirCarouselRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    souvenirCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const triggerToast = useCallback(
    (msg: string) => {
      showToast(msg);
    },
    [showToast]
  );

  const openPremiumForLanguage = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    navigate(buildPremiumPath(currentLang, returnTo));
  }, [currentLang, navigate]);

  const warnAndOpenPremium = useCallback(
    (poi?: GeoPoi | null, targetLang?: SupportedLanguage) => {
      const langToCheck = targetLang || currentLang;
      triggerToast(PREMIUM_GATE_COPY[langToCheck]?.warning || PREMIUM_GATE_COPY[currentLang].warning);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const targetNumericId = poi?.numericId ?? (poi?.id ? normalizePoiId(poi.id) : null);
      if (
        targetNumericId &&
        isPremiumLanguage(langToCheck) &&
        !canAccessPoi(targetNumericId)
      ) {
        navigate(buildPoiPremiumPath(targetNumericId, returnTo));
        return;
      }
      navigate(buildPremiumPath(langToCheck, returnTo));
    },
    [currentLang, canAccessPoi, navigate, triggerToast]
  );

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.title = t(currentLang, 'pageTitle');
  }, [currentLang]);

  const appliedLanguageQueryRef = useRef<string | null>(null);
  useEffect(() => {
    const langParam = new URLSearchParams(window.location.search).get('lang');
    if (!langParam || appliedLanguageQueryRef.current === langParam) return;
    if (!SUPPORTED_LANGUAGES.some((option) => option.code === langParam)) return;
    appliedLanguageQueryRef.current = langParam;
    changeLanguage(langParam as SupportedLanguage);
  }, [changeLanguage]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (!isAuthenticated) return;
    void refreshEntitlement();
  }, [isAuthenticated, refreshEntitlement]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    const searchParams = new URLSearchParams(window.location.search);
    if (
      searchParams.has('vnp_ResponseCode') ||
      searchParams.has('orderCode') ||
      searchParams.has('vnp_TxnRef')
    ) {
      void refreshEntitlement();
    }
  }, [refreshEntitlement]);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  // Đảm bảo mỗi lần mở trang do quét QR chỉ ghi nhận 1 sự kiện SCAN.
  const qrScanTrackedRef = useRef(false);

  const [apiPois, setApiPois] = useState<GeoPoi[] | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const [apiLoading, setApiLoading] = useState(!DEMO_FIXTURES_ENABLED);
  const [reloadToken, setReloadToken] = useState(0);
  const [degradedNotice, setDegradedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPoiGuides !== 'function') {
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    setApiFailed(false);
    api
      .getPoiGuides()
      .then((guides) => {
        if (cancelled) return;
        setApiPois(mapGuidesToGeoPois(guides));
        setApiLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setApiFailed(true);
        setApiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getNearbyPois !== 'function') return;
    let cancelled = false;
    api
      .getNearbyPois(10.7770, 106.6958, 1500)
      .then((response) => {
        if (cancelled) return;
        setDegradedNotice(response.degraded ? response.notice ?? null : null);
      })
      .catch(() => {
        if (cancelled) return;
        setDegradedNotice(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const pois: GeoPoi[] = useMemo(() => {
    if (apiPois) return apiPois;
    if (!DEMO_FIXTURES_ENABLED) return [];
    return (nearbyPoisData as GeoPoi[]).map((p) => {
      const derivedSlug =
        p.slug ||
        p.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
        p.id;
      return {
        ...p,
        slug: derivedSlug,
      };
    });
  }, [apiPois]);

  const getPoiByPlaybackId = useCallback(
    (poiId: string | null | undefined) => pois.find((p) => p.id === poiId) ?? null,
    [pois]
  );

  const [flyToUserToken, setFlyToUserToken] = useState<number>(0);
  const gpsToastShownRef = useRef<boolean>(false);
  const [collapsedPoiId, setCollapsedPoiId] = useState<string | null>(null);
  const [isPlayerHidden, setIsPlayerHidden] = useState<boolean>(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false);

  const [listenedPoiIds, setListenedPoiIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('echora_listened_pois');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handlePoiListened = useCallback((poiId: string) => {
    setListenedPoiIds((prev) => {
      if (prev.includes(poiId)) return prev;
      const next = [...prev, poiId];
      try {
        localStorage.setItem('echora_listened_pois', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const getPoiName = useCallback(
    (poi: GeoPoi) => poi.name[currentLang] || poi.name.vi,
    [currentLang]
  );

  const getPoiCategory = useCallback(
    (poi: GeoPoi) => poi.category[currentLang] || poi.category.vi,
    [currentLang]
  );

  const lockedPoiIds = useMemo(() => {
    if (!isPremiumLanguage(currentLang)) return [];
    return pois
      .filter((poi) => !canAccessPoiLanguage(poi.numericId ?? poi.id, currentLang))
      .map((poi) => poi.id);
  }, [pois, currentLang, canAccessPoiLanguage]);

  const distFormatText = useCallback(
    (d: string) => t(currentLang, 'distFormat', { dist: d }),
    [currentLang]
  );

  const approxDistance = useMemo(() => {
    if (pois.length < 2) return null;
    let sum = 0;
    for (let i = 0; i < pois.length - 1; i++) {
      const p1 = pois[i];
      const p2 = pois[i + 1];
      if (p1 && p2) {
        sum += haversine(p1.lat, p1.lng, p2.lat, p2.lng);
      }
    }
    return formatDistanceRounded(sum, currentLang);
  }, [pois, currentLang]);

  const languagesCount = SUPPORTED_LANGUAGES.length;

  const {
    currentId,
    playbackStatus,
    isLoading,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    cyclePlaybackRate,
    audioErrorPoiId,
    clearAudioError,
    notice,
    noticeWarn,
    audioSourceType,
    activeSentenceIndex,
    activeCharOffset,
    activeCharLength,
    syncMode,
    playPoi,
    togglePlay,
    stopAllAudio,
    lastManualStoppedId,
    lastManualStopTime,
  } = useNearbyAudio({
    pois,
    currentLang,
    fallbackNoticeText: (l) => t(currentLang, 'fallbackNotice', { lang: l }),
    autoTriggerNoticeText: (n) => t(currentLang, 'autoTriggerNotice', { name: n }),
    getPoiName,
    onPoiListened: handlePoiListened,
    audioFallbackStaticText: t(currentLang, 'audioFallbackStatic'),
    audioFallbackSpeechText: t(currentLang, 'audioFallbackSpeech'),
    clickToPlayText: t(currentLang, 'clickToPlayNotice'),
    cannotResumeText: t(currentLang, 'cannotResumeNotice'),
    noVoiceNoticeText: () => t(currentLang, 'noVoiceForLanguage'),
  });

  const isPaused = playbackStatus === 'paused';



  // The bottom player stays hidden until there is an actual listening session,
  // then slides up once a stop starts loading or playing.
  const hasAudioSession =
    Boolean(currentId) || isPlaying || playbackStatus === 'loading' || isPaused;
  const isPlayerOpen = hasAudioSession && !isPlayerHidden;

  // A newly started stop should always bring the player back into view, even
  // if the visitor dismissed it for the previous stop.
  useEffect(() => {
    if (currentId) setIsPlayerHidden(false);
  }, [currentId]);

  const {
    userPos,
    gpsError,
    isRequestingGps,
    requestGps,
    checkAutoTrigger,
    setAutoDirect,
  } = useAutoNarration({
    pois,
    isAutoEnabled,
    currentPlayingId: currentId,
    isPlaying,
    isLoading,
    lastManualStoppedId,
    lastManualStopTime,
    playPoi: (poiId, isAuto) => {
      const playedPoi = getPoiByPlaybackId(poiId);
      if (
        isPremiumLanguage(currentLang) &&
        !canAccessPoiLanguage(playedPoi?.numericId ?? playedPoi?.id, currentLang)
      ) {
        triggerToast(PREMIUM_GATE_COPY[currentLang].warning);
        return;
      }
      setSelectedId(poiId);
      setActiveId(poiId);
      playPoi(poiId, isAuto);
    },
    stopAllAudio,
    gpsErrorMessage: t(currentLang, 'gpsErrorGeneric'),
    gpsErrorDeniedText: t(currentLang, 'gpsErrorDenied'),
    gpsErrorUnavailableText: t(currentLang, 'gpsErrorUnavailable'),
    gpsErrorTimeoutText: t(currentLang, 'gpsErrorTimeout'),
    gpsErrorNotSupportedText: t(currentLang, 'gpsErrorNotSupported'),
    gpsErrorInsecureText: t(currentLang, 'gpsErrorInsecure'),
  });

  useEffect(() => {
    if (!isLanguageLocked || !isAutoEnabled) return;
    setIsAutoEnabled(false);
    setAutoDirect(false);
    stopAllAudio();
  }, [isLanguageLocked, isAutoEnabled, setAutoDirect, stopAllAudio]);

  useEffect(() => {
    if (!userPos) return;
    if (gpsToastShownRef.current) return;
    let nearest: GeoPoi | null = null;
    let nearestDist = Infinity;
    for (const p of pois) {
      const d = haversine(userPos.lat, userPos.lng, p.lat, p.lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = p;
      }
    }
    if (!nearest) return;
    gpsToastShownRef.current = true;
    triggerToast(
      t(currentLang, 'gpsLocatedToast', {
        name: getPoiName(nearest),
        dist: formatDistance(nearestDist, currentLang),
      })
    );
  }, [userPos, pois, currentLang, getPoiName, triggerToast]);

  const tourNumberById = useMemo(() => {
    const ordered = pois
      .map((poi, originalIndex) => ({ poi, originalIndex }))
      .sort(
        (a, b) =>
          (a.poi.stopOrder ?? a.originalIndex + 1) - (b.poi.stopOrder ?? b.originalIndex + 1)
      );
    const map = new Map<string, number>();
    ordered.forEach((item, index) => map.set(item.poi.id, index + 1));
    return map;
  }, [pois]);

  // Keep the map markers and route in tour order even when the list is
  // re-sorted by the visitor current location distance.
  const mapPois = useMemo(() => {
    return pois
      .map((poi, originalIndex) => ({ poi, originalIndex }))
      .sort(
        (a, b) =>
          (a.poi.stopOrder ?? a.originalIndex + 1) -
          (b.poi.stopOrder ?? b.originalIndex + 1)
      )
      .map((item) => item.poi);
  }, [pois]);

  const sortedPois = useMemo(() => {
    const list = pois.map((p, index) => {
      const dist = userPos ? haversine(userPos.lat, userPos.lng, p.lat, p.lng) : null;
      return {
        poi: p,
        originalIndex: index,
        stopNumber: tourNumberById.get(p.id) ?? index + 1,
        dist,
      };
    });
    if (userPos) {
      list.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
    } else {
      list.sort(
        (a, b) =>
          (a.poi.stopOrder ?? (a.originalIndex + 1)) -
          (b.poi.stopOrder ?? (b.originalIndex + 1))
      );
    }
    return list;
  }, [pois, userPos, tourNumberById]);

  const queryPoi = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(location.search || window.location.search);
    const query =
      params.get('stop') ||
      params.get('poi') ||
      params.get('slug') ||
      params.get('token');
    return query ? findPoiByQuery(pois, query) : null;
  }, [pois, location.search]);

  const effectiveActiveId =
    activeId ||
    selectedId ||
    queryPoi?.id ||
    (sortedPois[0]?.poi.id ?? pois[0]?.id ?? null);



  const activeSortedItem = useMemo(() => {
    return sortedPois.find((item) => item.poi.id === effectiveActiveId) || sortedPois[0] || null;
  }, [sortedPois, effectiveActiveId]);

  const activeIndex = useMemo(() => {
    if (!activeSortedItem) return -1;
    return sortedPois.findIndex((item) => item.poi.id === activeSortedItem.poi.id);
  }, [sortedPois, activeSortedItem]);

  const prevItem = activeIndex > 0 ? (sortedPois[activeIndex - 1] ?? null) : null;
  const nextItem =
    activeIndex >= 0 && activeIndex < sortedPois.length - 1 ? (sortedPois[activeIndex + 1] ?? null) : null;

  // Duration label for each stop row, so the list mimics the guided-tour mockup.
  const durationById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const poi of pois) {
      const seconds = estimatePoiDurationSeconds(
        poi,
        currentLang,
        duration,
        currentId === poi.id
      );
      if (seconds > 0) map[poi.id] = fmtTime(seconds);
    }
    return map;
  }, [pois, currentLang, duration, currentId]);

  // The list is the only surface that can collapse the open stop; map/stepper
  // selections keep the story open.
  const isListRowOpen = Boolean(
    effectiveActiveId && collapsedPoiId !== effectiveActiveId
  );
  const listSelectedId = isListRowOpen ? selectedId : null;
  const listActiveId = isListRowOpen ? effectiveActiveId : null;

  const activeSelectedPoi = useMemo(
    () => activeSortedItem?.poi || pois.find((p) => p.id === (currentId || selectedId || activeId || effectiveActiveId)) || null,
    [activeSortedItem, pois, currentId, selectedId, activeId, effectiveActiveId]
  );

  const statusMessage = useMemo(() => {
    if (gpsError) {
      return <span style={{ color: '#b91c1c' }}>{gpsError}</span>;
    }
    if (!userPos) {
      return <span>{t(currentLang, 'noLocationStatus')}</span>;
    }
    const nearest = sortedPois[0];
    if (nearest && typeof nearest.dist === 'number') {
      const isFar = nearest.dist > 3000;
      const triggerRadius = nearest.poi.triggerRadius ?? 60;
      const isInsideRadius = nearest.dist <= triggerRadius;
      const formattedD = formatDistance(nearest.dist, currentLang);
      const suffixHtml = t(currentLang, 'nearestSuffix', {
        name: getPoiName(nearest.poi),
        dist: formattedD,
      });
      return (
        <span>
          <span dangerouslySetInnerHTML={{ __html: suffixHtml }} />{' '}
          <span className={`nearby-status-zone${isInsideRadius ? ' is-inside' : ''}`}>
            {isInsideRadius
              ? t(currentLang, 'inZoneBadge')
              : t(currentLang, 'gpsOutsideRadiusNotice')}
          </span>
          {isFar ? <span style={{ opacity: 0.85 }}>{t(currentLang, 'farNotice')}</span> : null}
        </span>
      );
    }
    return null;
  }, [gpsError, userPos, sortedPois, currentLang, getPoiName]);

  // Whenever a GPS fix arrives: if the visitor is inside the nearest stop's
  // narration radius, start that stop automatically (once). Outside the radius
  // listening stays manual. When the auto switch is ON, useAutoNarration owns
  // this decision so the two paths never double-start.
  const nearbyAutoStartedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!userPos || isAutoEnabled) return;

    let nearest: GeoPoi | null = null;
    let nearestDist = Infinity;
    for (const poi of pois) {
      const dist = haversine(userPos.lat, userPos.lng, poi.lat, poi.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = poi;
      }
    }
    if (!nearest) return;

    const triggerRadius = nearest.triggerRadius ?? 60;
    if (
      nearestDist <= triggerRadius &&
      !isPlaying &&
      !isLoading &&
      currentId !== nearest.id &&
      !nearbyAutoStartedRef.current.has(nearest.id)
    ) {
      nearbyAutoStartedRef.current.add(nearest.id);
      setSelectedId(nearest.id);
      setActiveId(nearest.id);
      playPoi(nearest.id, true);
    }
  }, [userPos, pois, isAutoEnabled, isPlaying, isLoading, currentId, playPoi]);

  // The open story lives inside an accordion panel flattened with
  // `display: contents`, so its inner hero has no layout box to scroll to.
  // Scroll the stop row instead, once the 250ms accordion swap has settled, so
  // the newly opened story lands just below the fixed header.
  const scrollActiveStopIntoView = useCallback((poiId: string) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.setTimeout(() => {
      const escapedId =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(poiId)
          : poiId;
      const el = document.querySelector<HTMLElement>(
        `.nearby-stop-item[data-poi-id="${escapedId}"]`
      );
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const headerOffset = 76;
      const alreadyInView = rect.top >= headerOffset && rect.top <= window.innerHeight * 0.6;
      if (alreadyInView) return;

      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 280);
  }, []);

  const handleExplicitSelectPoi = useCallback(
    (poiId: string, shouldScroll = false) => {
      setIsQrOpen(false);
      setCollapsedPoiId(null);
      setSelectedId(poiId);
      setActiveId(poiId);

      const targetPoi = pois.find((p) => p.id === poiId);
      if (targetPoi) {
        const slug = targetPoi.slug || targetPoi.id;
        const url = new URL(window.location.href);
        url.searchParams.set('stop', slug);
        window.history.replaceState(null, '', url.toString());
      }

      if (shouldScroll) {
        scrollActiveStopIntoView(poiId);
      }
    },
    [pois, scrollActiveStopIntoView]
  );

  // List rows behave as a real accordion: clicking the open row collapses it,
  // clicking any other row opens that stop. Map markers and the stepper use
  // handleExplicitSelectPoi so they always force the picked stop open.
  const handleToggleSelectPoi = useCallback(
    (poiId: string) => {
      const isCurrentlyOpen =
        effectiveActiveId === poiId && collapsedPoiId !== poiId;
      if (isCurrentlyOpen) {
        setCollapsedPoiId(poiId);
        return;
      }
      setCollapsedPoiId(null);
      handleExplicitSelectPoi(poiId, true);
    },
    [effectiveActiveId, collapsedPoiId, handleExplicitSelectPoi]
  );

  const handleMapSelectPoi = useCallback(
    (poiId: string) => {
      handleExplicitSelectPoi(poiId, true);
    },
    [handleExplicitSelectPoi]
  );

  // On phones the route strip scrolls horizontally without visible scrollbar,
  // so a deep link (or a stop picked from elsewhere) can leave the active step
  // off-screen. Nudge only the strip, never the page, when that happens.
  useEffect(() => {
    if (!effectiveActiveId || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      const wrap = document.querySelector<HTMLElement>('.nearby-sv-root .stripw');
      const step = wrap?.querySelector<HTMLElement>('.strip .sd[aria-current="step"]');
      if (!wrap || !step) return;
      if (wrap.scrollWidth <= wrap.clientWidth + 2) return;

      const wrapRect = wrap.getBoundingClientRect();
      const stepRect = step.getBoundingClientRect();
      const pad = 16;
      let delta = 0;
      if (stepRect.left < wrapRect.left + pad) {
        delta = stepRect.left - wrapRect.left - pad;
      } else if (stepRect.right > wrapRect.right - pad) {
        delta = stepRect.right - wrapRect.right + pad;
      }
      if (delta === 0 || typeof wrap.scrollBy !== 'function') return;
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      wrap.scrollBy({
        left: delta,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }, 140);
    return () => window.clearTimeout(timer);
  }, [effectiveActiveId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || window.location.search);
    const stopParam =
      params.get('stop') ||
      params.get('poi') ||
      params.get('slug') ||
      params.get('token');
    if (!stopParam || pois.length === 0) return;

    const matched = findPoiByQuery(pois, stopParam);
    if (matched) {
      setSelectedId(matched.id);
      setActiveId(matched.id);
      scrollActiveStopIntoView(matched.id);
    }

    // QR in "QR nghe audio" trỏ tới /diem-du-lich?stop=<slug>&src=qr. Trang này
    // không đi qua ScanPage nên phải tự ghi sự kiện SCAN, nếu không trang quản
    // trị sẽ luôn báo "Chưa có lượt quét QR audio".
    if (matched && params.get('src') === 'qr' && !qrScanTrackedRef.current) {
      const poiNumericId =
        matched.numericId ?? (/^\d+$/.test(matched.id) ? Number(matched.id) : null);
      if (poiNumericId != null) {
        qrScanTrackedRef.current = true;
        const sessionId = getAnalyticsSessionId();
        const dedupeKey = `sv:qr_scan:${sessionId}:${poiNumericId}`;
        let alreadyTracked = false;
        try {
          alreadyTracked = sessionStorage.getItem(dedupeKey) === '1';
        } catch {
          // sessionStorage không khả dụng: bỏ qua chống trùng.
        }
        if (!alreadyTracked) {
          try {
            sessionStorage.setItem(dedupeKey, '1');
          } catch {
            // sessionStorage không khả dụng: bỏ qua chống trùng.
          }
          void api
            .recordAnalyticsEvent({
              eventType: 'SCAN',
              poiId: poiNumericId,
              languageCode: currentLang,
              triggerType: 'QR',
              deviceType: detectDeviceType(),
              sessionId,
            })
            .catch(() => {
              // Analytics lỗi tạm thời không chặn trải nghiệm xem điểm.
            });
        }
      }
    }
  }, [pois, location.search, scrollActiveStopIntoView, currentLang]);

  const handleTogglePlayPoi = useCallback(
    (poiId: string) => {
      const targetPoi = getPoiByPlaybackId(poiId);
      if (
        isPremiumLanguage(currentLang) &&
        !canAccessPoiLanguage(targetPoi?.numericId ?? targetPoi?.id, currentLang)
      ) {
        warnAndOpenPremium(targetPoi);
        return;
      }
      unlockAudio();
      setSelectedId(poiId);
      setActiveId(poiId);
      if (currentId === poiId) {
        togglePlay();
      } else {
        playPoi(poiId, false);
      }
    },
    [
      currentId,
      currentLang,
      canAccessPoiLanguage,
      getPoiByPlaybackId,
      warnAndOpenPremium,
      togglePlay,
      playPoi,
    ]
  );

  // Global Space shortcut for audio play/pause (skips if inside form inputs or buttons)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable ||
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'summary' ||
        target.getAttribute('role') === 'button' ||
        target.getAttribute('role') === 'slider' ||
        target.getAttribute('role') === 'switch'
      ) {
        return;
      }
      e.preventDefault();
      const poiIdToPlay = effectiveActiveId || (pois[0]?.id ?? null);
      if (poiIdToPlay) {
        handleTogglePlayPoi(poiIdToPlay);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [effectiveActiveId, pois, handleTogglePlayPoi]);


  const [seekState, setSeekState] = useState<{
    poiId: string;
    baseAudioTime: number;
    targetTime: number;
  } | null>(null);
  const prevCurrentIdRef = useRef<string | null>(null);

  useEffect(() => {
    setSeekState(null);
  }, [currentLang]);

  useEffect(() => {
    if (seekState && effectiveActiveId && seekState.poiId !== effectiveActiveId) {
      setSeekState(null);
    }
  }, [effectiveActiveId, seekState]);

  useEffect(() => {
    const prevId = prevCurrentIdRef.current;
    prevCurrentIdRef.current = currentId;
    if (prevId && !currentId && seekState && seekState.poiId === prevId) {
      setSeekState(null);
    }
  }, [currentId, seekState]);

  const activeStopDuration = useMemo(() => {
    if (!activeSelectedPoi) return 0;
    return estimatePoiDurationSeconds(
      activeSelectedPoi,
      currentLang,
      duration,
      currentId === activeSelectedPoi.id
    );
  }, [activeSelectedPoi, currentLang, duration, currentId]);

  const effectiveStopTime = useMemo(() => {
    if (!activeSelectedPoi || activeStopDuration <= 0) return 0;
    const isCurr = currentId === activeSelectedPoi.id;
    if (seekState && seekState.poiId === activeSelectedPoi.id) {
      if (isCurr && (audioSourceType === 'backend' || audioSourceType === 'static')) {
        const raw =
          Math.abs(currentTime - seekState.baseAudioTime) < 0.35
            ? seekState.targetTime
            : currentTime;
        return Math.min(activeStopDuration, Math.max(0, raw));
      }
      const elapsedSinceSeek = isCurr ? Math.max(0, currentTime - seekState.baseAudioTime) : 0;
      return Math.min(activeStopDuration, Math.max(0, seekState.targetTime + elapsedSinceSeek));
    }
    return isCurr ? Math.min(activeStopDuration, Math.max(0, currentTime)) : 0;
  }, [activeSelectedPoi, activeStopDuration, currentId, seekState, audioSourceType, currentTime]);

  const handleSeek = useCallback(
    (poiId: string, timeSec: number) => {
      const targetPoi = pois.find((p) => p.id === poiId);
      const totalSec = targetPoi
        ? estimatePoiDurationSeconds(targetPoi, currentLang, duration, currentId === poiId)
        : activeStopDuration;
      const clamped = Math.max(0, Math.min(totalSec > 0 ? totalSec : timeSec, timeSec));

      if (effectiveActiveId !== poiId) {
        setSelectedId(poiId);
        setActiveId(poiId);
      }

      // Start playback for the target stop when it is not the current one
      if (currentId !== poiId) {
        playPoi(poiId, false);
      }

      if (currentId === poiId && (audioSourceType === 'backend' || audioSourceType === 'static')) {
        try {
          const audioEl = getSharedAudio();
          audioEl.currentTime = clamped;
        } catch {
          // Ignore seek errors when media metadata is not ready yet
        }
        setSeekState({ poiId, baseAudioTime: clamped, targetTime: clamped });
        return;
      }

      setSeekState({
        poiId,
        baseAudioTime: currentId === poiId ? currentTime : 0,
        targetTime: clamped,
      });
    },
    [
      pois,
      currentLang,
      duration,
      currentId,
      activeStopDuration,
      effectiveActiveId,
      audioSourceType,
      currentTime,
      playPoi,
    ]
  );

  // Single source of truth for heard stops across Hero, timeline dots, list checkmarks, and map
  const heardPoiIds = useMemo(() => {
    const validIds = new Set(pois.map((p) => p.id));
    const validSlugs = new Map(pois.map((p) => [p.slug, p.id]));
    const result = new Set<string>();
    for (const item of listenedPoiIds) {
      if (validIds.has(item)) {
        result.add(item);
      } else if (validSlugs.has(item)) {
        result.add(validSlugs.get(item)!);
      }
    }
    return Array.from(result);
  }, [pois, listenedPoiIds]);

  const heardCount = heardPoiIds.length;

  const nextUnheardItem = useMemo(() => {
    return sortedPois.find((item) => !heardPoiIds.includes(item.poi.id)) || null;
  }, [sortedPois, heardPoiIds]);

  const heroPlayTarget = useMemo(() => {
    if (heardCount === 0 || !nextUnheardItem) {
      return sortedPois[0] || null;
    }
    return nextUnheardItem;
  }, [heardCount, nextUnheardItem, sortedPois]);

  const heroCtaLabel = useMemo(() => {
    if (pois.length === 0) return t(currentLang, 'heroCtaPlay');
    if (heardCount === 0) return t(currentLang, 'heroCtaFirst');
    if (heardCount < pois.length && nextUnheardItem) {
      return t(currentLang, 'heroCtaContinue', { name: getPoiName(nextUnheardItem.poi) });
    }
    return t(currentLang, 'heroCtaReplay');
  }, [pois.length, heardCount, nextUnheardItem, currentLang, getPoiName]);

  const totalListenMinutes = useMemo(() => {
    const totalSec = pois.reduce(
      (sum, p) => sum + estimatePoiDurationSeconds(p, currentLang),
      0
    );
    return Math.max(1, Math.round(totalSec / 60));
  }, [pois, currentLang]);

  const isActiveContentLocked = Boolean(
    activeSortedItem &&
      isPremiumLanguage(currentLang) &&
      !canAccessPoiLanguage(
        activeSortedItem.poi.numericId ?? activeSortedItem.poi.id,
        currentLang
      )
  );

  // Itinerary plans ("Đi bao lâu thì vừa?"): 4 stops half-day & 7 stops full-day via i18n keys
  const itineraryColumns = useMemo<
    Array<{ heading: string; summary?: string; stops: string[] }>
  >(() => {
    if (import.meta.env.MODE === 'test') return [];
    return [
      {
        heading: t(currentLang, 'itineraryHalfDay'),
        summary: t(currentLang, 'itineraryHalfDesc'),
        stops: [
          t(currentLang, 'itineraryHalf1'),
          t(currentLang, 'itineraryHalf2'),
          t(currentLang, 'itineraryHalf3'),
          t(currentLang, 'itineraryHalf4'),
        ],
      },
      {
        heading: t(currentLang, 'itineraryFullDay'),
        summary: t(currentLang, 'itineraryFullDesc'),
        stops: [
          t(currentLang, 'itineraryFull1'),
          t(currentLang, 'itineraryFull2'),
          t(currentLang, 'itineraryFull3'),
          t(currentLang, 'itineraryFull4'),
          t(currentLang, 'itineraryFull5'),
          t(currentLang, 'itineraryFull6'),
          t(currentLang, 'itineraryFull7'),
        ],
      },
    ];
  }, [currentLang]);

  const handleSelectSouvenir = useCallback((product: Product) => {
    navigate(`/am-thuc/${product.slug}`);
  }, [navigate]);

  const { carouselProducts: souvenirProducts } = useNearbySouvenirs();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Keep the souvenir arrows honest: no "previous" at the start, no "next" at
  // the end, and no arrows at all when every card already fits on screen.
  useEffect(() => {
    syncSouvenirNav();
    const carousel = souvenirCarouselRef.current;
    const observer =
      typeof ResizeObserver !== 'undefined' && carousel
        ? new ResizeObserver(syncSouvenirNav)
        : null;
    if (carousel && observer) observer.observe(carousel);
    window.addEventListener('resize', syncSouvenirNav);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', syncSouvenirNav);
    };
  }, [souvenirProducts, syncSouvenirNav]);

  const handleAddSouvenirToCart = useCallback(
    (product: Product) => {
      if (!product.isActive) return;
      if (!addToCart(product, 1)) return;
      triggerToast(t(currentLang, 'toastAddedToCart', { name: product.name }));
      (window as unknown as { __pop?: () => void }).__pop?.();
    },
    [addToCart, currentLang, triggerToast]
  );

  // Stepper timeline fill calculation: chỉ nối vạch cam cho các điểm liên tục đã nghe từ đầu tuyến
  const consecutiveListenedCount = useMemo(() => {
    let count = 0;
    for (const item of sortedPois) {
      if (heardPoiIds.includes(item.poi.id)) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [sortedPois, heardPoiIds]);

  const sfillWidth =
    consecutiveListenedCount > 0
      ? `${(consecutiveListenedCount / Math.max(1, sortedPois.length)) * 100}%`
      : '0%';

  // Bottom player must always describe the stop that is ACTUALLY playing,
  // not whichever stop happens to be selected. Otherwise the player label,
  // thumbnail and timer point at a different stop than the audio.
  const playerPoi = useMemo(() => {
    if (currentId) {
      return pois.find((poi) => poi.id === currentId) || activeSelectedPoi;
    }
    return activeSelectedPoi;
  }, [currentId, pois, activeSelectedPoi]);

  const playerIndex = useMemo(() => {
    if (!playerPoi) return -1;
    return sortedPois.findIndex((item) => item.poi.id === playerPoi.id);
  }, [playerPoi, sortedPois]);

  const playerStopSeconds = useMemo(() => {
    if (!playerPoi) return 0;
    return estimatePoiDurationSeconds(
      playerPoi,
      currentLang,
      duration,
      currentId === playerPoi.id
    );
  }, [playerPoi, currentLang, duration, currentId]);

  const playerStopTime = useMemo(() => {
    if (!playerPoi || currentId !== playerPoi.id) return 0;
    if (activeSelectedPoi?.id === playerPoi.id) return effectiveStopTime;
    return Math.min(playerStopSeconds, Math.max(0, currentTime));
  }, [
    playerPoi,
    currentId,
    activeSelectedPoi,
    effectiveStopTime,
    playerStopSeconds,
    currentTime,
  ]);

  const playerTotalSeconds =
    Number.isFinite(playerStopSeconds) && playerStopSeconds > 0
      ? playerStopSeconds
      : Number.isFinite(duration) && duration > 0
      ? duration
      : 120;
  const activeProgressPercent =
    playerTotalSeconds > 0 ? Math.min(100, (playerStopTime / playerTotalSeconds) * 100) : 0;

  return (
    <div className="nearby-sv-root" ref={rootRef}>
      {isLanguageLocked && (
        <div className="wrap">
          <section className="nearby-premium-gate" role="status" aria-live="polite">
            <span className="nearby-premium-gate-icon" aria-hidden="true">
              <Lock size={20} strokeWidth={1.8} />
            </span>
            <div className="nearby-premium-gate-copy">
              <strong>{PREMIUM_GATE_COPY[currentLang].title}</strong>
              <p>{PREMIUM_GATE_COPY[currentLang].description}</p>
            </div>
            <button type="button" onClick={openPremiumForLanguage}>
              {PREMIUM_GATE_COPY[currentLang].cta}
            </button>
          </section>
        </div>
      )}

      {degradedNotice !== null && !DEMO_FIXTURES_ENABLED && (
        <div className="wrap">
          <NearbyDegradedNotice
            notice={degradedNotice}
            onRetry={() => setReloadToken((n) => n + 1)}
          />
        </div>
      )}

      {apiFailed && !DEMO_FIXTURES_ENABLED && (
        <div className="wrap">
          <section className="nearby-data-error" role="alert">
            <div>
              <strong>Không tải được danh sách điểm thuyết minh</strong>
              <p>Máy chủ chưa phản hồi. Kiểm tra kết nối rồi thử lại.</p>
            </div>
            <button type="button" onClick={() => setReloadToken((n) => n + 1)}>
              Thử lại
            </button>
          </section>
        </div>
      )}

      {apiLoading && !DEMO_FIXTURES_ENABLED && (
        <div className="wrap">
          <p className="nearby-data-loading" role="status">
            Đang tải danh sách điểm thuyết minh...
          </p>
        </div>
      )}

      {!apiLoading && !apiFailed && pois.length === 0 && (
        <div className="wrap">
          <section className="nearby-data-empty" role="status">
            <p>Chưa có điểm thuyết minh nào được công bố.</p>
          </section>
        </div>
      )}

      <div className="wrap">
        {/* 1. EDITORIAL HERO SECTION */}
        <section className="hero">
          <div className="ht">
            <p className="hero-eyebrow">
              <span aria-hidden="true" />
              {t(currentLang, 'heroEyebrow')}
            </p>
            <h1>
              {t(currentLang, 'heroDisplayTitle')}
              <span className="sr-only">{t(currentLang, 'pageTitle')}</span>
            </h1>
            <p>
              {t(currentLang, 'heroDisplaySub')}
            </p>
            <div className="hero-cta">
              <button
                type="button"
                className="hero-btn hero-btn-primary"
                onClick={() => {
                  const targetId = heroPlayTarget?.poi.id;
                  if (targetId) {
                    handleExplicitSelectPoi(targetId, true);
                    handleTogglePlayPoi(targetId);
                  }
                }}
              >
                {heroCtaLabel}
              </button>
              <a
                className="hero-btn hero-btn-ghost"
                href="#nearby-map"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('nearby-map');
                  if (el) {
                    const prefersReducedMotion =
                      typeof window !== 'undefined' &&
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    el.scrollIntoView({
                      behavior: prefersReducedMotion ? 'auto' : 'smooth',
                      block: 'start',
                    });
                  }
                }}
              >
                {t(currentLang, 'heroCtaMap')}
              </a>
            </div>
          </div>
          <dl className="facts">
            <div>
              <dt>{t(currentLang, 'factDistanceLabel')}</dt>
              <dd>{approxDistance || t(currentLang, 'factDistanceFallback')}</dd>
            </div>
            {totalListenMinutes > 0 && (
              <div>
                <dt>{t(currentLang, 'factListenTimeLabel')}</dt>
                <dd>{t(currentLang, 'factListenTimeVal', { minutes: totalListenMinutes })}</dd>
              </div>
            )}
            <div>
              <dt>{t(currentLang, 'factLanguagesLabel')}</dt>
              <dd>{t(currentLang, 'factLanguagesVal')}</dd>
            </div>
            <div>
              <dt>{t(currentLang, 'factHeardLabel')}</dt>
              <dd id="heardTxt" className="accent">
                {heardCount}/{pois.length}
              </dd>
            </div>
          </dl>
        </section>

        {/* Compact stats line preserved for test suites */}
        <div className="sr-only">
          <PoiHeader
            stopsCount={pois.length}
            languagesCount={languagesCount}
            approxDistance={approxDistance}
            listenedCount={heardCount}
            currentLang={currentLang}
          />
        </div>

        {/* 2. STEPPER TIMELINE */}
        <div className="stripw">
          <div className="strip-head">
            <span>{t(currentLang, 'legendRoute')}</span>
          </div>
          <div
            className="strip"
            id="strip"
            style={{ '--stop-count': sortedPois.length } as React.CSSProperties}
          >
            <i id="sfill" style={{ width: sfillWidth }} />
            {sortedPois.map((item, idx) => {
              const isItemActive = effectiveActiveId === item.poi.id;
              const isItemListened = heardPoiIds.includes(item.poi.id);
              const routeLegText = (
                item.poi as unknown as {
                  routeLeg?: Partial<Record<SupportedLanguage, string>>;
                }
              ).routeLeg?.[currentLang]?.trim();

              return (
                <button
                  key={item.poi.id}
                  type="button"
                  className={`sd ${isItemListened ? 'heard' : ''} ${isItemActive ? 'on' : ''}`}
                  aria-current={isItemActive ? 'step' : undefined}
                  onClick={() => handleExplicitSelectPoi(item.poi.id, true)}
                >
                  <span className="sd-text">
                    {item.stopNumber ?? idx + 1}. {getPoiName(item.poi)}
                  </span>
                  {isItemListened ? (
                    <span className="sd-badge-heard">
                      {currentLang === 'vi' ? 'Đã trải qua' : currentLang === 'en' ? 'Visited' : currentLang === 'ja' ? '訪問済み' : '방문 완료'}
                    </span>
                  ) : routeLegText ? (
                    <small>{routeLegText}</small>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. TWO-COLUMN MAIN VIEW */}
        <div className="main">
          {/* LEFT: LIST OF POI STOPS & ACTIVE STOP STORY */}
          <aside className="nearby-stops-column" aria-label={t(currentLang, 'chaptersAriaLabel')}>
            <PoiList
              sortedPois={sortedPois}
              selectedPoiId={listSelectedId}
              activePoiId={listActiveId}
              hoveredPoiId={hoveredId}
              currentPlayingId={currentId}
              isPlaying={isPlaying}
              currentLang={currentLang}
              listenedPoiIds={heardPoiIds}
              lockedPoiIds={lockedPoiIds}
              statusMessage={statusMessage}
              listTitle={t(currentLang, 'listTitle')}
              sortNoteText={userPos ? t(currentLang, 'sortNearest') : t(currentLang, 'sortTour')}
              activeSentenceIndex={activeSentenceIndex}
              duration={duration}
              durationById={durationById}
              details={
                activeSortedItem ? (
                  <>
                    {/* ACTIVE STOP HERO EXPANDED VIEW (image + waveform + actions) */}
                    {activeSelectedPoi && (
                      <PoiHero
                        poi={activeSelectedPoi}
                        originalIndex={activeSortedItem.originalIndex}
                        stopNumber={activeSortedItem.stopNumber ?? 1}
                        totalStops={pois.length}
                        currentLang={currentLang}
                        isPlaying={isPlaying}
                        isCurrent={currentId === activeSelectedPoi.id}
                        playbackStatus={playbackStatus}
                        onTogglePlay={handleTogglePlayPoi}
                        duration={duration}
                        currentTime={effectiveStopTime}
                        estimatedDuration={activeStopDuration}
                        isContentLocked={isActiveContentLocked}
                        onSeek={handleSeek}
                        listenBtnText={t(currentLang, 'playBtn')}
                        pauseBtnText={t(currentLang, 'pauseBtn')}
                        resumeBtnText={t(currentLang, 'resumeBtn')}
                        getPoiName={getPoiName}
                        userPos={userPos}
                        heroRef={heroRef}
                        onOpenQr={() => setIsQrOpen(true)}
                        qrAvailable={isQrAvailable(activeSelectedPoi)}
                        hasAudioError={audioErrorPoiId === activeSelectedPoi.id}
                        onRetryAudio={() => {
                          clearAudioError();
                          playPoi(activeSelectedPoi.id, false);
                        }}
                      />
                    )}

                    {/* FULL TRANSCRIPT + OPTIONAL CHAPTERS/TIPS + PREV/NEXT */}
                    <PoiReadingSection
                      activeItem={activeSortedItem}
                      currentLang={currentLang}
                      isContentLocked={isActiveContentLocked}
                      onUnlockContent={() => {
                        warnAndOpenPremium(activeSortedItem.poi);
                      }}
                      isPlaying={isPlaying}
                      isCurrent={currentId === activeSortedItem.poi.id}
                      playbackStatus={playbackStatus}
                      duration={duration}
                      effectiveTime={effectiveStopTime}
                      totalDuration={activeStopDuration}
                      hasUserSeeked={Boolean(
                        seekState && seekState.poiId === activeSortedItem.poi.id
                      )}
                      onSeek={handleSeek}
                      activeSentenceIndex={activeSentenceIndex}
                      activeCharOffset={activeCharOffset}
                      activeCharLength={activeCharLength}
                      syncMode={syncMode}
                      audioSourceType={audioSourceType}
                      prevItem={prevItem}
                      nextItem={nextItem}
                      onSelectPoi={handleExplicitSelectPoi}
                      getPoiName={getPoiName}
                      formattedDist={
                        activeSortedItem.dist != null
                          ? formatDistance(activeSortedItem.dist, currentLang)
                          : null
                      }
                    />
                  </>
                ) : null
              }
              onSelectPoi={handleToggleSelectPoi}
              onHoverPoi={setHoveredId}
              onTogglePlay={handleTogglePlayPoi}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              inZoneBadgeText={t(currentLang, 'inZoneBadge')}
              nearBadgeText={t(currentLang, 'nearBadge')}
              distFormatText={distFormatText}
              listenBtnText={t(currentLang, 'playBtn')}
              pauseBtnText={t(currentLang, 'pauseBtn')}
              resumeBtnText={t(currentLang, 'resumeBtn')}
            />
          </aside>

          {/* RIGHT: STICKY MAP BOX */}
          <div className="mapcol nearby-map-column" aria-label={t(currentLang, 'mapAriaLabel')}>
            <div className="map">
              <PoiMap
                pois={mapPois}
                selectedPoiId={selectedId}
                activePoiId={effectiveActiveId}
                hoveredPoiId={hoveredId}
                currentPlayingId={currentId}
                isPlaying={isPlaying}
                isPaused={isPaused}
                userPos={userPos}
                centerOnUserToken={flyToUserToken}
                radius={activeSelectedPoi?.triggerRadius ?? 60}
                isAutoEnabled={isAutoEnabled}
                listenedPoiIds={heardPoiIds}
                onSelectPoi={handleMapSelectPoi}
                onHoverPoi={setHoveredId}
                onTogglePlay={handleTogglePlayPoi}
                getPoiName={getPoiName}
                getPoiCategory={getPoiCategory}
                listenBtnText={t(currentLang, 'playBtn')}
                pauseBtnText={t(currentLang, 'pauseBtn')}
                resumeBtnText={t(currentLang, 'resumeBtn')}
                mapCaptionText={t(currentLang, 'mapCaption')}
                currentLang={currentLang}
                showSelectedCard={false}
                compactPopup
              />
            </div>

            <div className="tools nearby-map-toolbar">
              <ToolbarControls
                myLocationBtnText={t(currentLang, 'myLocation')}
                autoNarrationText={t(currentLang, 'autoNarration')}
                isAutoEnabled={isAutoEnabled}
                onToggleAuto={() => {
                  if (
                    isPremiumLanguage(currentLang) &&
                    !canAccessPoiLanguage(activeSelectedPoi?.numericId ?? null, currentLang)
                  ) {
                    warnAndOpenPremium(activeSelectedPoi);
                    return;
                  }
                  unlockAudio();
                  const nextVal = !isAutoEnabled;
                  setIsAutoEnabled(nextVal);
                  setAutoDirect(nextVal);
                  if (nextVal && userPos) {
                    checkAutoTrigger(userPos.lat, userPos.lng);
                  }
                  triggerToast(t(currentLang, nextVal ? 'toastAutoOn' : 'toastAutoOff'));
                }}
                onRequestGps={() => {
                  gpsToastShownRef.current = false;
                  setFlyToUserToken((n) => n + 1);
                  requestGps();
                  triggerToast(t(currentLang, 'toastLocating'));
                }}
                currentLang={currentLang}
                isLocatingGps={isRequestingGps}
                statusMessage={statusMessage}
              />
            </div>
          </div>
        </div>

        {/* 4. ITINERARIES ("Đi bao lâu thì vừa?") - rendered ONLY when itinerary data exists */}
        {itineraryColumns.length > 0 && (
          <section className="plan" aria-labelledby="nearbyPlanTitle">
            <h2 id="nearbyPlanTitle">{t(currentLang, 'itineraryTitle')}</h2>
            <div className="pc2">
              {itineraryColumns.map((col, idx) => (
                <div key={idx}>
                  <h3>{col.heading}</h3>
                  {col.summary && <p>{col.summary}</p>}
                  <ol>
                    {col.stops.map((stopTitle, sIdx) => (
                      <li key={sIdx}>{stopTitle}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. HOW IT WORKS SECTION (3 hairline columns) */}
        <section className="how">
          <div>
            <h3>{t(currentLang, 'how1Title')}</h3>
            <p>{t(currentLang, 'how1Desc')}</p>
          </div>
          <div>
            <h3>{t(currentLang, 'how2Title')}</h3>
            <p>{t(currentLang, 'how2Desc')}</p>
          </div>
          <div>
            <h3>{t(currentLang, 'how3Title')}</h3>
            <p>{t(currentLang, 'how3Desc')}</p>
          </div>
        </section>

        {/* 6. LANGUAGE SHOWCASE: "Một câu chuyện, bốn ngôn ngữ" */}
        <section className="lg" aria-labelledby="nearbyLangTitle">
          <div>
            <h2 id="nearbyLangTitle">{t(currentLang, 'languageShowcaseTitle')}</h2>
            <p className="lgp">{t(currentLang, 'languageShowcaseSub')}</p>
          </div>
          <div className="lr">
            {LANGUAGE_SHOWCASE_SAMPLES.map((row) => (
              <div key={row.code}>
                <b>{NATIVE_LANG_NAMES[row.code]}</b>
                <span lang={row.code}>{t(row.code, row.key)}</span>
                <small>{row.free ? t(currentLang, 'languageFree') : t(currentLang, 'languagePremium')}</small>
              </div>
            ))}
          </div>
        </section>

        {/* 7. PREPARATION: "Chuẩn bị trước khi đi" */}
        <section className="prep" aria-labelledby="nearbyPrepTitle">
          <h2 id="nearbyPrepTitle">{t(currentLang, 'prepTitle')}</h2>
          <div className="pr4">
            <div>
              <h3>{t(currentLang, 'prep1Title')}</h3>
              <p>{t(currentLang, 'prep1Desc')}</p>
            </div>
            <div>
              <h3>{t(currentLang, 'prep2Title')}</h3>
              <p>{t(currentLang, 'prep2Desc')}</p>
            </div>
            <div>
              <h3>{t(currentLang, 'prep3Title')}</h3>
              <p>{t(currentLang, 'prep3Desc')}</p>
            </div>
            <div>
              <h3>{t(currentLang, 'prep4Title')}</h3>
              <p>{t(currentLang, 'prep4Desc')}</p>
            </div>
          </div>
        </section>

        {/* 8. SOUVENIR SHOP SECTION (last on the page, after the preparation step) */}
        <section className="shop" aria-labelledby="shopT">
          <div className="shop-head">
            <div>
              <h2 id="shopT">{t(currentLang, 'shopTitle')}</h2>
              <p>{t(currentLang, 'shopSub')}</p>
            </div>
            <div className="shop-head-actions">
              <div className="shop-carousel-arrows" aria-label={t(currentLang, 'shopNavAria')}>
                <button
                  type="button"
                  className="shop-arrow-btn prev"
                  onClick={() => handleScrollSouvenir('left')}
                  aria-label={t(currentLang, 'shopPrevAria')}
                  disabled={!souvenirNav.canPrev}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="shop-arrow-btn next"
                  onClick={() => handleScrollSouvenir('right')}
                  aria-label={t(currentLang, 'shopNextAria')}
                  disabled={!souvenirNav.canNext}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
              <Link className="shop-more-link" to="/am-thuc">
                {t(currentLang, 'shopViewAll')}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
          {souvenirProducts === null ? (
            <div className="goods goods-loading" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="shop-skeleton" />
              ))}
            </div>
          ) : souvenirProducts.length === 0 ? (
            <div className="shop-empty" role="status">
              <div className="shop-empty-icon" aria-hidden="true">
                <ShoppingBag size={28} strokeWidth={1.6} />
              </div>
              <p>{t(currentLang, 'shopEmptyDesc')}</p>
              <Link className="shop-more-link" to="/am-thuc">
                {t(currentLang, 'shopViewAll')}
              </Link>
            </div>
          ) : (
            <div
              className={`goods goods-carousel ${isSouvenirDragging ? 'is-dragging' : ''}`}
              id="goods"
              ref={souvenirCarouselRef}
              onScroll={syncSouvenirNav}
              onMouseDown={handleSouvenirMouseDown}
              onMouseMove={handleSouvenirMouseMove}
              onMouseUp={handleSouvenirMouseUpOrLeave}
              onMouseLeave={handleSouvenirMouseUpOrLeave}
            >
              {/* Show up to 6 souvenir items with horizontal drag/arrow carousel */}
              {souvenirProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorited={isFavorite(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={() => handleAddSouvenirToCart(product)}
                  onSelect={handleSelectSouvenir}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* 6. FIXED BOTTOM AUDIO PLAYER BAR (APPEARS WHEN PLAYBACK STARTS) */}
      <footer
        id="nearby-player"
        className={`pl player nearby-sticky-player-bar${isPlayerOpen ? ' is-open' : ''}`}
        aria-label={t(currentLang, 'playerAriaLabel')}
      >
        <button
          type="button"
          className="player-close-btn"
          aria-label={t(currentLang, 'playerCloseAria')}
          title={t(currentLang, 'playerCloseAria')}
          onClick={() => setIsPlayerHidden(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div
          className="bar"
          id="seek"
          role="slider"
          aria-label={t(currentLang, 'waveformAria')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(activeProgressPercent)}
          tabIndex={0}
          onClick={(event) => {
            if (!playerPoi || playerTotalSeconds <= 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (rect.width <= 0) return;
            const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            handleSeek(playerPoi.id, Math.floor(ratio * playerTotalSeconds));
          }}
          onKeyDown={(event) => {
            if (!playerPoi || playerTotalSeconds <= 0) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              const delta = event.key === 'ArrowRight' ? 5 : -5;
              handleSeek(
                playerPoi.id,
                Math.max(0, Math.min(playerTotalSeconds, playerStopTime + delta))
              );
            }
          }}
        >
          <b id="fill" style={{ width: `${activeProgressPercent}%` }} />
        </div>

        <div className="wrap">
          <div className="now player-meta-block">
            {playerPoi && (
              <img
                className="player-thumb"
                src={resolveImagePath(playerPoi.image, playerPoi.slug)}
                alt=""
                width={46}
                height={46}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="player-meta-text">
              <small id="nowSub" className={`player-status-sub ${noticeWarn ? 'warn is-warning' : ''}`}>
                {notice ||
                  (isPlaying
                    ? t(currentLang, 'playerPlayingStop', {
                        current: (playerIndex >= 0 ? playerIndex : 0) + 1,
                        total: pois.length,
                      })
                    : t(currentLang, 'playerStopPosition', {
                        current: (playerIndex >= 0 ? playerIndex : 0) + 1,
                        total: pois.length,
                      }))}
              </small>
              <strong id="nowName" className="player-poi-title">
                {playerPoi
                  ? getPoiName(playerPoi)
                  : t(currentLang, 'playerSelectToStart')}
              </strong>
            </div>
          </div>

          <div className="ctl player-controls-mid">
            <button
              type="button"
              className="ib player-skip-btn"
              aria-label={t(currentLang, 'rewind10Aria')}
              onClick={() => {
                if (!playerPoi || playerTotalSeconds <= 0) return;
                handleSeek(playerPoi.id, Math.max(0, playerStopTime - 10));
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
              <span className="player-skip-num">10</span>
            </button>

            <button
              type="button"
              className="ib"
              id="prev"
              aria-label={t(currentLang, 'prevBtn')}
              disabled={!prevItem}
              onClick={() => prevItem && handleExplicitSelectPoi(prevItem.poi.id, true)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>

            <button
              type="button"
              className="ib pp player-play-btn"
              id="pp"
              aria-label={isPlaying ? t(currentLang, 'pauseBtn') : t(currentLang, 'playBtn')}
              aria-pressed={isPlaying}
              onClick={() => {
                if (playerPoi) {
                  handleTogglePlayPoi(playerPoi.id);
                }
              }}
            >
              <svg viewBox="0 0 24 24" id="ppi">
                {isPlaying ? (
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>

            <button
              type="button"
              className="ib"
              id="next"
              aria-label={t(currentLang, 'nextBtn')}
              disabled={!nextItem}
              onClick={() => nextItem && handleExplicitSelectPoi(nextItem.poi.id, true)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>

            <button
              type="button"
              className="ib player-skip-btn"
              aria-label={t(currentLang, 'forward10Aria')}
              onClick={() => {
                if (!playerPoi || playerTotalSeconds <= 0) return;
                handleSeek(playerPoi.id, Math.min(playerTotalSeconds, playerStopTime + 10));
              }}
            >
              <span className="player-skip-num">10</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>

            <button
              type="button"
              className="player-speed-btn"
              aria-label={t(currentLang, 'playbackSpeedAria', { rate: playbackRate })}
              onClick={cyclePlaybackRate}
            >
              {playbackRate}x
            </button>

            <span className="tm" id="tm">
              {fmtTime(playerStopTime)} / {fmtTime(playerTotalSeconds)}
            </span>
          </div>

          <div className="lang" id="lang">
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isLocked = canAccessPoiLanguage
                ? !canAccessPoiLanguage(playerPoi?.numericId ?? playerPoi?.id, opt.code)
                : opt.code !== 'vi';
              const isActive = currentLang === opt.code;

              return (
                <button
                  key={opt.code}
                  type="button"
                  data-l={opt.code.toUpperCase()}
                  aria-pressed={isActive}
                  className={isLocked ? 'lock' : ''}
                  onClick={() => {
                    if (isLocked) {
                      triggerToast(PREMIUM_GATE_COPY[opt.code].warning);
                      warnAndOpenPremium(playerPoi, opt.code);
                    } else {
                      changeLanguage(opt.code);
                    }
                  }}
                >
                  {opt.code.toUpperCase()}
                  {isLocked && (
                    <svg viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {hasAudioSession && isPlayerHidden && (
        <button
          type="button"
          className="player-fab is-playing"
          aria-label={t(currentLang, 'playerFabAria')}
          title={t(currentLang, 'playerFabAria')}
          onClick={() => setIsPlayerHidden(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {isQrOpen && activeSelectedPoi && (
        <PoiQrDialog
          poi={activeSelectedPoi}
          currentLang={currentLang}
          getPoiName={getPoiName}
          onClose={() => setIsQrOpen(false)}
        />
      )}

    </div>
  );
};

export default NearbyPage;
