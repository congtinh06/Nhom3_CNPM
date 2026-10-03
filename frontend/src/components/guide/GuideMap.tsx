import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Poi } from '../../types/poi';

interface GuideMapProps {
  pois: Poi[];
  selectedPoiId: number | string | null;
  lat: number | null;
  lng: number | null;
  onSelectLocation: (lat: number, lng: number) => void;
  onMarkerClick?: (poi: Poi) => void;
  routeCoordinates?: [number, number][] | null;
}

// Clean circular icon for POI markers with no floating text
const createPoiIcon = (type: string, isSelected: boolean, incidentReportsCount?: number) => {
  const isHighRisk = Boolean(incidentReportsCount && incidentReportsCount >= 3);
  let bg = isHighRisk ? '#B3261E' : '#0B4F9C';
  let svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;

  if (isHighRisk) {
    svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  } else if (type === 'BRANCH') {
    bg = '#6B21A8';
    svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  } else if (type === 'FX_EXCHANGE') {
    bg = '#B45309';
    svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h14l-4-4"/><path d="M17 14H3l4 4"/></svg>`;
  }

  const size = isSelected ? 34 : 28;
  const border = isSelected ? '2.5px solid #ffffff' : '1.5px solid #ffffff';
  const shadow = isSelected
    ? '0 3px 10px rgba(0,0,0,0.35)'
    : '0 2px 6px rgba(0,0,0,0.2)';

  return L.divIcon({
    className: 'guide-marker-container',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${bg};
        border: ${border};
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${svg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// User Location Pin
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'guide-marker-container',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #0B4F9C;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 0 3px rgba(11, 79, 156, 0.3);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Map click handler
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map recentering
const MapRecenter: React.FC<{ lat: number | null; lng: number | null }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  }, [lat, lng, map]);
  return null;
};

// Invalidate size on mount / resize
const MapResizeHandler: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

export const GuideMap: React.FC<GuideMapProps> = ({
  pois,
  selectedPoiId,
  lat,
  lng,
  onSelectLocation,
  onMarkerClick,
  routeCoordinates,
}) => {
  const [basemap, setBasemap] = useState<'osm' | 'esri'>('osm');
  const defaultCenter: [number, number] = [10.7743, 106.7032];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      <style>{`
        .guide-marker-container {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          font-family: inherit;
          background: #FAFAF7 !important;
        }
        .leaflet-tile {
          filter: saturate(0.85) contrast(0.98);
        }
      `}</style>

      {/* Layer switcher control (compact in top-right) */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          gap: '2px',
          backgroundColor: 'var(--surface)',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => setBasemap('osm')}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: basemap === 'osm' ? 600 : 400,
            backgroundColor: basemap === 'osm' ? 'var(--primary)' : 'transparent',
            color: basemap === 'osm' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          OSM
        </button>
        <button
          type="button"
          onClick={() => setBasemap('esri')}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: basemap === 'esri' ? 600 : 400,
            backgroundColor: basemap === 'esri' ? 'var(--primary)' : 'transparent',
            color: basemap === 'esri' ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Esri
        </button>
      </div>

      {/* Compact map legend (bottom-left) */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 1000,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0B4F9C' }} />
          <span>ATM</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B3261E' }} />
          <span>Cảnh báo</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6B21A8' }} />
          <span>Chi nhánh</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B45309' }} />
          <span>Đổi ngoại tệ</span>
        </span>
      </div>

      <MapContainer
        center={lat !== null && lng !== null ? [lat, lng] : defaultCenter}
        zoom={16}
        minZoom={12}
        maxZoom={19}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {basemap === 'osm' ? (
          <TileLayer
            key="osm-layer"
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
            subdomains="abc"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            key="esri-layer"
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapClickHandler onMapClick={onSelectLocation} />
        <MapRecenter lat={lat} lng={lng} />
        <MapResizeHandler />

        {/* Route Polyline if active */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#0B4F9C',
              weight: 4,
              opacity: 0.85,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* POI Markers */}
        {pois.map((p) => {
          const isSelected = selectedPoiId === p.id;
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={createPoiIcon(p.type, isSelected, p.incidentReportsCount)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  onSelectLocation(p.latitude, p.longitude);
                  onMarkerClick?.(p);
                },
              }}
            />
          );
        })}

        {/* User Location Marker & 200m circle */}
        {lat !== null && lng !== null && (
          <>
            <Marker
              position={[lat, lng]}
              icon={createUserLocationIcon()}
              zIndexOffset={1000}
            />
            <Circle
              center={[lat, lng]}
              radius={200}
              pathOptions={{
                color: '#0B4F9C',
                fillColor: '#0B4F9C',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};
