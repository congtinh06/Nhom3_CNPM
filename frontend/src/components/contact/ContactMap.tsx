import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tọa độ 338 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh
const CONTACT_COORDS: [number, number] = [10.7599, 106.6791];

interface ContactMapProps {
  lang?: string;
}

// Tự động invalidateSize để tránh hiện tượng gạch xám khi tải ban đầu
const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
};

export const ContactMap: React.FC<ContactMapProps> = () => {
  const customPinIcon = useMemo(() => {
    return L.divIcon({
      className: 'contact-map-marker-wrap',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(194, 65, 12, 0.25); animation: contactPulse 2s infinite ease-out;"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #c2410c, #9a3412); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(44, 24, 16, 0.35); display: flex; align-items: center; justify-content: center; color: #ffffff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }, []);

  return (
    <div className="contact-map-canvas" style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={CONTACT_COORDS}
        zoom={16}
        scrollWheelZoom={false}
        dragging={!L.Browser?.touch}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />
        <Marker position={CONTACT_COORDS} icon={customPinIcon}>
          <Popup className="contact-map-popup" autoPan={false}>
            <div style={{ padding: '6px 4px', minWidth: 210, color: '#1c1917', fontFamily: 'inherit' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c2410c', marginBottom: 4 }}>
                Văn phòng Echora
              </div>
              <div style={{ fontSize: '0.84rem', color: '#57534e', lineHeight: 1.45, marginBottom: 6 }}>
                338 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh
              </div>
              <div style={{ fontSize: '0.82rem', color: '#78350f', fontWeight: 600 }}>
                Hotline: 0346358399
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78716c', marginTop: 2 }}>
                Giờ mở cửa: 8h - 23h
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ContactMap;
