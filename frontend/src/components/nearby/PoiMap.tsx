import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SupportedLanguage } from '../../types';
import { GeoPoi } from '../../pages/NearbyPage';
import { PositionState, haversine } from '../../hooks/useAutoNarration';
import { resolveImagePath } from './PoiCard';
import { t, formatDistance } from '../../content/nearbyI18n';
import { buildGoogleMapsDirectionsUrl } from '../../utils/directions';
import { OsmTileLayer } from './OsmTileLayer';
import {
  TileProviderConfig,
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  getTileProviders,
  getInitialProviderIndex,
  saveWorkingProvider,
  STORAGE_KEY_WORKING_PROVIDER,
} from '../../config/tileProviders';

export { OsmTileLayer };
export type { TileProviderConfig };
export {
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  getTileProviders,
  getInitialProviderIndex,
  saveWorkingProvider,
  STORAGE_KEY_WORKING_PROVIDER,
};

export type GoogleMapTypeStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, any>>;
};

export const GOOGLE_MAPS_WARM_LIGHT_STYLES: GoogleMapTypeStyle[] = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#EFE9DF' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFD8D6' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FBF8F2' }] },
];

export const GOOGLE_MAPS_WARM_DARK_STYLES: GoogleMapTypeStyle[] = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#26221F' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2F3D40' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#3A3531' }] },
];

interface MapControllerProps {
  pois: GeoPoi[];
  activePoi: GeoPoi | null;
  isInitialMount: boolean;
  onInitialFitDone: () => void;
  onZoomChange: (zoomedIn: boolean) => void;
  fitBoundsTrigger: number;
}

const MapController: React.FC<MapControllerProps> = ({
  pois,
  activePoi,
  isInitialMount,
  onInitialFitDone,
  onZoomChange,
  fitBoundsTrigger,
}) => {
  const map = useMap();
  const lastActiveIdRef = useRef<string | null>(null);
  const flyToTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const pendingActivePoiRef = useRef<GeoPoi | null>(null);

  // Invalidate size on container resize
  useEffect(() => {
    if (typeof map?.invalidateSize === 'function') {
      map.invalidateSize();
    }
    const t1 = setTimeout(() => {
      if (typeof map?.invalidateSize === 'function') map.invalidateSize();
    }, 150);
    const t2 = setTimeout(() => {
      if (typeof map?.invalidateSize === 'function') map.invalidateSize();
    }, 500);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (isScrollingRef.current) return;
        if (typeof map?.invalidateSize === 'function') map.invalidateSize();
      });
      const container = typeof map?.getContainer === 'function' ? map.getContainer() : null;
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

  // Track zoom level to show/hide "View full route" button
  useEffect(() => {
    if (typeof map?.on !== 'function') return;
    const handleZoom = () => {
      const z = typeof map.getZoom === 'function' ? map.getZoom() : 14;
      onZoomChange(z >= 15);
    };
    map.on('zoomend', handleZoom);
    return () => {
      if (typeof map?.off === 'function') {
        map.off('zoomend', handleZoom);
      }
    };
  }, [map, onZoomChange]);

  const executeFlyTo = useCallback(
    (targetPoi: GeoPoi) => {
      if (!targetPoi || targetPoi.id === lastActiveIdRef.current) return;
      lastActiveIdRef.current = targetPoi.id;
      pendingActivePoiRef.current = null;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      try {
        if (typeof map?.stop === 'function') map.stop();
        const currentZoom = typeof map?.getZoom === 'function' ? map.getZoom() : 14;
        const targetZoom = Math.max(currentZoom, 15);
        if (prefersReduced) {
          if (typeof map?.setView === 'function') {
            map.setView([targetPoi.lat, targetPoi.lng], targetZoom);
          }
        } else {
          if (typeof (map as any)?.flyTo === 'function') {
            (map.flyTo as any)([targetPoi.lat, targetPoi.lng], targetZoom, {
              duration: 0.8,
            });
          } else if (typeof map?.setView === 'function') {
            map.setView([targetPoi.lat, targetPoi.lng], targetZoom);
          }
        }
        onZoomChange(true);
      } catch {
        // Ignore flyTo interrupts
      }
    },
    [map, onZoomChange]
  );

  // Passive window scroll listener to avoid flyTo during scrolling
  useEffect(() => {
    const handleWindowScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        const pending = pendingActivePoiRef.current;
        if (pending && pending.id !== lastActiveIdRef.current) {
          executeFlyTo(pending);
        }
      }, 200);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [executeFlyTo]);

  // Initial bounds: fit to tour stops with 48px padding
  useEffect(() => {
    if (isInitialMount && pois.length > 0) {
      try {
        if (typeof map?.fitBounds === 'function') {
          const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
        }
      } catch {
        // Ignore
      }
      onInitialFitDone();
    }
  }, [isInitialMount, pois, map, onInitialFitDone]);

  // Handle "View full route" button trigger
  useEffect(() => {
    if (fitBoundsTrigger > 0 && pois.length > 0) {
      try {
        const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
        if (typeof map?.stop === 'function') map.stop();
        if (typeof map?.fitBounds === 'function') {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
        }
        onZoomChange(false);
      } catch {
        // Ignore
      }
    }
  }, [fitBoundsTrigger, pois, map, onZoomChange]);

  // Active stop change: pan/fly to selected stop
  useEffect(() => {
    if (!activePoi || activePoi.id === lastActiveIdRef.current) return;
    pendingActivePoiRef.current = activePoi;

    if (flyToTimerRef.current) clearTimeout(flyToTimerRef.current);

    flyToTimerRef.current = setTimeout(() => {
      if (!isScrollingRef.current) {
        executeFlyTo(activePoi);
      }
    }, 150);

    return () => {
      if (flyToTimerRef.current) clearTimeout(flyToTimerRef.current);
    };
  }, [activePoi, executeFlyTo]);

  return null;
};

interface UserAutoCenterProps {
  userPos: PositionState | null;
  centerOnUserToken: number;
  focusPoi?: GeoPoi | null;
}

const UserAutoCenter: React.FC<UserAutoCenterProps> = ({
  userPos,
  centerOnUserToken,
  focusPoi = null,
}) => {
  const map = useMap();
  const lastCenteredTokenRef = useRef<number>(0);

  useEffect(() => {
    if (!userPos || !centerOnUserToken) return;
    if (lastCenteredTokenRef.current === centerOnUserToken) return;
    lastCenteredTokenRef.current = centerOnUserToken;
    try {
      if (typeof map?.stop === 'function') map.stop();
      // Fit both the visitor and the target stop so the route and the real
      // distance are visible together after tapping "My location".
      if (focusPoi && typeof map?.fitBounds === 'function') {
        const bounds = L.latLngBounds([
          [userPos.lat, userPos.lng],
          [focusPoi.lat, focusPoi.lng],
        ]);
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 16 });
        return;
      }
      if (typeof (map as any)?.flyTo === 'function') {
        (map as any).flyTo([userPos.lat, userPos.lng], 16, { duration: 0.8 });
      } else if (typeof map?.setView === 'function') {
        map.setView([userPos.lat, userPos.lng], 16);
      }
    } catch {
      if (typeof map?.setView === 'function') {
        map.setView([userPos.lat, userPos.lng], 16);
      }
    }
  }, [centerOnUserToken, userPos, focusPoi, map]);

  return null;
};

// Map controls: Zoom in/out inside MapContainer using useMap()
interface FloatingControlsProps {
  currentLang: SupportedLanguage;
}

const FloatingMapControls: React.FC<FloatingControlsProps> = ({ currentLang }) => {
  const map = useMap();

  const handleZoomIn = () => {
    if (typeof (map as any)?.zoomIn === 'function') {
      (map as any).zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (typeof (map as any)?.zoomOut === 'function') {
      (map as any).zoomOut();
    }
  };

  return (
    <div className="nearby-map-floating-stack" style={{ position: 'absolute', top: 16, right: 16, zIndex: 500 }}>
      <button
        type="button"
        className="map-round-btn map-btn-zoom-in"
        onClick={handleZoomIn}
        title={t(currentLang, 'mapZoomIn')}
        aria-label={t(currentLang, 'mapZoomIn')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        className="map-round-btn map-btn-zoom-out"
        onClick={handleZoomOut}
        title={t(currentLang, 'mapZoomOut')}
        aria-label={t(currentLang, 'mapZoomOut')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

// Stable, module-level callbacks: an inline arrow here would rebuild the tile
// layer on every render and make the map flicker.
const NOOP = () => {};

const USER_DOT_ICON = L.divIcon({
  className: 'nearby-user-dot-wrapper',
  html: `
    <div class="user-position-node">
      <div class="user-pulse-ring"></div>
      <div class="user-blue-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Create Custom Numbered Markers 1-7
// - 26px circle, ink background, 2px page-color border, number centered
// - Selected: 34px, accent background, highest z-index
// - Heard: lighter tint of ink. Number always visible, no badge on top
// - Label: full name, one line, nowrap, no max-width, above marker, page-color background
const createMarkerIcon = (
  num: number,
  name: string,
  isActive: boolean,
  isHovered: boolean,
  isCurPlaying: boolean,
  isListened: boolean
) => {
  const activeClass = isActive ? 'is-selected' : '';
  const hoveredClass = isHovered ? 'is-hovered' : '';
  const playingClass = isCurPlaying ? 'is-playing' : '';
  const listenedClass = isListened ? 'is-heard' : '';

  // The label is always in the DOM and revealed by CSS hover/active state.
  // Keeping the icon markup stable is what prevents the Leaflet marker from
  // being rebuilt under the pointer (which used to cause hover flicker).
  return L.divIcon({
    className: 'nearby-marker-pin-wrapper',
    html: `
      <div class="nearby-gmap-marker-container ${activeClass} ${hoveredClass} ${playingClass} ${listenedClass}">
        <div class="nearby-gmap-marker-label">${name}${isListened ? ' - Đã trải qua' : ''}</div>
        <div class="nearby-gmap-marker-circle">
          <span class="nearby-gmap-marker-num">${num}</span>
          ${isListened ? '<span class="nearby-gmap-marker-check" aria-hidden="true"></span>' : ''}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

interface PoiMarkerProps {
  poi: GeoPoi;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  currentPlayingId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  isListened: boolean;
  userPos: PositionState | null;
  onSelectPoi: (poiId: string) => void;
  onTogglePlay: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  listenBtnText: string;
  pauseBtnText: string;
  resumeBtnText?: string;
  currentLang: SupportedLanguage;
}

const PoiMarkerComponent: React.FC<PoiMarkerProps> = ({
  poi,
  index,
  isActive,
  isHovered,
  currentPlayingId,
  isPlaying,
  isPaused,
  isListened,
  userPos,
  onSelectPoi,
  onTogglePlay,
  getPoiName,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  currentLang,
}) => {
  const poiName = getPoiName(poi);
  const isCurPlaying = poi.id === currentPlayingId && isPlaying;
  const isCurPaused = poi.id === currentPlayingId && isPaused;

  const icon = useMemo(
    () => createMarkerIcon(index + 1, poiName, isActive, isHovered, isCurPlaying, isListened),
    [index, poiName, isActive, isHovered, isCurPlaying, isListened]
  );

  return (
    <Marker
      position={[poi.lat, poi.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelectPoi(poi.id),
      }}
    >
      {/* Embedded Popup for test suites & direct action */}
      <Popup className="nearby-popup-test-container">
        <div data-testid="leaflet-popup" className="nearby-popup-content">
          <span className="nearby-popup-name">
            {index + 1}. {poiName}
          </span>
          <button
            type="button"
            className="nearby-popup-play-btn"
            aria-pressed={isCurPlaying}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay(poi.id);
            }}
          >
            {isCurPlaying
              ? pauseBtnText || t(currentLang, 'pauseBtn')
              : isCurPaused
              ? resumeBtnText || t(currentLang, 'resumeBtn')
              : listenBtnText || t(currentLang, 'playBtn')}
          </button>
          <a
            className="nearby-popup-directions-btn"
            href={buildGoogleMapsDirectionsUrl(poi, userPos)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {t(currentLang, 'directionsBtn')}
          </a>
        </div>
      </Popup>
    </Marker>
  );
};

// Memoised so a hover change only re-renders the two affected markers instead
// of rebuilding every Leaflet icon (which made pins flicker and glitch).
const PoiMarker = React.memo(PoiMarkerComponent);

export interface PoiMapProps {
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
  listenedPoiIds?: string[];
  onSelectPoi: (poiId: string) => void;
  onHoverPoi?: (poiId: string | null) => void;
  onTogglePlay: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  listenBtnText: string;
  pauseBtnText: string;
  resumeBtnText?: string;
  mapCaptionText?: string;
  currentLang?: SupportedLanguage;
  showSelectedCard?: boolean;
  compactPopup?: boolean;
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
  listenedPoiIds = [],
  onSelectPoi,
  onTogglePlay,
  getPoiName,
  getPoiCategory,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  currentLang = 'vi',
  showSelectedCard = true,
}) => {
  const [isInitialMount, setIsInitialMount] = useState<boolean>(true);
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);
  const [markerClickedPoiId, setMarkerClickedPoiId] = useState<string | null>(null);
  const [thumbErrorPoiId, setThumbErrorPoiId] = useState<string | null>(null);
  const [routeAccentColor, setRouteAccentColor] = useState<string>('#D96A47');

  const mapWrapperRef = useRef<HTMLDivElement>(null);

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

  const activePoi = pois.find((p) => p.id === (activePoiId || selectedPoiId)) || null;
  const clickedPoi = markerClickedPoiId
    ? pois.find((p) => p.id === markerClickedPoiId) || null
    : null;
  const isClickedPlaying = Boolean(clickedPoi && currentPlayingId === clickedPoi.id && isPlaying);
  const isClickedPaused = Boolean(clickedPoi && currentPlayingId === clickedPoi.id && isPaused);

  const handleMarkerSelect = useCallback(
    (poiId: string) => {
      setMarkerClickedPoiId(poiId);
      onSelectPoi(poiId);
    },
    [onSelectPoi]
  );

  const handleViewFullRoute = () => {
    setFitBoundsTrigger((prev) => prev + 1);
  };

  return (
    <div
      ref={mapWrapperRef}
      className="nearby-map-wrapper"
      aria-label={t(currentLang, 'mapAriaLabel')}
    >
      <div className="nearby-map-box">
        <MapContainer
          center={[10.7769, 106.6954]}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          className="nearby-gmap-canvas nearby-leaflet-map"
          style={{ width: '100%', height: '100%', background: '#EFE9DF', border: 'none' }}
        >
          {/* Tile Layer: Google Maps official roadmap tiles */}
          <OsmTileLayer
            isSchematic={false}
            onEnterSchematic={NOOP}
            onExitSchematic={NOOP}
            retryTrigger={0}
            providers={TILE_PROVIDERS}
          />

          <MapController
            pois={pois}
            activePoi={activePoi}
            isInitialMount={isInitialMount}
            onInitialFitDone={() => setIsInitialMount(false)}
            onZoomChange={setIsZoomedIn}
            fitBoundsTrigger={fitBoundsTrigger}
          />

          <UserAutoCenter
            userPos={userPos}
            centerOnUserToken={centerOnUserToken}
            focusPoi={activePoi}
          />

          {/* Geofence subtle tint around active stop (no border stroke lines) */}
          {activePoi && (
            <Circle
              center={[activePoi.lat, activePoi.lng]}
              radius={activePoi.triggerRadius || radius || 60}
              pathOptions={{
                stroke: false,
                fillColor: routeAccentColor,
                fillOpacity: 0.1,
              }}
            />
          )}

          {/* User GPS Dot & subtle accuracy tint (no border stroke lines) */}
          {userPos && (
            <>
              {userPos.accuracy && userPos.accuracy > 0 && (
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={userPos.accuracy}
                  pathOptions={{
                    stroke: false,
                    fillColor: '#2563EB',
                    fillOpacity: 0.08,
                  }}
                />
              )}
              <Marker position={[userPos.lat, userPos.lng]} icon={USER_DOT_ICON} />
            </>
          )}

          {/* Dashed walking route from the visitor to the open stop */}
          {userPos && activePoi && (
            <Polyline
              positions={[
                [userPos.lat, userPos.lng],
                [activePoi.lat, activePoi.lng],
              ]}
              pathOptions={{
                color: routeAccentColor,
                weight: 3,
                opacity: 0.8,
                dashArray: '6 8',
              }}
            />
          )}

          {/* Markers for all 7 stops numbered 1-7 */}
          {pois.map((poi, idx) => (
            <PoiMarker
              key={poi.id}
              poi={poi}
              index={idx}
              isActive={poi.id === (activePoiId || selectedPoiId)}
              isHovered={poi.id === hoveredPoiId}
              currentPlayingId={currentPlayingId}
              isPlaying={isPlaying}
              isPaused={isPaused}
              isListened={listenedPoiIds.includes(poi.id)}
              userPos={userPos}
              onSelectPoi={handleMarkerSelect}
              onTogglePlay={onTogglePlay}
              getPoiName={getPoiName}
              listenBtnText={listenBtnText}
              pauseBtnText={pauseBtnText}
              resumeBtnText={resumeBtnText}
              currentLang={currentLang}
            />
          ))}

          {/* Floating Zoom Controls inside MapContainer */}
          <FloatingMapControls currentLang={currentLang} />
        </MapContainer>

        {/* Small text button "View full route" that restores fitBounds */}
        {isZoomedIn && (
          <button
            type="button"
            className="nearby-map-view-route-btn"
            onClick={handleViewFullRoute}
            title={currentLang === 'vi' ? 'Xem toàn bộ lộ trình' : 'View full route'}
          >
            {currentLang === 'vi' ? 'Xem toàn bộ lộ trình' : 'View full route'}
          </button>
        )}

        {/* Selected stop card when explicit marker is clicked */}
        {showSelectedCard && clickedPoi && (
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
                  {listenedPoiIds.includes(clickedPoi.id) && (
                    <span className="selected-card-listened">
                      {t(currentLang, 'popupListenedTag')}
                    </span>
                  )}
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
                  <line x1="6" y1="12" x2="18" y2="12" />
                </svg>
              </button>
            </div>
            <div className="selected-card-actions">
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
              <a
                className="selected-card-directions-btn"
                href={buildGoogleMapsDirectionsUrl(clickedPoi, userPos)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(currentLang, 'directionsAria', { name: getPoiName(clickedPoi) })}
                title={t(currentLang, 'directionsBtn')}
              >
                {t(currentLang, 'directionsBtn')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
