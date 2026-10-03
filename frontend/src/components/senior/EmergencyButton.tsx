import React, { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { useTranslation } from '../../locales/i18n';
import { EmergencyHelpModal } from './EmergencyHelpModal';

export const EmergencyButton: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '36px',
            padding: '0 14px',
            borderRadius: '18px',
            backgroundColor: '#fff',
            color: 'var(--danger)',
            border: '1.5px solid var(--danger)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(158, 31, 24, 0.18)',
            transition: 'box-shadow 0.15s ease, background-color 0.15s ease',
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(158, 31, 24, 0.06)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(158, 31, 24, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(158, 31, 24, 0.18)';
          }}
          aria-label={t.nav.emergencyBadge}
        >
          <PhoneCall size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span>{t.nav.emergencyBadge}</span>
        </button>
      </div>

      <EmergencyHelpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
