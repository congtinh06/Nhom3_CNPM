import React from 'react';
import { Poi, Narration } from '../../types/poi';
import { Volume2, Square, MapPin, Building2, CreditCard, ArrowRightLeft } from 'lucide-react';

interface PoiCardProps {
  poi: Poi;
  distanceMeters: number;
  narration: Narration;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  ttsNotice: string | null;
}

export const PoiCard: React.FC<PoiCardProps> = ({
  poi,
  distanceMeters,
  narration,
  isSpeaking,
  onToggleSpeak,
  ttsNotice,
}) => {
  const renderBadge = () => {
    switch (poi.type) {
      case 'ATM':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <CreditCard size={13} />
            ATM
          </span>
        );
      case 'BRANCH':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <Building2 size={13} />
            Chi nhánh
          </span>
        );
      case 'FX_EXCHANGE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <ArrowRightLeft size={13} />
            Đổi ngoại tệ
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: 'rgba(125, 132, 136, 0.2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--line)',
            }}
          >
            {poi.type}
          </span>
        );
    }
  };

  return (
    <div
      className="panel"
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header card: Tên điểm, badge, khoảng cách */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {poi.name}
            </h2>
            {renderBadge()}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {poi.bankName}
          </div>
        </div>

        {/* Pill khoảng cách */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(63, 185, 80, 0.12)',
            color: 'var(--safe)',
            border: '1px solid rgba(63, 185, 80, 0.3)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <MapPin size={14} />
          Cách bạn {distanceMeters} m
        </div>
      </div>

      {/* Địa chỉ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '14px',
          marginBottom: '20px',
        }}
      >
        <MapPin size={16} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
        <span>{poi.address}</span>
      </div>

      {/* Hộp thuyết minh */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderLeft: '4px solid #38bdf8',
          borderTop: '1px solid var(--line)',
          borderRight: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '18px 20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            Thuyết minh tự động
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {narration.locale.toUpperCase()} ({narration.ttsLang})
          </span>
        </div>
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'var(--text)',
            margin: 0,
          }}
        >
          {narration.text}
        </p>
      </div>

      {/* Action controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={onToggleSpeak}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: isSpeaking ? '1px solid rgba(229, 72, 77, 0.4)' : '1px solid #38bdf8',
            backgroundColor: isSpeaking ? 'rgba(229, 72, 77, 0.15)' : '#38bdf8',
            color: isSpeaking ? '#f87171' : '#0c0d0e',
          }}
        >
          {isSpeaking ? (
            <>
              <Square size={16} fill="currentColor" />
              Dừng phát âm
            </>
          ) : (
            <>
              <Volume2 size={16} />
              Nghe thuyết minh
            </>
          )}
        </button>

        {isSpeaking && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--safe)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--safe)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--safe)',
              }}
            />
            Đang phát âm thanh…
          </div>
        )}
      </div>

      {/* Thông báo lỗi giọng đọc nhỏ (nếu có) */}
      {ttsNotice && (
        <div
          style={{
            marginTop: '14px',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'rgba(210, 153, 34, 0.12)',
            color: 'var(--warn)',
            border: '1px solid rgba(210, 153, 34, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {ttsNotice}
        </div>
      )}
    </div>
  );
};
