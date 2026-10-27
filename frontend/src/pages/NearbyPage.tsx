/**
 * ============================================================================
 * TRANG TOUR DI SẢN QUANH ĐÂY & THUYẾT MINH ÂM THANH (Nearby Heritage Tour)
 * ============================================================================
 * 
 * Mục đích module:
 * - Trải nghiệm tour tham quan di sản Sài Gòn qua bản đồ tương tác và định vị GPS.
 * - Tự động phát thuyết minh audio khi du khách tiến vào bán kính kích hoạt (`triggerRadius`).
 * - Hỗ trợ đọc thuyết minh đa ngôn ngữ (VI, EN, JA, KO) với đồng bộ từ theo giọng đọc.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Khóa / Mở khóa ngoại ngữ]: Kiểm tra `canAccessPoiLanguage(poi.numericId ?? poi.id, currentLang)`
 *    ở cả 4 vị trí: danh sách POI bị khóa, phát audio tự động, bấm nút Play thủ công, và khối nội dung đọc.
 * 2. [Hỗ trợ mua lẻ POI]: Nếu chưa mở khóa gói Premium toàn phần, tự động dẫn đến trang thanh toán gói lẻ
 *    của chính điểm đó (`buildPoiPremiumPath`) thay vì ép mua gói tài khoản đầy đủ.
 * 3. [Tích hợp âm thanh]: Kết nối với `poiGuideAdapter` và `nearbyPois.json` để bảo đảm luôn có
 *    file âm thanh thuyết minh chất lượng cao cho cả 4 ngôn ngữ.
 * ============================================================================
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import nearbyPoisData from '../content/nearbyPois.json';
import { api } from '../api/client';
import { mapGuidesToGeoPois } from '../content/poiGuideAdapter';
import { useNavbarLanguage, SUPPORTED_LANGUAGES } from '../content/languages';
import { useToastOptional } from '../context/ToastContext';
import { usePremium, buildPremiumPath, buildPoiPremiumPath, isPremiumLanguage, normalizePoiId } from '../context/PremiumContext';
import { useAuthOptional } from '../context/AuthContext';
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
import { SouvenirStrip } from '../components/souvenir/SouvenirStrip';
import { AudioPlayerBar } from '../components/nearby/AudioPlayerBar';
import { PageHero } from '../components/common/PageHero';
import { HERO_CONFIG } from '../config/heroImages';
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
  /** Id DB của POI (để kiểm tra gói mua lẻ theo điểm). */
  numericId?: number | null;
  /** Giá mua lẻ gói ngoại ngữ của POI này (null = dùng giá mặc định). */
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

  // The arrival narration opens with "Bạn đang đứng trước ..." / "You are standing
  // in front of ...". Keep that phrase for the audio, but not in the hero copy.
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

if (import.meta.env.DEV && typeof window !== 'undefined') {
  if (!(window as any).__nearbyPerf) {
    (window as any).__nearbyPerf = {
      rendersNearbyPage: 0,
      rendersPoiList: 0,
      rendersPoiCard: 0,
      flyToCalls: 0,
      invalidateSizeCalls: 0,
      headerHeightChanges: 0,
    };
  }
}

export const NearbyPage: React.FC = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
    (window as any).__nearbyPerf.rendersNearbyPage++;
  }

  const { lang, changeLanguage } = useNavbarLanguage();
  const navigate = useNavigate();
  const { canAccessLanguage, canAccessPoi, canAccessPoiLanguage, refreshEntitlement } =
    usePremium();
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const { showToast } = useToastOptional();
  const currentLang = (lang as SupportedLanguage) || 'vi';
  const isLanguageLocked = !canAccessLanguage(currentLang);

  const openPremiumForLanguage = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    navigate(buildPremiumPath(currentLang, returnTo));
  }, [currentLang, navigate]);

  // Cảnh báo khóa ngoại ngữ: nếu POI chưa được mở (hoặc mở riêng) thì dẫn tới gói
  // mua lẻ cho chính điểm đó, ngược lại về trang nâng cấp Premium toàn cục.
  const warnAndOpenPremium = useCallback(
    (poi?: GeoPoi | null, targetLang?: SupportedLanguage) => {
      const langToCheck = targetLang || currentLang;
      showToast(PREMIUM_GATE_COPY[langToCheck]?.warning || PREMIUM_GATE_COPY[currentLang].warning);
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
    [currentLang, canAccessPoi, navigate, showToast]
  );

  // Synchronize document language and title with the single source of truth
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.title = t(currentLang, 'pageTitle');
  }, [currentLang]);

  // Quyền mua lẻ/Premium có thể được cấp bất đồng bộ sau khi thanh toán xong.
  // Làm mới entitlement mỗi lần vào trang để không hiển thị khóa sai.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (!isAuthenticated) return;
    void refreshEntitlement();
  }, [isAuthenticated, refreshEntitlement]);

  // Khi quay lại từ cổng thanh toán VNPAY: invalidate và cập nhật quyền ngay lập tức
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

  // Nguồn dữ liệu: API/DB (nguồn chung với admin). Nếu API lỗi, rơi về file tĩnh cũ.
  const [apiPois, setApiPois] = useState<GeoPoi[] | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPoiGuides !== 'function') return;
    let cancelled = false;
    api
      .getPoiGuides()
      .then((guides) => {
        if (!cancelled && guides.length > 0) {
          setApiPois(mapGuidesToGeoPois(guides));
        }
      })
      .catch(() => {
        // Giữ nguyên nguồn tĩnh nếu API không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Read slug from data; fall back to a slugified id only if missing
  const pois: GeoPoi[] = useMemo(() => {
    if (apiPois && apiPois.length > 0) return apiPois;
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

  // Toolbar & map states
  const radius = 50;
  // Increments on every "Vị trí của tôi" press so the map auto-centers exactly once per press
  const [flyToUserToken, setFlyToUserToken] = useState<number>(0);
  const gpsToastShownRef = useRef<boolean>(false);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Journey progress tracking persisted in localStorage
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

  const isPlayerActiveRef = useRef<boolean>(false);

  // Measure static base heights once at mount and on window resize without any per-frame scroll listener
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const updateBaseSizes = () => {
      if (!rootEl) return;
      if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
        (window as any).__nearbyPerf.headerHeightChanges++;
      }
      const headerEl = document.querySelector('header.hd') as HTMLElement | null;
      const controlBarEl = document.querySelector('.nearby-sticky-controlbar') as HTMLElement | null;

      if (headerEl) {
        const baseH = Math.round(headerEl.getBoundingClientRect().height);
        if (baseH > 0) {
          rootEl.style.setProperty('--header-base-height', `${baseH}px`);
        }
      }
      if (controlBarEl) {
        const ctrlH = Math.round(controlBarEl.getBoundingClientRect().height);
        if (ctrlH > 0) {
          rootEl.style.setProperty('--ctrl-bar-height', `${ctrlH}px`);
        }
      }
    };

    updateBaseSizes();
    window.addEventListener('resize', updateBaseSizes, { passive: true });
    return () => {
      window.removeEventListener('resize', updateBaseSizes);
    };
  }, []);

  // Helper getters
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

  // Derived tour statistics formatted via Intl
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

  // Audio Hook with adaptive playback hierarchy & sentence highlighting
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

  // Single source of truth for the paused state, shared by every play button
  const isPaused = playbackStatus === 'paused';

  // Auto Narration & GPS Hook
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
        showToast(PREMIUM_GATE_COPY[currentLang].warning);
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

  // One-time toast the first time a GPS fix lands. Later watch updates
  // must not re-trigger it.
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
    showToast(
      t(currentLang, 'gpsLocatedToast', {
        name: getPoiName(nearest),
        dist: formatDistance(nearestDist, currentLang),
      })
    );
  }, [userPos, pois, currentLang, getPoiName, showToast]);

  // Stable 1..N tour numbers, independent of the current sort mode (nearest or tour).
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

  // Calculate sorted POIs (Closest first if userPos exists; otherwise tour order by stopOrder)
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

  // Effective active stop ID: falls back to the first stop so that Stop 1 is active on initial load
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

  // Active playing or selected POI
  const activeSelectedPoi = useMemo(
    () => activeSortedItem?.poi || pois.find((p) => p.id === (currentId || selectedId || activeId || effectiveActiveId)) || null,
    [activeSortedItem, pois, currentId, selectedId, activeId, effectiveActiveId]
  );

  const isPlayerActive = Boolean(activeSelectedPoi && (isPlaying || currentTime > 0 || notice));

  useEffect(() => {
    isPlayerActiveRef.current = isPlayerActive;
    const rootEl = rootRef.current;
    if (rootEl) {
      const playerBarEl = document.querySelector('.nearby-sticky-player-bar') as HTMLElement | null;
      const h = isPlayerActive
        ? Math.round(playerBarEl ? playerBarEl.getBoundingClientRect().height : 72)
        : 0;
      rootEl.style.setProperty('--player-bar-height', `${h}px`);
    }
  }, [isPlayerActive]);

  // Single Status message for list header
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

  // Scroll hero into view below sticky header on manual stop selection if outside viewport
  const scrollHeroIntoView = useCallback(() => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const headerEl = document.querySelector('header.hd') as HTMLElement | null;
    const ctrlBarEl = document.querySelector('.nearby-sticky-controlbar') as HTMLElement | null;
    const headerOffset =
      (headerEl?.getBoundingClientRect().height || 64) +
      (ctrlBarEl?.getBoundingClientRect().height || 44);

    if (rect.top < headerOffset || rect.top > window.innerHeight) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      heroRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Explicit selection: updates active stop, writes ?stop=<slug> via history.replaceState, and scrolls hero into view
  const handleExplicitSelectPoi = useCallback(
    (poiId: string) => {
      setSelectedId(poiId);
      setActiveId(poiId);

      const targetPoi = pois.find((p) => p.id === poiId);
      if (targetPoi) {
        const slug = targetPoi.slug || targetPoi.id;
        const url = new URL(window.location.href);
        url.searchParams.set('stop', slug);
        window.history.replaceState(null, '', url.toString());
      }

      scrollHeroIntoView();
    },
    [pois, scrollHeroIntoView]
  );

  // View chapter transcript link from player bar: selects stop and scrolls into view
  const handleViewChapterTranscript = useCallback(
    (poiId: string) => {
      handleExplicitSelectPoi(poiId);
    },
    [handleExplicitSelectPoi]
  );

  // Initial load check: ?stop=<slug> (deep link) hoặc ?poi=<id DB> (sau thanh toán).
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
      // Must run synchronously inside the tap gesture, before any async work.
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

  // Auto-narration status line: always reflects the real configured radius and state.
  const autoStatusMessage = useMemo(() => {
    const configuredRadius = (() => {
      const radii = pois.map((p) => p.triggerRadius).filter((value) => value > 0);
      if (radii.length === 0) return formatDistance(radius, currentLang);
      const min = Math.min(...radii);
      const max = Math.max(...radii);
      return min === max
        ? formatDistance(min, currentLang)
        : `${formatDistance(min, currentLang)} - ${formatDistance(max, currentLang)}`;
    })();

    if (!isAutoEnabled) return t(currentLang, 'autoStatusOff');

    const nearest = sortedPois[0];
    if (userPos && nearest && nearest.dist != null) {
      return t(currentLang, 'autoStatusTracking', {
        radius: configuredRadius,
        name: getPoiName(nearest.poi),
        dist: formatDistance(nearest.dist, currentLang),
      });
    }
    if (gpsError) return gpsError;
    return t(currentLang, 'autoStatusWaiting', { radius: configuredRadius });
  }, [
    currentLang,
    getPoiName,
    gpsError,
    isAutoEnabled,
    pois,
    radius,
    sortedPois,
    userPos,
  ]);

  return (
    <div className="nearby-sv-root" ref={rootRef}>
      {/* 1. FULL-BLEED PHOTO HERO BANNER */}
      <PageHero
        eyebrow={t(currentLang, 'heroEyebrow')}
        title={t(currentLang, 'pageTitle')}
        subtitle={t(currentLang, 'pageSubtitle')}
        imageSrc={HERO_CONFIG.diemDuLich.src}
        imageSrcMobile={HERO_CONFIG.diemDuLich.srcMobile}
        imagePosition={HERO_CONFIG.diemDuLich.position}
        imageCredit={HERO_CONFIG.diemDuLich.credit}
      />

      {/* 2. STATS CHIPS UNDER HERO */}
      {isLanguageLocked && (
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
      )}

      <PoiHeader
        stopsCount={pois.length}
        languagesCount={languagesCount}
        approxDistance={approxDistance}
        listenedCount={listenedPoiIds.length}
        currentLang={currentLang}
      />

      {/* 3. STICKY CONTROL BAR UNDER HEADER */}
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
          // Must run synchronously inside the tap gesture, before any async work.
          unlockAudio();
          const nextVal = !isAutoEnabled;
          setIsAutoEnabled(nextVal);
          setAutoDirect(nextVal);
          if (nextVal && userPos) {
            checkAutoTrigger(userPos.lat, userPos.lng);
          }
        }}
        onRequestGps={() => {
          // One fly-to per press; the token is consumed by the map on first fix
          setFlyToUserToken((n) => n + 1);
          requestGps();
        }}
        currentLang={currentLang}
        isLocatingGps={isRequestingGps}
        statusMessage={autoStatusMessage}
      />

      {/* 3. MAIN WORKSPACE (IZI.TRAVEL INSPIRED TOP-TO-BOTTOM ARCHITECTURE) */}
      <main className="nearby-main-container">
        {/* HERO FOR ACTIVE STOP */}
        {activeSelectedPoi && (
          <PoiHero
            poi={activeSelectedPoi}
            originalIndex={activeSortedItem?.originalIndex ?? 0}
            stopNumber={activeSortedItem?.stopNumber ?? 1}
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
            onChangeLanguage={changeLanguage}
            onUnlockLanguage={warnAndOpenPremium}
            canAccessPoiLanguage={canAccessPoiLanguage}
          />
        )}

        {/* STOP LIST + MAP ROW */}
        <div className="nearby-stops-map-row">
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

          <div className="nearby-map-column" aria-label={t(currentLang, 'mapAriaLabel')}>
            <PoiMap
              pois={pois}
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
              onSelectPoi={handleExplicitSelectPoi}
              onHoverPoi={setHoveredId}
              onTogglePlay={handleTogglePlayPoi}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              listenBtnText={t(currentLang, 'playBtn')}
              pauseBtnText={t(currentLang, 'pauseBtn')}
              resumeBtnText={t(currentLang, 'resumeBtn')}
              mapCaptionText={t(currentLang, 'mapCaption')}
              currentLang={currentLang}
            />
          </div>
        </div>

        {/* READING SECTION */}
        {activeSortedItem && (
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
            onTogglePlay={handleTogglePlayPoi}
            getPoiName={getPoiName}
            listenBtnText={t(currentLang, 'playBtn')}
            pauseBtnText={t(currentLang, 'pauseBtn')}
            resumeBtnText={t(currentLang, 'resumeBtn')}
            formattedDist={
              activeSortedItem.dist != null
                ? formatDistance(activeSortedItem.dist, currentLang)
                : null
            }
          />
        )}

        {/* SOUVENIRS AVAILABLE AT THE ACTIVE STOP */}
        {activeSortedItem?.poi.slug && (
          <SouvenirStrip poiSlug={activeSortedItem.poi.slug} lang={currentLang} />
        )}
      </main>

      {/* 4. PERSISTENT MINI AUDIO PLAYER */}
      {isPlayerActive && (
        <AudioPlayerBar
          activePoi={activeSelectedPoi}
          currentLang={currentLang}
          isPlaying={isPlaying}
          currentTime={currentTime}
          notice={notice}
          noticeWarn={noticeWarn}
          onTogglePlay={() => {
            const playedPoi = getPoiByPlaybackId(currentId);
            if (
              isPremiumLanguage(currentLang) &&
              !canAccessPoiLanguage(playedPoi?.numericId ?? null, currentLang)
            ) {
              warnAndOpenPremium(playedPoi);
              return;
            }
            togglePlay();
          }}
          onViewChapterTranscript={handleViewChapterTranscript}
          getPoiName={getPoiName}
          noPoiSelectedText={t(currentLang, 'noPoiSelected')}
          playingInLangText={(l) => t(currentLang, 'playingInLang', { lang: l })}
          pausedStatusText={t(currentLang, 'pausedStatus')}
          clickToStartText={t(currentLang, 'clickToStart')}
          viewTextBtnText={t(currentLang, 'viewTranscriptBtn')}
        />
      )}
    </div>
  );
};

export default NearbyPage;

