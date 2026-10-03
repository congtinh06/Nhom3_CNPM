import React from 'react';
import { Navigation, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { mockPois } from '../../api/poiMock';

interface LocationSelectorProps {
  sourceTab: 'real' | 'simulated';
  onTabChange: (tab: 'real' | 'simulated') => void;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  isLocating: boolean;
  isAutoWatch: boolean;
  onToggleAutoWatch: (enabled: boolean) => void;
  onRequestRealLocation: () => void;
  onSetCoordinates: (lat: number, lng: number) => void;
  geoError: string | null;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  sourceTab,
  onTabChange,
  lat,
  lng,
  accuracy,
  isLocating,
  isAutoWatch,
  onToggleAutoWatch,
  onRequestRealLocation,
  onSetCoordinates,
  geoError,
}) => {
  return (
    <div
      className="panel"
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        marginBottom: '24px',
      }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange('real')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: sourceTab === 'real' ? '1px solid #38bdf8' : '1px solid transparent',
            backgroundColor: sourceTab === 'real' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: sourceTab === 'real' ? '#38bdf8' : 'var(--text-muted)',
          }}
        >
          <Navigation size={15} />
          Vị trí thật (GPS)
        </button>

        <button
          type="button"
          onClick={() => onTabChange('simulated')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: sourceTab === 'simulated' ? '1px solid #38bdf8' : '1px solid transparent',
            backgroundColor: sourceTab === 'simulated' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: sourceTab === 'simulated' ? '#38bdf8' : 'var(--text-muted)',
          }}
        >
          <Sliders size={15} />
          Giả lập (Demo lớp học)
        </button>
      </div>

      {/* Tab 1: Vị trí thật */}
      {sourceTab === 'real' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={onRequestRealLocation}
              disabled={isLocating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isLocating ? 'not-allowed' : 'pointer',
                backgroundColor: '#38bdf8',
                color: '#0c0d0e',
                border: 'none',
                opacity: isLocating ? 0.7 : 1,
              }}
            >
              <Navigation size={15} />
              {isLocating ? 'Đang định vị…' : 'Lấy vị trí hiện tại'}
            </button>

            {/* Switch Tự động theo dõi */}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                color: 'var(--text)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isAutoWatch}
                onChange={(e) => onToggleAutoWatch(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#38bdf8',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontWeight: 600 }}>Tự động theo dõi (watchPosition)</span>
            </label>
          </div>

          {/* Thông báo lỗi Geolocation nếu có */}
          {geoError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(229, 72, 77, 0.12)',
                color: 'var(--danger)',
                border: '1px solid rgba(229, 72, 77, 0.25)',
                fontSize: '13px',
                marginBottom: '12px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{geoError}</div>
            </div>
          )}

          {/* Tọa độ hiện tại nếu đã lấy */}
          {lat !== null && lng !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(63, 185, 80, 0.08)',
                border: '1px solid rgba(63, 185, 80, 0.2)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--safe)' }}>
                <CheckCircle2 size={15} />
                <span style={{ fontWeight: 600 }}>Đã định vị:</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                Lat: <strong>{lat.toFixed(6)}</strong> · Lng: <strong>{lng.toFixed(6)}</strong>
                {accuracy !== null && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                    (Sai số: ±{Math.round(accuracy)}m)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Giả lập (Demo) */}
      {sourceTab === 'simulated' && (
        <div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            Bấm chọn 1 trong 5 điểm demo tại trung tâm TP.HCM (Quận 1) để gán tọa độ tức thì, hoặc nhập tọa độ tùy ý:
          </p>

          {/* Danh sách 5 điểm demo */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {mockPois.map((p) => {
              const isSelected =
                lat !== null &&
                lng !== null &&
                Math.abs(lat - p.latitude) < 0.0001 &&
                Math.abs(lng - p.longitude) < 0.0001;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSetCoordinates(p.latitude, p.longitude)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--line)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? '#38bdf8' : 'var(--text)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {p.type} · {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2 ô nhập tay lat / lng */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 140px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat !== null ? lat : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onSetCoordinates(isNaN(val) ? 0 : val, lng ?? 106.7032);
                }}
                placeholder="10.7743"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            <div style={{ flex: '1 1 140px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                }}
              >
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng !== null ? lng : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onSetCoordinates(lat ?? 10.7743, isNaN(val) ? 0 : val);
                }}
                placeholder="106.7032"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
