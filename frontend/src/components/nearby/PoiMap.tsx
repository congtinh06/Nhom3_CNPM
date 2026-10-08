import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPoi } from '../../pages/NearbyPage';
import { PositionState } from '../../hooks/useAutoNarration';

interface MapControllerProps {
  userPos: PositionState | null;
  radius: number;
  selectedPoi: GeoPoi | null;
  pois: GeoPoi[];
}

const MapController: React.FC<MapControllerProps> = ({ userPos, radius, selectedPoi, pois }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and after a short animation delay to ensure tiles load
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });

      const container = map.getContainer?.();
      if (container) {
        resizeObserver.observe(container);
      }
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [map]);

  useEffect(() => {
    try {
      if (userPos) {
        const circle = L.circle([userPos.lat, userPos.lng], { radius });
        map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 17 });
      } else if (pois.length > 0) {
        const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    } catch {
      // Ignore fitBounds error
    }
  }, [userPos, radius, pois, map]);

  useEffect(() => {
    if (selectedPoi) {
      map.panTo([selectedPoi.lat, selectedPoi.lng], { animate: true });
    }
  }, [selectedPoi, map]);

  return null;
};

interface PoiMapProps {
  pois: GeoPoi[];
  selectedPoiId: string | null;
  currentPlayingId: string | null;
  isPlaying: boolean;
  userPos: PositionState | null;
  radius: number;
  isAutoEnabled: boolean;
  onSelectPoi: (poiId: string) => void;
  onPlayPoi: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  listenBtnText: string;
  pauseBtnText: string;
  radiusLabelText: string;
  mapCaptionText: string;
}

interface FitTourControlProps {
  pois: GeoPoi[];
}

const FitTourControl: React.FC<FitTourControlProps> = ({ pois }) => {
  const map = useMap();
  const handleFitTour = () => {
    if (pois.length > 0) {
      try {
        const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', margin: '12px' }}>
      <button
        type="button"
        className="btn-view-whole-tour"
        onClick={handleFitTour}
        title="Xem toàn tour (5 điểm)"
        aria-label="Xem toàn tour (5 điểm)"
      >
        🗺️ Xem toàn tour
      </button>
    </div>
  );
};

export const PoiMap: React.FC<PoiMapProps> = ({
  pois,
  selectedPoiId,
  currentPlayingId,
  isPlaying,
  userPos,
  radius,
  isAutoEnabled,
  onSelectPoi,
  onPlayPoi,
  getPoiName,
  getPoiCategory,
  listenBtnText,
  pauseBtnText,
  radiusLabelText,
  mapCaptionText,
}) => {
  const [hasTileError, setHasTileError] = React.useState<boolean>(false);
  const selectedPoi = pois.find((p) => p.id === selectedPoiId) || null;

  // Custom numbered Leaflet icons (1 - 5)
  const createMarkerIcon = (num: number, isSelected: boolean, isCurPlaying: boolean) => {
    return L.divIcon({
      className: 'custom-poi-marker',
      html: `
        <div class="mk ${isSelected ? 'sel' : ''} ${isCurPlaying ? 'playing' : ''}">
          <div class="ring"></div>
          <div class="dot">${num}</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const userGpsIcon = L.divIcon({
    className: 'custom-user-gps-marker',
    html: `
      <div class="you-dot-pulse">
        <div class="you-dot"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return (
    <div className="map-wrapper" aria-label="Bản đồ tương tác các điểm du lịch">
      <div className="map-container-box">
        {hasTileError && (
          <div className="map-tile-error-banner" role="status">
            <span>⚠️ Không thể tải bản đồ từ máy chủ OSM (vui lòng kiểm tra mạng). Danh sách thuyết minh vẫn sử dụng bình thường.</span>
          </div>
        )}

        <MapContainer
          center={[10.7769, 106.6954]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%', minHeight: '380px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            eventHandlers={{
              tileerror: () => {
                setHasTileError(true);
              },
            }}
          />

          <FitTourControl pois={pois} />

          <MapController
            userPos={userPos}
            radius={radius}
            selectedPoi={selectedPoi}
            pois={pois}
          />

          {/* Tour polyline connecting POIs in order */}
          <Polyline
            positions={pois.map((p) => [p.lat, p.lng])}
            color="#E9A23B"
            weight={3.5}
            dashArray="6, 8"
            opacity={0.85}
          />

          {/* User GPS marker and radius circle */}
          {userPos && (
            <>
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={radius}
                pathOptions={{
                  color: isAutoEnabled ? '#E9A23B' : '#1F6FEB',
                  fillColor: isAutoEnabled ? '#E9A23B' : '#1F6FEB',
                  fillOpacity: isAutoEnabled ? 0.16 : 0.1,
                  weight: 1.5,
                  dashArray: isAutoEnabled ? '4, 4' : undefined,
                }}
              />
              <Marker position={[userPos.lat, userPos.lng]} icon={userGpsIcon}>
                <Popup>
                  <div style={{ padding: '4px', textAlign: 'center', fontSize: '13px' }}>
                    <b>{userPos.label}</b>
                    <div>{radiusLabelText}: {radius} m</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* 5 Numbered POI Markers */}
          {pois.map((p, idx) => {
            const isSelected = p.id === selectedPoiId;
            const isCurPlaying = p.id === currentPlayingId && isPlaying;

            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createMarkerIcon(idx + 1, isSelected, isCurPlaying)}
                eventHandlers={{
                  click: () => {
                    onSelectPoi(p.id);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '4px' }}>
                    <h4 style={{ margin: '0 0 4px', color: '#8B2E16', fontSize: '14px', fontWeight: 700 }}>
                      {idx + 1}. {getPoiName(p)}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6A584D', marginBottom: '8px' }}>
                      {getPoiCategory(p)}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-solid"
                      style={{ width: '100%', minHeight: '32px', fontSize: '12px' }}
                      onClick={() => onPlayPoi(p.id)}
                    >
                      {isCurPlaying ? pauseBtnText : listenBtnText}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      <p className="map-caption">{mapCaptionText}</p>
    </div>
  );
};
