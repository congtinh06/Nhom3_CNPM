import React from 'react';
import { History, Play, MapPin } from 'lucide-react';
import { Poi, Narration } from '../../types/poi';

export interface HistoryItem {
  poi: Poi;
  distanceMeters: number;
  narration: Narration;
  timestamp: string;
}

interface RecentHistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const RecentHistoryList: React.FC<RecentHistoryListProps> = ({
  history,
  onSelect,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '16px',
        borderRadius: '4px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          color: 'var(--text)',
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <History size={15} style={{ color: '#0284c7' }} />
        <span>Điểm đã nghe gần đây</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {history.map((item, idx) => (
          <div
            key={`${item.poi.id}-${item.timestamp}-${idx}`}
            onClick={() => onSelect(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              gap: '12px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.poi.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {item.poi.type}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{item.poi.bankName}</span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={11} /> {item.distanceMeters}m
                </span>
                <span>·</span>
                <span>{item.narration.locale.toUpperCase()}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {item.timestamp}
              </span>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Play size={11} fill="currentColor" />
                <span>Phát lại</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
