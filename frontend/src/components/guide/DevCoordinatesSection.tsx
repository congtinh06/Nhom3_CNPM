import React, { useState } from 'react';
import { mockPois } from '../../api/poiMock';
import { Sliders, Check } from 'lucide-react';

interface DevCoordinatesSectionProps {
  currentLat: number | null;
  currentLng: number | null;
  onApplyCoordinates: (lat: number, lng: number) => void;
}

export const DevCoordinatesSection: React.FC<DevCoordinatesSectionProps> = ({
  currentLat,
  currentLng,
  onApplyCoordinates,
}) => {
  const [inputLat, setInputLat] = useState<string>(currentLat ? currentLat.toString() : '10.7743');
  const [inputLng, setInputLng] = useState<string>(currentLng ? currentLng.toString() : '106.7032');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onApplyCoordinates(lat, lng);
    }
  };

  return (
    <details
      style={{
        marginTop: '24px',
        padding: '12px 16px',
        borderRadius: '4px',
        border: '1px solid var(--line)',
        backgroundColor: 'var(--panel)',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <Sliders size={14} />
        <span>Nhập tọa độ (dev)</span>
      </summary>

      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Chọn nhanh tọa độ 5 điểm demo trung tâm Quận 1:
        </div>

        {/* 5 preset buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {mockPois.map((p) => {
            const isMatch =
              currentLat !== null &&
              currentLng !== null &&
              Math.abs(currentLat - p.latitude) < 0.0001 &&
              Math.abs(currentLng - p.longitude) < 0.0001;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setInputLat(p.latitude.toString());
                  setInputLng(p.longitude.toString());
                  onApplyCoordinates(p.latitude, p.longitude);
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: isMatch ? '1px solid #0284c7' : '1px solid var(--line)',
                  backgroundColor: isMatch ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                  color: isMatch ? '#38bdf8' : 'var(--text)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Manual coordinate inputs */}
        <form onSubmit={handleApply} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Vĩ độ (Lat)
            </label>
            <input
              type="number"
              step="0.0001"
              value={inputLat}
              onChange={(e) => setInputLat(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '4px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Kinh độ (Lng)
            </label>
            <input
              type="number"
              step="0.0001"
              value={inputLng}
              onChange={(e) => setInputLng(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '4px',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '7px 16px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            <span>Áp dụng</span>
          </button>
        </form>
      </div>
    </details>
  );
};
