import React from 'react';
import { WifiOff, AlertCircle, Info, RefreshCw } from 'lucide-react';

export interface StateMessageProps {
  type: 'offline' | 'error' | 'empty' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateMessage: React.FC<StateMessageProps> = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'offline':
        return {
          icon: <WifiOff size={28} />,
          color: 'var(--warning)',
          bg: 'rgba(122, 74, 0, 0.08)',
          border: 'rgba(122, 74, 0, 0.25)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={28} />,
          color: 'var(--danger)',
          bg: 'rgba(158, 31, 24, 0.08)',
          border: 'rgba(158, 31, 24, 0.25)',
        };
      case 'empty':
        return {
          icon: <Info size={28} />,
          color: 'var(--text-muted)',
          bg: 'rgba(74, 74, 74, 0.06)',
          border: 'var(--border)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={28} />,
          color: 'var(--primary)',
          bg: 'rgba(10, 79, 150, 0.08)',
          border: 'rgba(10, 79, 150, 0.25)',
        };
    }
  };

  const { icon, color, bg, border } = getIconAndColor();

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '8px',
        backgroundColor: bg,
        border: `1.5px solid ${border}`,
        margin: '16px 0',
      }}
    >
      <div style={{ color, flexShrink: 0, marginTop: '2px' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px 0',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
          {message}
        </p>
        {actionLabel && onAction && (
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '56px',
                padding: '12px 20px',
                borderRadius: '6px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1.5px solid var(--border)',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={18} />
              <span>{actionLabel}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
