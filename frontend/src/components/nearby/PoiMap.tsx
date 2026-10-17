import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SupportedLanguage } from '../../types';
import { GeoPoi } from '../../pages/NearbyPage';
import { PositionState, haversine } from '../../hooks/useAutoNarration';
import { resolveImagePath } from './PoiCard';
import { t, formatDistance } from '../../content/nearbyI18n';

interface MapControllerProps {
  pois: GeoPoi[];
  activePoi: GeoPoi | null;
  isInitialMount: boolean;
  onInitialFitDone: () => void;
}

const MapController: React.FC<MapControllerProps> = ({
  pois,
  activePoi,
  isInitialMount,
  onInitialFitDone,
}) => {
  const map = useMap();
  const lastActiveIdRef = useRef<string | null>(null);
  const flyToTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const pendingActivePoiRef = useRef<GeoPoi | null>(null);

  // DEV-only startup log line: map size
  useEffect(() => {
    if (import.meta.env.DEV) {
      const size = typeof map?.getSize === 'function' ? map.getSize() : { x: 0, y: 0 };
      console.log(`[PoiMap DEV Startup] Map size: ${size.x}x${size.y}`);
    }
  }, [map]);

  const executeFlyTo = useCallback(
    (targetPoi: GeoPoi) => {
      if (!targetPoi || targetPoi.id === lastActiveIdRef.current) return;
      lastActiveIdRef.current = targetPoi.id;
      pendingActivePoiRef.current = null;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      try {
        map.stop();
        if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
          (window as any).__nearbyPerf.flyToCalls++;
        }
        if (prefersReduced) {
          map.setView([targetPoi.lat, targetPoi.lng], 16);
        } else {
          (map.flyTo as any)([targetPoi.lat, targetPoi.lng], 16, {
            duration: 0.8,
            paddingBottomRight: [0, 95],
          });
        }
      } catch {
        // Ignore flyTo interrupts
      }
    },
    [map]
  );

  // Passive window scroll listener to track user in-progress scroll state
  useEffect(() => {
    const handleWindowScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      scrollTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        // Scroll has settled: execute any deferred flyTo if chapter changed
        const pending = pendingActivePoiRef.current;
        if (pending && pending.id !== lastActiveIdRef.current) {
          executeFlyTo(pending);
        }
      }, 200);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [executeFlyTo]);

  // Invalidate size ONLY on container resize via ResizeObserver, NEVER during window scroll
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        // Skip invalidateSize while user is actively scrolling to prevent layout thrashing
        if (isScrollingRef.current) return;
        if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
          (window as any).__nearbyPerf.invalidateSizeCalls++;
        }
        map.invalidateSize();
      });
      const container = map.getContainer?.();
      if (container) {
        ro.observe(container);
      }
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
    };
  }, [map]);

  // Initial bounds: fit to tour stops if no active poi initially
  useEffect(() => {
    if (isInitialMount && pois.length > 0) {
      if (activePoi) {
        if (typeof map?.setView === 'function') {
          map.setView([activePoi.lat, activePoi.lng], 16);
        }
      } else {
        try {
          if (typeof map?.fitBounds === 'function') {
            const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
          }
        } catch {
          // Ignore
        }
      }
      onInitialFitDone();
    }
  }, [isInitialMount, pois, activePoi, map, onInitialFitDone]);

  // Task 3: Active chapter change: map.flyTo is debounced ~200 ms and NEVER fires during an active scroll frame
  useEffect(() => {
    if (!activePoi || activePoi.id === lastActiveIdRef.current) return;
    pendingActivePoiRef.current = activePoi;

    if (flyToTimerRef.current) {
      clearTimeout(flyToTimerRef.current);
      flyToTimerRef.current = null;
    }

    flyToTimerRef.current = setTimeout(() => {
      // If user is currently scrolling, defer flyTo until scroll settles
      if (!isScrollingRef.current) {
        executeFlyTo(activePoi);
      }
    }, 200);

    return () => {
      if (flyToTimerRef.current) {
        clearTimeout(flyToTimerRef.current);
        flyToTimerRef.current = null;
      }
    };
  }, [activePoi, executeFlyTo]);

  return null;
};

// Top-right stacked 40px round white buttons with soft shadow
interface FloatingMapControlsProps {
  pois: GeoPoi[];
  userPos: PositionState | null;
  currentLang: SupportedLanguage;
}

const FloatingMapControls: React.FC<FloatingMapControlsProps> = ({
  pois,
  userPos,
  currentLang,
}) => {
  const map = useMap();

  const handleLocateUser = () => {
    if (userPos) {
      try {
        map.stop();
        (map.flyTo as any)([userPos.lat, userPos.lng], 16, { duration: 0.8 });
      } catch {
        map.setView([userPos.lat, userPos.lng], 16);
      }
    }
  };

  const handleFitTour = () => {
    if (pois.length > 0) {
      try {
        const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
        map.stop();
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        // Ignore
      }
    }
  };

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div
      className="nearby-map-floating-stack"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 500,
      }}
    >
      {/* 1. Locate Me */}
      <button
        type="button"
        className="map-round-btn map-btn-locate"
        onClick={handleLocateUser}
        disabled={!userPos}
        title={userPos ? t(currentLang, 'mapLocateBtnTitle') : t(currentLang, 'mapLocateBtnNoGps')}
        aria-label={t(currentLang, 'mapLocateBtnAria')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </button>

      {/* 2. Fit Entire Tour */}
      <button
        type="button"
        className="map-round-btn map-btn-fit"
        onClick={handleFitTour}
        title={t(currentLang, 'mapFitTourTitle')}
        aria-label={t(currentLang, 'mapFitTourTitle')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>

      {/* 3. Zoom In */}
      <button
        type="button"
        className="map-round-btn map-btn-zoom-in"
        onClick={handleZoomIn}
        title={t(currentLang, 'mapZoomIn')}
        aria-label={t(currentLang, 'mapZoomIn')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* 4. Zoom Out */}
      <button
        type="button"
        className="map-round-btn map-btn-zoom-out"
        onClick={handleZoomOut}
        title={t(currentLang, 'mapZoomOut')}
        aria-label={t(currentLang, 'mapZoomOut')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

// Map click listener for simulation mode
interface MapClickHandlerProps {
  isSimMode: boolean;
  onSetSimulatedPosition?: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  isSimMode,
  onSetSimulatedPosition,
}) => {
  useMapEvents({
    click(e) {
      if (isSimMode && onSetSimulatedPosition) {
        onSetSimulatedPosition(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

import {
  TileProviderConfig,
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  getTileProviders,
  getInitialProviderIndex,
  saveWorkingProvider,
  STORAGE_KEY_WORKING_PROVIDER,
} from '../../config/tileProviders';

export type { TileProviderConfig };
export {
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  getTileProviders,
  getInitialProviderIndex,
  saveWorkingProvider,
  STORAGE_KEY_WORKING_PROVIDER,
};

export interface OsmTileLayerProps {
  isSchematic: boolean;
  onEnterSchematic: () => void;
  onExitSchematic: () => void;
  retryTrigger: number;
  tileLayerRef?: React.MutableRefObject<L.TileLayer | null>;
  providers?: TileProviderConfig[];
}

export const OsmTileLayer: React.FC<OsmTileLayerProps> = ({
  isSchematic: _isSchematic,
  onEnterSchematic,
  onExitSchematic,
  retryTrigger,
  tileLayerRef: externalTileLayerRef,
  providers: customProviders,
}) => {
  const map = useMap();
  const internalTileLayerRef = useRef<L.TileLayer | null>(null);
  const tileLayerRef = externalTileLayerRef || internalTileLayerRef;
  const providers = customProviders && customProviders.length > 0 ? customProviders : TILE_PROVIDERS;

  // Start from remembered working provider in sessionStorage if valid; otherwise index 0
  const [providerIndex, setProviderIndex] = useState<number>(() =>
    getInitialProviderIndex(providers)
  );
  const consecutiveErrorsRef = useRef<number>(0);
  const lastRetryRef = useRef<number>(retryTrigger);

  // Set Leaflet attribution prefix to false so only the OSM attribution shows
  useEffect(() => {
    if (map.attributionControl) {
      map.attributionControl.setPrefix(false);
    }
  }, [map]);

  // "Thử lại" restarts the chain from the first provider
  useEffect(() => {
    if (retryTrigger !== lastRetryRef.current) {
      lastRetryRef.current = retryTrigger;
      consecutiveErrorsRef.current = 0;
      setProviderIndex(0);
      onExitSchematic();
    }
  }, [retryTrigger, onExitSchematic]);

  useEffect(() => {
    const currentProvider: TileProviderConfig =
      providers[providerIndex] ?? providers[0] ?? KNOWN_TILE_PROVIDERS.osm;
    const layerOptions: L.TileLayerOptions = {
      maxZoom: currentProvider.maxZoom ?? 19,
      referrerPolicy: currentProvider.referrerPolicy,
      attribution: `${currentProvider.attribution} &bull; <small class="map-provider-tag">${currentProvider.name}</small>`,
      subdomains: currentProvider.subdomains ?? 'abc',
    };

    // Clean up any existing layer before creating a fresh one (handles switch & retry cleanly without duplicates)
    if (tileLayerRef.current) {
      tileLayerRef.current.off('tileerror');
      tileLayerRef.current.off('tileload');
      if (map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
      }
      tileLayerRef.current = null;
    }

    const layer = L.tileLayer(currentProvider.url, layerOptions);

    const handleTileError = (e: any) => {
      consecutiveErrorsRef.current += 1;
      const tileSrc = e?.tile?.src || e?.url || '';

      if (import.meta.env.DEV) {
        console.warn('[PoiMap DEV Diagnostic] Tile error event:', {
          provider: currentProvider.key,
          tileSrc,
          onLine: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          consecutiveErrors: consecutiveErrorsRef.current,
        });
      }

      // After 3 consecutive tileerror events with no successful tileload since:
      // Failover to next provider, or enter schematic if end of chain
      if (consecutiveErrorsRef.current >= 3) {
        const nextIndex = providerIndex + 1;
        const nextProvider = providers[nextIndex];
        if (nextIndex < providers.length && nextProvider) {
          const fromKey = currentProvider.key;
          const toKey = nextProvider.key;
          if (import.meta.env.DEV) {
            console.log(`[PoiMap Failover] Switching provider from "${fromKey}" to "${toKey}"`);
          }
          consecutiveErrorsRef.current = 0;
          setProviderIndex(nextIndex);
        } else {
          if (import.meta.env.DEV) {
            console.warn('[PoiMap Failover] All providers in chain failed. Entering schematic state.');
          }
          onEnterSchematic();
        }
      }
    };

    const handleTileLoad = () => {
      consecutiveErrorsRef.current = 0;
      saveWorkingProvider(currentProvider.key);
      onExitSchematic();
    };

    layer.on('tileerror', handleTileError);
    layer.on('tileload', handleTileLoad);

    layer.addTo(map);
    tileLayerRef.current = layer;

    // DEV only: Count only L.TileLayer instances and log startup details with provider name
    if (import.meta.env.DEV) {
      let tileLayersCount = 0;
      if (typeof map.eachLayer === 'function') {
        map.eachLayer((l: any) => {
          if (l instanceof L.TileLayer) {
            tileLayersCount += 1;
          }
        });
      }
      console.log('[PoiMap DEV Startup] TileLayer initialized:', {
        provider: currentProvider.key,
        providerName: currentProvider.name,
        url: currentProvider.url,
        options: layerOptions,
        tileLayersOnMap: tileLayersCount,
      });
    }

    // Effect cleanup removes the layer it added: mount-unmount-mount leaves exactly one tile layer
    return () => {
      if (tileLayerRef.current) {
        tileLayerRef.current.off('tileerror', handleTileError);
        tileLayerRef.current.off('tileload', handleTileLoad);
        if (map.hasLayer(tileLayerRef.current)) {
          map.removeLayer(tileLayerRef.current);
        }
        tileLayerRef.current = null;
      }
    };
  }, [map, providerIndex, retryTrigger, providers, onEnterSchematic, onExitSchematic]);

  return null;
};

interface UserAutoCenterProps {
  userPos: PositionState | null;
  centerOnUserToken: number;
}

// Flies the map to the user's position exactly once per "Vị trí của tôi" press
// (signalled by a token bump). Later position updates leave the viewport alone.
const UserAutoCenter: React.FC<UserAutoCenterProps> = ({ userPos, centerOnUserToken }) => {
  const map = useMap();
  const lastCenteredTokenRef = useRef<number>(0);

  useEffect(() => {
    if (!userPos || !centerOnUserToken) return;
    if (lastCenteredTokenRef.current === centerOnUserToken) return;
    lastCenteredTokenRef.current = centerOnUserToken;
    try {
      map.stop();
      (map.flyTo as any)([userPos.lat, userPos.lng], 16, { duration: 0.8 });
    } catch {
      map.setView([userPos.lat, userPos.lng], 16);
    }
  }, [centerOnUserToken, userPos, map]);

  return null;
};

interface PoiMapProps {
  pois: GeoPoi[];
  selectedPoiId: string | null;
  activePoiId: string | null;
  hoveredPoiId?: string | null;
  currentPlayingId: string | null;
  isPlaying: boolean;
  isPaused?: boolean;
  userPos: PositionState | null;
  radius: number;
  isAutoEnabled: boolean;
  centerOnUserToken?: number;
  isSimMode?: boolean;
  onToggleSimMode?: () => void;
  onSetSimulatedPosition?: (lat: number, lng: number) => void;
  listenedPoiIds?: string[];
  onSelectPoi: (poiId: string) => void;
  onHoverPoi?: (poiId: string | null) => void;
  onTogglePlay: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  listenBtnText: string;
  pauseBtnText: string;
  resumeBtnText?: string;
  radiusLabelText: string;
  mapCaptionText: string;
  currentLang?: SupportedLanguage;
}

export const PoiMap: React.FC<PoiMapProps> = ({
  pois,
  selectedPoiId,
  activePoiId,
  hoveredPoiId,
  currentPlayingId,
  isPlaying,
  isPaused = false,
  userPos,
  radius,
  isAutoEnabled: _isAutoEnabled,
  centerOnUserToken = 0,
  isSimMode = false,
  onToggleSimMode,
  onSetSimulatedPosition,
  listenedPoiIds = [],
  onSelectPoi,
  onHoverPoi,
  onTogglePlay,
  getPoiName,
  getPoiCategory,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  mapCaptionText,
  currentLang = 'vi',
}) => {
  const [isSchematic, setIsSchematic] = useState<boolean>(false);
  const [showTileError, setShowTileError] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const [isInitialMount, setIsInitialMount] = useState<boolean>(true);
  const [markerClickedPoiId, setMarkerClickedPoiId] = useState<string | null>(null);
  const [thumbErrorPoiId, setThumbErrorPoiId] = useState<string | null>(null);

  // Dynamic route accent color read from CSS token via getComputedStyle
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [routeAccentColor, setRouteAccentColor] = useState<string>('#C2410C');

  useEffect(() => {
    if (mapWrapperRef.current) {
      const computed = getComputedStyle(mapWrapperRef.current)
        .getPropertyValue('--accent-orange')
        .trim();
      if (computed) {
        setRouteAccentColor(computed);
      }
    }
  }, []);

  const activePoi =
    pois.find((p) => p.id === (activePoiId || selectedPoiId)) || null;
  const clickedPoi = markerClickedPoiId
    ? pois.find((p) => p.id === markerClickedPoiId) || null
    : null;
  const isClickedPlaying = Boolean(clickedPoi && currentPlayingId === clickedPoi.id && isPlaying);
  const isClickedPaused = Boolean(clickedPoi && currentPlayingId === clickedPoi.id && isPaused);

  const handleEnterSchematic = useCallback(() => {
    setIsSchematic(true);
    setShowTileError(true);
  }, []);

  const handleExitSchematic = useCallback(() => {
    setIsSchematic(false);
    setShowTileError(false);
  }, []);

  // Retry ("Thử lại") removes and re-adds the same layer cleanly (no duplicates, no leaked listeners)
  const handleRetryTiles = useCallback(() => {
    setIsSchematic(false);
    setShowTileError(false);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // 28px round numbered pins with white border and soft shadow; active stop scales to ~40px with label pill
  const createMarkerIcon = (
    num: number,
    name: string,
    isActive: boolean,
    isHovered: boolean,
    isCurPlaying: boolean,
    isListened: boolean,
    isSchematic: boolean
  ) => {
    const activeClass = isActive ? 'is-active' : '';
    const hoveredClass = isHovered ? 'is-hovered' : '';
    const playingClass = isCurPlaying ? 'is-playing' : '';
    const listenedClass = isListened ? 'is-listened' : '';
    const showLabel = isSchematic ? (isActive || isHovered) : isActive;

    return L.divIcon({
      className: 'nearby-marker-pin-wrapper',
      html: `
        <div class="mk-pin-container ${activeClass} ${hoveredClass} ${playingClass} ${listenedClass}">
          <div class="mk-pin-node">
            ${isListened ? '<span class="mk-pin-check">✓</span>' : `<span class="mk-pin-num">${num}</span>`}
          </div>
          ${showLabel ? `<div class="mk-pin-label-pill">${name}</div>` : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  // Blue 14px user position dot with white border and pulsing 1.5s ring
  const userGpsIcon = L.divIcon({
    className: 'nearby-user-dot-wrapper',
    html: `
      <div class="user-position-node">
        <div class="user-pulse-ring"></div>
        <div class="user-blue-dot"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const simUserIcon = L.divIcon({
    className: 'nearby-user-dot-wrapper',
    html: `
      <div class="user-position-node is-sim">
        <div class="user-pulse-ring"></div>
        <div class="user-blue-dot"></div>
        <span class="user-sim-tag">${t(currentLang, 'simTag')}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <div
      ref={mapWrapperRef}
      className="nearby-map-wrapper"
      aria-label={t(currentLang, 'mapAriaLabel')}
    >
      {/* Persistent "Chế độ giả lập" overlay banner */}
      {isSimMode && (
        <div className="nearby-sim-banner" role="status" aria-live="polite">
          <div className="sim-banner-left">
            <span className="sim-pulse-dot" aria-hidden="true" />
            <span className="sim-banner-text">
              <strong>{t(currentLang, 'simBannerLabel')}</strong> — {t(currentLang, 'simBannerDesc')}
            </span>
          </div>
          {onToggleSimMode && (
            <button
              type="button"
              className="sim-banner-exit-btn"
              onClick={onToggleSimMode}
              title={t(currentLang, 'simBannerExitTitle')}
            >
              {t(currentLang, 'simBannerExit')}
            </button>
          )}
        </div>
      )}

      {/* Slim tile error banner - Task 1a */}
      {showTileError && (
        <div
          className={`nearby-tile-error-banner ${isSchematic ? 'is-schematic' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="tile-error-msg">
            {t(currentLang, 'tileErrorBanner')}
          </span>
          <button
            type="button"
            className="tile-error-retry-btn"
            onClick={handleRetryTiles}
          >
            {t(currentLang, 'retryBtn')}
          </button>
        </div>
      )}

      {/* Map box with State 3 grid pattern fallback: .is-grid-fallback */}
      <div className={`nearby-map-box ${isSchematic ? 'is-grid-fallback' : ''}`}>
        <MapContainer
          center={[10.7769, 106.6954]}
          zoom={15}
          zoomControl={false}
          scrollWheelZoom={false}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '480px',
            backgroundColor: 'var(--bg-cream, #FDFBF7)',
          }}
        >
          {/* Single OSM Raster Tile Layer (StrictMode-safe) */}
          <OsmTileLayer
            isSchematic={isSchematic}
            onEnterSchematic={handleEnterSchematic}
            onExitSchematic={handleExitSchematic}
            retryTrigger={retryTrigger}
          />

          {/* Floating Controls: top-right stacked 40px round white buttons */}
          <FloatingMapControls pois={pois} userPos={userPos} currentLang={currentLang} />

          {/* One-shot auto-center to the user's position after a GPS request */}
          <UserAutoCenter userPos={userPos} centerOnUserToken={centerOnUserToken} />

          <MapClickHandler
            isSimMode={isSimMode}
            onSetSimulatedPosition={onSetSimulatedPosition}
          />

          <MapController
            pois={pois}
            activePoi={activePoi}
            isInitialMount={isInitialMount}
            onInitialFitDone={() => setIsInitialMount(false)}
          />

          {/* 1. Route: 6px accent polyline read from CSS token with 2px white casing */}
          {pois.map((p, idx) => {
            if (idx === pois.length - 1) return null;
            const nextPoi = pois[idx + 1];
            if (!nextPoi) return null;
            const pair: [number, number][] = [
              [p.lat, p.lng],
              [nextPoi.lat, nextPoi.lng],
            ];
            const isSegmentListened = listenedPoiIds.includes(nextPoi.id);

            return (
              <React.Fragment key={`segment-${p.id}-${nextPoi.id}`}>
                {/* White casing underneath */}
                <Polyline
                  positions={pair}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: 12,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                {/* Accent polyline from CSS token */}
                <Polyline
                  positions={pair}
                  pathOptions={{
                    color: routeAccentColor,
                    weight: 8,
                    opacity: 1,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: isSegmentListened ? undefined : '6, 8',
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* 3. Geofence ring: translucent accent circle from CSS token around active stop */}
          {activePoi && (
            <Circle
              center={[activePoi.lat, activePoi.lng]}
              radius={activePoi.triggerRadius || radius}
              pathOptions={{
                color: routeAccentColor,
                weight: 1,
                fillColor: routeAccentColor,
                fillOpacity: 0.12,
              }}
            />
          )}

          {/* 4. User position: blue 14px dot with white border, pulsing 1.5s ring, accuracy circle */}
          {userPos && (
            <>
              {userPos.accuracy && userPos.accuracy > 0 ? (
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={userPos.accuracy}
                  pathOptions={{
                    color: '#2563EB',
                    weight: 1,
                    fillColor: '#2563EB',
                    fillOpacity: 0.08,
                  }}
                />
              ) : null}
              <Marker
                position={[userPos.lat, userPos.lng]}
                icon={isSimMode ? simUserIcon : userGpsIcon}
                draggable={Boolean(isSimMode)}
                eventHandlers={{
                  dragend: (e) => {
                    const latlng = e.target.getLatLng();
                    if (onSetSimulatedPosition) {
                      onSetSimulatedPosition(latlng.lat, latlng.lng);
                    }
                  },
                }}
              />
            </>
          )}

          {/* 2. Numbered POI Markers */}
          {pois.map((p, idx) => {
            const isActive = p.id === activePoiId || p.id === selectedPoiId;
            const isHovered = p.id === hoveredPoiId;
            const isCurPlaying = p.id === currentPlayingId && isPlaying;
            const isCurPaused = p.id === currentPlayingId && isPaused;
            const isListened = listenedPoiIds.includes(p.id);

            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createMarkerIcon(
                  idx + 1,
                  getPoiName(p),
                  isActive,
                  isHovered,
                  isCurPlaying,
                  isListened,
                  isSchematic
                )}
                eventHandlers={{
                  click: () => {
                    setMarkerClickedPoiId(p.id);
                    onSelectPoi(p.id);
                  },
                  mouseover: () => {
                    if (onHoverPoi) onHoverPoi(p.id);
                  },
                  mouseout: () => {
                    if (onHoverPoi) onHoverPoi(null);
                  },
                }}
              >
                <Popup>
                  <div className="nearby-popup-card">
                    <h4 className="nearby-popup-title">
                      {idx + 1}. {getPoiName(p)}
                      {isListened && (
                        <span className="popup-listened-tag"> {t(currentLang, 'popupListenedTag')}</span>
                      )}
                    </h4>
                    <div className="nearby-popup-cat">{getPoiCategory(p)}</div>
                    {/* Task 2f: Rename play button "Phát" / "Tạm dừng" */}
                    <button
                      type="button"
                      className="nearby-popup-play-btn"
                      aria-pressed={isCurPlaying}
                      onClick={() => onTogglePlay(p.id)}
                    >
                      {isCurPlaying
                        ? pauseBtnText || t(currentLang, 'pauseBtn')
                        : isCurPaused
                        ? resumeBtnText || t(currentLang, 'resumeBtn')
                        : listenBtnText || t(currentLang, 'playBtn')}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Task 1b: Selected-stop card: show ONLY after explicit marker click */}
        {clickedPoi && (
          <div
            className="nearby-selected-card"
            data-testid="nearby-selected-card"
            role="region"
            aria-label={t(currentLang, 'selectedCardAria')}
          >
            <div className="selected-card-header">
              {clickedPoi.image && thumbErrorPoiId !== clickedPoi.id ? (
                <img
                  src={resolveImagePath(clickedPoi.image, clickedPoi.slug)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="selected-card-thumb"
                  style={{ aspectRatio: '1 / 1' }}
                  onError={() => setThumbErrorPoiId(clickedPoi.id)}
                />
              ) : null}
              <div className="selected-card-info">
                <div className="selected-card-top-row">
                  <span className="selected-card-cat">{getPoiCategory(clickedPoi)}</span>
                  {userPos && (
                    <span className="selected-card-dist">
                      {t(currentLang, 'distFormat', {
                        dist: formatDistance(
                          haversine(userPos.lat, userPos.lng, clickedPoi.lat, clickedPoi.lng),
                          currentLang
                        ),
                      })}
                    </span>
                  )}
                </div>
                <h4 className="selected-card-title">{getPoiName(clickedPoi)}</h4>
              </div>
              <button
                type="button"
                className="selected-card-close-btn"
                onClick={() => setMarkerClickedPoiId(null)}
                title={t(currentLang, 'selectedCardClose')}
                aria-label={t(currentLang, 'selectedCardClose')}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="selected-card-actions">
              {/* Task 2f: Compact play button labeled "Phát" / "Tạm dừng" / "Tiếp tục" */}
              <button
                type="button"
                className={`selected-card-play-btn ${
                  isClickedPlaying ? 'is-playing' : isClickedPaused ? 'is-paused' : ''
                }`}
                aria-pressed={isClickedPlaying}
                onClick={() => onTogglePlay(clickedPoi.id)}
              >
                {isClickedPlaying
                  ? pauseBtnText || t(currentLang, 'pauseBtn')
                  : isClickedPaused
                  ? resumeBtnText || t(currentLang, 'resumeBtn')
                  : listenBtnText || t(currentLang, 'playBtn')}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="nearby-map-caption">{mapCaptionText || t(currentLang, 'mapCaption')}</p>
    </div>
  );
};
