import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import nearbyPoisData from '../content/nearbyPois.json';
import { useNavbarLanguage, SUPPORTED_LANGUAGES } from '../content/languages';
import { SupportedLanguage } from '../types';
import { useAutoNarration, haversine } from '../hooks/useAutoNarration';
import { useNearbyAudio, splitTranscriptIntoSentences } from '../hooks/useNearbyAudio';
import { unlockAudio } from '../lib/audioUnlock';
import { t, formatDistance, NEARBY_DICTIONARY } from '../content/nearbyI18n';
import { useToastOptional } from '../context/ToastContext';

// Components
import { PoiHeader } from '../components/nearby/PoiHeader';
import { ToolbarControls } from '../components/nearby/ToolbarControls';
import { PoiMap } from '../components/nearby/PoiMap';
import { PoiList } from '../components/nearby/PoiList';
import { PoiHero } from '../components/nearby/PoiHero';
import { PoiReadingSection } from '../components/nearby/PoiReadingSection';
import { AudioPlayerBar } from '../components/nearby/AudioPlayerBar';
import { PageHero } from '../components/common/PageHero';
import { HERO_CONFIG } from '../config/heroImages';
import '../styles/nearby.css';

export interface NarrationData {
  short: Partial<Record<SupportedLanguage, string>>;
  full: Partial<Record<SupportedLanguage, string[]>>;
}

export interface GeoPoi {
  id: string;
  qrToken?: string | null;
  name: Record<SupportedLanguage, string>;
  lat: number;
  lng: number;
  triggerRadius: number;
  category: Record<SupportedLanguage, string>;
  image: string;
  audio: Record<SupportedLanguage, string | number>;
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
  if (sentences.length === 0) return shortText;
  return sentences.slice(0, 2).map((s) => s.sentence).join(' ');
}

export { NEARBY_DICTIONARY };

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
  const currentLang = (lang as SupportedLanguage) || 'vi';

  // Synchronize document.documentElement.lang with the single source of truth
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Read slug from data; fall back to a slugified id only if missing
  const pois: GeoPoi[] = useMemo(() => {
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
  }, []);

  // Toolbar & map states
  const [radius, setRadius] = useState<number>(50);
  const [overrideRadius, setOverrideRadius] = useState<number | null>(null);
  const [isSimMode, setIsSimMode] = useState<boolean>(false);
  const [simStopId, setSimStopId] = useState<string | null>(null);
  // Increments on every "Vị trí của tôi" press so the map auto-centers exactly once per press
  const [flyToUserToken, setFlyToUserToken] = useState<number>(0);
  const gpsToastShownRef = useRef<boolean>(false);
  const { showToast } = useToastOptional();
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Journey progress tracking persisted in localStorage
  const [listenedPoiIds, setListenedPoiIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('saigonvoice_listened_pois');
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
        localStorage.setItem('saigonvoice_listened_pois', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    setListenedPoiIds([]);
    try {
      localStorage.removeItem('saigonvoice_listened_pois');
    } catch {
      // Ignore
    }
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
    return formatDistance(sum, currentLang);
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
    speed,
    showTranscript,
    notice,
    noticeWarn,
    audioSourceType,
    isHtml5Audio,
    activeSentenceIndex,
    activeCharOffset,
    activeCharLength,
    syncMode,
    resolveAudio,
    playPoi,
    togglePlay,
    changeSpeed,
    seekTime,
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
    applySimulatedPosition,
  } = useAutoNarration({
    pois,
    isAutoEnabled,
    currentPlayingId: currentId,
    isPlaying,
    isLoading,
    lastManualStoppedId,
    lastManualStopTime,
    playPoi: (poiId, isAuto) => {
      setSelectedId(poiId);
      setActiveId(poiId);
      playPoi(poiId, isAuto);
    },
    stopAllAudio,
    gpsErrorMessage: t(currentLang, 'gpsErrorGeneric'),
    gpsErrorDeniedText: t(currentLang, 'gpsErrorDenied'),
    gpsErrorUnavailableText: t(currentLang, 'gpsErrorUnavailable'),
    gpsErrorTimeoutText: t(currentLang, 'gpsErrorTimeout'),
    gpsErrorSimActiveText: t(currentLang, 'gpsErrorSimActive'),
    gpsErrorNotSupportedText: t(currentLang, 'gpsErrorNotSupported'),
    gpsErrorInsecureText: t(currentLang, 'gpsErrorInsecure'),
    overrideRadius,
    isSimMode,
  });

  // Manual location simulation: pick a preset stop or enter raw coordinates.
  const simStops = useMemo(
    () => pois.map((p) => ({ id: p.id, name: p.name[currentLang] || p.name.vi })),
    [pois, currentLang]
  );

  const handlePickSimStop = useCallback(
    (id: string) => {
      const poi = pois.find((p) => p.id === id);
      if (!poi) return;
      setSimStopId(id);
      setIsSimMode(true);
      applySimulatedPosition(poi.lat, poi.lng);
      setSelectedId(id);
      setActiveId(id);
    },
    [pois, applySimulatedPosition]
  );

  const handleApplySimCoords = useCallback(
    (lat: number, lng: number) => {
      setSimStopId(null);
      setIsSimMode(true);
      applySimulatedPosition(lat, lng);
    },
    [applySimulatedPosition]
  );

  const handleStopSim = useCallback(() => {
    setIsSimMode(false);
    setSimStopId(null);
  }, []);

  // One-time toast the first time a real GPS fix lands. Later watch updates
  // (same source 'gps') must not re-trigger it.
  useEffect(() => {
    if (!userPos || userPos.source !== 'gps') return;
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

  // Calculate sorted POIs (Closest first if userPos exists; otherwise tour order by stopOrder)
  const sortedPois = useMemo(() => {
    const list = pois.map((p, index) => {
      const dist = userPos ? haversine(userPos.lat, userPos.lng, p.lat, p.lng) : null;
      return { poi: p, originalIndex: index, dist };
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
  }, [pois, userPos]);

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

  // Initial load check: if ?stop=<slug> is present, activate that stop
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stopParam = params.get('stop');
    if (stopParam) {
      const matched = pois.find((p) => p.slug === stopParam || p.id === stopParam);
      if (matched) {
        setSelectedId(matched.id);
        setActiveId(matched.id);
      }
    }
  }, [pois]);

  const handleTogglePlayPoi = useCallback(
    (poiId: string) => {
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
    [currentId, togglePlay, playPoi]
  );

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
        radiusLabelText={t(currentLang, 'radiusLabel')}
        isAutoEnabled={isAutoEnabled}
        onToggleAuto={() => {
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
        radius={radius}
        overrideRadius={overrideRadius}
        onChangeOverrideRadius={setOverrideRadius}
        onChangeRadius={setRadius}
        isSimMode={isSimMode}
        isLocatingGps={isRequestingGps}
        simStops={simStops}
        activeSimStopId={simStopId}
        onPickSimStop={handlePickSimStop}
        onApplySimCoords={handleApplySimCoords}
        onStopSim={handleStopSim}
        listenedCount={listenedPoiIds.length}
        stopsCount={pois.length}
        onResetProgress={handleResetProgress}
        statusMessage={
          isAutoEnabled
            ? userPos && sortedPois[0]
              ? t(currentLang, 'statusNearestSummary', {
                  name: getPoiName(sortedPois[0].poi),
                  dist: formatDistance(sortedPois[0].dist ?? 0, currentLang),
                })
              : t(currentLang, 'statusTrackingGps')
            : isSimMode
            ? t(currentLang, 'statusSimActive')
            : null
        }
      />

      {/* 3. MAIN WORKSPACE (IZI.TRAVEL INSPIRED TOP-TO-BOTTOM ARCHITECTURE) */}
      <main className="nearby-main-container">
        {/* HERO FOR ACTIVE STOP */}
        {activeSelectedPoi && (
          <PoiHero
            poi={activeSelectedPoi}
            originalIndex={activeSortedItem?.originalIndex ?? 0}
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
            heroRef={heroRef}
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
              radius={overrideRadius != null ? overrideRadius : (activeSelectedPoi?.triggerRadius ?? 60)}
              overrideRadius={overrideRadius}
              listenedPoiIds={listenedPoiIds}
              statusMessage={statusMessage}
              listTitle={t(currentLang, 'listTitle')}
              sortNoteText={userPos ? t(currentLang, 'sortNearest') : t(currentLang, 'sortTour')}
              activeSentenceIndex={activeSentenceIndex}
              duration={duration}
              onSelectPoi={handleExplicitSelectPoi}
              onHoverPoi={setHoveredId}
              onTogglePlay={handleTogglePlayPoi}
              onChangeLanguage={changeLanguage}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              inZoneBadgeText={t(currentLang, 'inZoneBadge')}
              nearBadgeText={t(currentLang, 'nearBadge')}
              distFormatText={distFormatText}
              langVoiceAriaText={t(currentLang, 'langVoiceAria')}
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
              radius={overrideRadius != null ? overrideRadius : (activeSelectedPoi?.triggerRadius ?? 60)}
              isAutoEnabled={isAutoEnabled}
              isSimMode={isSimMode}
              onToggleSimMode={handleStopSim}
              onSetSimulatedPosition={handleApplySimCoords}
              listenedPoiIds={listenedPoiIds}
              onSelectPoi={handleExplicitSelectPoi}
              onHoverPoi={setHoveredId}
              onTogglePlay={handleTogglePlayPoi}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              listenBtnText={t(currentLang, 'playBtn')}
              pauseBtnText={t(currentLang, 'pauseBtn')}
              resumeBtnText={t(currentLang, 'resumeBtn')}
              radiusLabelText={t(currentLang, 'radiusLabel')}
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
      </main>

      {/* 4. PERSISTENT MINI AUDIO PLAYER */}
      {isPlayerActive && (
        <AudioPlayerBar
          activePoi={activeSelectedPoi}
          currentLang={currentLang}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          speed={speed}
          showTranscript={showTranscript}
          notice={notice}
          noticeWarn={noticeWarn}
          isHtml5Audio={isHtml5Audio}
          onTogglePlay={togglePlay}
          onSeek={seekTime}
          onChangeSpeed={changeSpeed}
          onViewChapterTranscript={handleViewChapterTranscript}
          resolveAudio={resolveAudio}
          getPoiName={getPoiName}
          noPoiSelectedText={t(currentLang, 'noPoiSelected')}
          playingInLangText={(l) => t(currentLang, 'playingInLang', { lang: l })}
          pausedStatusText={t(currentLang, 'pausedStatus')}
          clickToStartText={t(currentLang, 'clickToStart')}
          speedLabelText={t(currentLang, 'speedLabel')}
          viewTextBtnText={t(currentLang, 'viewTranscriptBtn')}
          fallbackTxNoticeText={(l) => t(currentLang, 'fallbackTxNotice', { lang: l })}
        />
      )}
    </div>
  );
};

export default NearbyPage;

