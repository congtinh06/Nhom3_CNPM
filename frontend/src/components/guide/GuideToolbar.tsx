import React from 'react';
import { Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import { usePreferences, AppLanguage } from '../../context/PreferencesContext';

interface GuideToolbarProps {
  isLocating: boolean;
  isAutoWatch: boolean;
  onToggleAutoWatch: (enabled: boolean) => void;
  onRequestRealLocation: () => void;
  geoError: string | null;
}

const LANGUAGE_OPTIONS: { code: AppLanguage; label: string }[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
];

export const GuideToolbar: React.FC<GuideToolbarProps> = ({
  isLocating,
  isAutoWatch,
  onToggleAutoWatch,
  onRequestRealLocation,
  geoError,
}) => {
  const { language, setLanguage } = usePreferences();

  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Language selector chips (Native names, no flags) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginRight: '2px',
            }}
          >
            Ngôn ngữ:
          </span>
          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isActive = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  style={{
                    minHeight: '44px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isActive ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                    color: isActive ? '#ffffff' : 'var(--text)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* GPS location actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              cursor: 'pointer',
              color: 'var(--text)',
              userSelect: 'none',
              minHeight: '44px',
            }}
          >
            <input
              type="checkbox"
              checked={isAutoWatch}
              onChange={(e) => onToggleAutoWatch(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontWeight: 600 }}>Tự động theo dõi GPS</span>
          </label>

          <button
            type="button"
            onClick={onRequestRealLocation}
            disabled={isLocating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '48px',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLocating ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              opacity: isLocating ? 0.7 : 1,
            }}
          >
            {isLocating ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Đang định vị…</span>
              </>
            ) : (
              <>
                <Navigation size={16} />
                <span>Vị trí thật (GPS)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Geolocation Error if any */}
      {geoError && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: 'rgba(158, 31, 24, 0.08)',
            color: 'var(--danger)',
            border: '1.5px solid var(--danger)',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
};
