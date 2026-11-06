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
 * - Cửa hàng quà lưu niệm "Mang một chút Sài Gòn về nhà" kết nối trực tiếp giỏ hàng
 * - Một thanh phát audio cố định ở chân trang (luôn hiển thị)
 * ============================================================================
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { unlockAudio } from '../lib/audioUnlock';
import {
  t,
  formatDistance,
  formatDistanceRounded,
  NEARBY_DICTIONARY,
} from '../content/nearbyI18n';

// Components
import { PoiHeader } from '../components/nearby/PoiHeader';
import { ToolbarControls } from '../components/nearby/ToolbarControls';
import { PoiMap } from '../components/nearby/PoiMap';
import { PoiList } from '../components/nearby/PoiList';
import { PoiHero } from '../components/nearby/PoiHero';
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
  if (isNaN(s) || s < 0) return '0:00';
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
function useNearbySouvenirs() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      setProducts([]);
      return;
    }
    if (typeof api.getProducts !== 'function') {
      setProducts(FALLBACK_SOUVENIRS);
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
        setProducts(merged.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setProducts(FALLBACK_SOUVENIRS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return products;
}

export const NearbyPage: React.FC = () => {
  const { lang, changeLanguage } = useNavbarLanguage();
  const navigate = useNavigate();
  const { canAccessLanguage, canAccessPoi, canAccessPoiLanguage, refreshEntitlement } =
    usePremium();
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const { showToast } = useToastOptional();
  const { addToCart } = useCartOptional();
  const currentLang = (lang as SupportedLanguage) || 'vi';
  const isLanguageLocked = !canAccessLanguage(currentLang);

  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleScrollSouvenir = (direction: 'left' | 'right') => {
    if (!souvenirCarouselRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    souvenirCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const triggerToast = useCallback(
    (msg: string) => {
      showToast(msg);
      setToastText(msg);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastText(null);
      }, 2500);
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

  const effectiveActiveId = activeId || selectedId || (sortedPois[0]?.poi.id ?? pois[0]?.id ?? null);

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
      const formattedD = formatDistance(nearest.dist, currentLang);
      const suffixHtml = t(currentLang, 'nearestSuffix', {
        name: getPoiName(nearest.poi),
        dist: formattedD,
      });
      return (
        <span>
          <span dangerouslySetInnerHTML={{ __html: suffixHtml }} />{' '}
          {isFar ? <span style={{ opacity: 0.85 }}>{t(currentLang, 'farNotice')}</span> : null}
        </span>
      );
    }
    return null;
  }, [gpsError, userPos, sortedPois, currentLang, getPoiName]);

  const scrollHeroIntoView = useCallback(() => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    if (rect.top < 64 || rect.top > window.innerHeight) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      heroRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, []);

  const handleExplicitSelectPoi = useCallback(
    (poiId: string, shouldScroll = false) => {
      setIsQrOpen(false);
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
        scrollHeroIntoView();
      }
    },
    [pois, scrollHeroIntoView]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stopParam = params.get('stop');
    const poiParam = params.get('poi');
    const numericParam = poiParam && /^\d+$/.test(poiParam) ? Number(poiParam) : null;

    const matched = stopParam
      ? pois.find((p) => p.slug === stopParam || p.id === stopParam)
      : numericParam !== null
        ? pois.find((p) => p.numericId === numericParam)
        : undefined;

    if (matched) {
      setSelectedId(matched.id);
      setActiveId(matched.id);
    }
  }, [pois]);

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


  const handleSelectSouvenir = useCallback((product: Product) => {
    navigate(`/am-thuc/${product.slug}`);
  }, [navigate]);

  const souvenirProducts = useNearbySouvenirs();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleAddSouvenirToCart = useCallback(
    (product: Product) => {
      if (!product.isActive) return;
      addToCart(product, 1);
      triggerToast(`Đã thêm ${product.name} vào giỏ hàng`);
      (window as unknown as { __pop?: () => void }).__pop?.();
    },
    [addToCart, triggerToast]
  );

  // Stepper timeline fill calculation
  const listenedIndices = useMemo(() => {
    return sortedPois
      .map((item, idx) => (listenedPoiIds.includes(item.poi.id) ? idx : -1))
      .filter((idx) => idx >= 0);
  }, [sortedPois, listenedPoiIds]);

  const maxListenedIndex = listenedIndices.length > 0 ? Math.max(...listenedIndices) : -1;
  const sfillWidth = maxListenedIndex >= 0 ? `${((maxListenedIndex + 1) / Math.max(1, sortedPois.length)) * 100}%` : '0%';

  const activeProgressPercent = duration && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

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
            <h1>
              {currentLang === 'vi' ? 'Bảy điểm dừng quanh trung tâm Sài Gòn' : t(currentLang, 'pageTitle')}
              {currentLang === 'vi' && <span className="sr-only">Điểm du lịch Sài Gòn</span>}
            </h1>
            <p>
              {currentLang === 'vi'
                ? 'Đeo tai nghe vào và đi. Mỗi điểm có một đoạn thuyết minh ngắn, nghe được bằng bốn ngôn ngữ. Bật tự động, máy sẽ phát khi bạn đến gần.'
                : t(currentLang, 'pageSubtitle')}
            </p>
          </div>
          <dl className="facts">
            <div>
              <dt>Quãng đường</dt>
              <dd>{approxDistance || 'Khoảng 14 km'}</dd>
            </div>
            <div>
              <dt>Tổng thời gian nghe</dt>
              <dd>14 phút</dd>
            </div>
            <div>
              <dt>Ngôn ngữ</dt>
              <dd>Việt, Anh, Nhật, Hàn</dd>
            </div>
            <div>
              <dt>Bạn đã nghe</dt>
              <dd id="heardTxt">
                {listenedPoiIds.length}/{pois.length}
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
            listenedCount={listenedPoiIds.length}
            currentLang={currentLang}
          />
        </div>

        {/* 2. STEPPER TIMELINE */}
        <div className="stripw">
          <div
            className="strip"
            id="strip"
            style={{ '--stop-count': sortedPois.length } as React.CSSProperties}
          >
            <i id="sfill" style={{ width: sfillWidth }} />
            {sortedPois.map((item, idx) => {
              const isItemActive = effectiveActiveId === item.poi.id;
              const isItemListened = listenedPoiIds.includes(item.poi.id);
              return (
                <button
                  key={item.poi.id}
                  type="button"
                  className={`sd ${isItemListened ? 'heard' : ''} ${isItemActive ? 'on' : ''}`}
                  onClick={() => handleExplicitSelectPoi(item.poi.id, true)}
                >
                  {item.stopNumber ?? idx + 1}. {getPoiName(item.poi)}
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
              selectedPoiId={selectedId}
              activePoiId={effectiveActiveId}
              hoveredPoiId={hoveredId}
              currentPlayingId={currentId}
              isPlaying={isPlaying}
              currentLang={currentLang}
              listenedPoiIds={listenedPoiIds}
              lockedPoiIds={lockedPoiIds}
              statusMessage={statusMessage}
              listTitle={t(currentLang, 'listTitle')}
              sortNoteText={userPos ? t(currentLang, 'sortNearest') : t(currentLang, 'sortTour')}
              activeSentenceIndex={activeSentenceIndex}
              duration={duration}
              details={
                activeSortedItem ? (
                  <>
                    {/* ACTIVE STOP HERO EXPANDED VIEW (image + lead + actions) */}
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
                        listenBtnText={t(currentLang, 'playBtn')}
                        pauseBtnText={t(currentLang, 'pauseBtn')}
                        resumeBtnText={t(currentLang, 'resumeBtn')}
                        getPoiName={getPoiName}
                        userPos={userPos}
                        heroRef={heroRef}
                        onOpenQr={() => setIsQrOpen(true)}
                        qrAvailable={isQrAvailable(activeSelectedPoi)}
                      />
                    )}

                    {/* FULL READING & STORY WITH WORD HIGHLIGHTING */}
                    <PoiReadingSection
                      activeItem={activeSortedItem}
                      currentLang={currentLang}
                      isContentLocked={
                        isPremiumLanguage(currentLang) &&
                        !canAccessPoiLanguage(
                          activeSortedItem.poi.numericId ?? activeSortedItem.poi.id,
                          currentLang
                        )
                      }
                      onUnlockContent={() => {
                        warnAndOpenPremium(activeSortedItem.poi);
                      }}
                      isPlaying={isPlaying}
                      isCurrent={currentId === activeSortedItem.poi.id}
                      playbackStatus={playbackStatus}
                      duration={duration}
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
              onSelectPoi={handleExplicitSelectPoi}
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
                listenedPoiIds={listenedPoiIds}
                onSelectPoi={(id) => handleExplicitSelectPoi(id, true)}
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

              <div className="tools">
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
                    triggerToast(
                      nextVal
                        ? 'Sẽ tự phát khi bạn đến gần một điểm'
                        : 'Đã tắt tự động phát'
                    );
                  }}
                  onRequestGps={() => {
                    setFlyToUserToken((n) => n + 1);
                    requestGps();
                    triggerToast('Đang xác định vị trí của bạn…');
                  }}
                  currentLang={currentLang}
                  isLocatingGps={isRequestingGps}
                  statusMessage={statusMessage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. HOW IT WORKS SECTION */}
        <section className="how">
          <div>
            <h3>Bấm nghe hoặc quét mã</h3>
            <p>Nghe ngay trên trang, hoặc quét QR để nghe trên điện thoại và đi tay không.</p>
          </div>
          <div>
            <h3>Để máy tự phát</h3>
            <p>Bật tự động phát, đi tới gần điểm nào thì thuyết minh điểm đó bắt đầu.</p>
          </div>
          <div>
            <h3>Nghe bằng tiếng của bạn</h3>
            <p>Tiếng Việt miễn phí. Tiếng Anh, Nhật, Hàn mở bằng gói Premium.</p>
          </div>
        </section>

        {/* 5. SOUVENIR SHOP SECTION */}
        <section className="shop" aria-labelledby="shopT">
          <div className="shop-head">
            <div>
              <h2 id="shopT">{t(currentLang, 'shopTitle')}</h2>
              <p>{t(currentLang, 'shopSub')}</p>
            </div>
            <div className="shop-head-actions">
              <div className="shop-carousel-arrows" aria-label="Điều hướng sản phẩm">
                <button
                  type="button"
                  className="shop-arrow-btn prev"
                  onClick={() => handleScrollSouvenir('left')}
                  aria-label="Xem sản phẩm trước"
                  title="Trước"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="shop-arrow-btn next"
                  onClick={() => handleScrollSouvenir('right')}
                  aria-label="Xem sản phẩm kế tiếp"
                  title="Kế tiếp"
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
        className={`pl player nearby-sticky-player-bar${hasAudioSession ? ' is-open' : ''}`}
        aria-label={t(currentLang, 'playerAriaLabel')}
      >
        <div
          className="bar"
          id="seek"
          role="slider"
          aria-label="Tiến trình"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(activeProgressPercent)}
          tabIndex={0}
        >
          <b id="fill" style={{ width: `${activeProgressPercent}%` }} />
        </div>

        <div className="wrap">
          <div className="now player-meta-block">
            <small id="nowSub" className={`player-status-sub ${noticeWarn ? 'warn is-warning' : ''}`}>
              {notice || (isPlaying
                ? `Đang phát - điểm ${(activeIndex >= 0 ? activeIndex : 0) + 1}/${pois.length}`
                : `Điểm ${(activeIndex >= 0 ? activeIndex : 0) + 1}/${pois.length}`)}
            </small>
            <strong id="nowName" className="player-poi-title">
              {activeSelectedPoi ? getPoiName(activeSelectedPoi) : 'Chọn một điểm để bắt đầu'}
            </strong>
          </div>

          <div className="ctl player-controls-mid">
            <button
              type="button"
              className="ib"
              id="prev"
              aria-label="Điểm trước"
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
                if (activeSelectedPoi) {
                  handleTogglePlayPoi(activeSelectedPoi.id);
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
              aria-label="Điểm sau"
              disabled={!nextItem}
              onClick={() => nextItem && handleExplicitSelectPoi(nextItem.poi.id, true)}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>

            <span className="tm" id="tm">
              {fmtTime(currentTime)} / {fmtTime(duration || 120)}
            </span>
          </div>

          <div className="lang" id="lang">
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isLocked = canAccessPoiLanguage
                ? !canAccessPoiLanguage(activeSelectedPoi?.numericId ?? activeSelectedPoi?.id, opt.code)
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
                      triggerToast('Ngôn ngữ này cần gói Premium');
                      warnAndOpenPremium(activeSelectedPoi, opt.code);
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

      {isQrOpen && activeSelectedPoi && (
        <PoiQrDialog
          poi={activeSelectedPoi}
          currentLang={currentLang}
          getPoiName={getPoiName}
          onClose={() => setIsQrOpen(false)}
        />
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      <div className={`toast ${toastText ? 'show' : ''}`} id="toast" role="status">
        {toastText}
      </div>
    </div>
  );
};

export default NearbyPage;
