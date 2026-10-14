import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SupportedLanguage } from '../../types';
import { tContact } from '../../content/contactI18n';

// Heritage Center Coordinates: 02 Cong xa Paris, Ben Nghe, District 1, HCMC
const HERITAGE_CENTER_COORDS: [number, number] = [10.77978, 106.69902];

interface ContactMapProps {
  lang: SupportedLanguage;
}

export const ContactMap: React.FC<ContactMapProps> = ({ lang }) => {
  const customPinIcon = useMemo(() => {
    return L.divIcon({
      className: 'contact-map-marker-wrap',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(192, 86, 33, 0.25); animation: contactPulse 2s infinite ease-out;"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #c05621, #92400e); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(44, 24, 16, 0.35); display: flex; align-items: center; justify-content: center; color: #ffffff;">
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
        center={HERITAGE_CENTER_COORDS}
        zoom={16}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Marker position={HERITAGE_CENTER_COORDS} icon={customPinIcon}>
          <Popup className="contact-map-popup">
            <div style={{ padding: '6px 2px', minWidth: 200, color: '#2c1810', fontFamily: 'inherit' }}>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
                {tContact(lang, 'officeTitle')}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#59473e', lineHeight: 1.4, marginBottom: 6 }}>
                {tContact(lang, 'officeAddress')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: 600 }}>
                Hotline: 1900 1234
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ContactMap;
