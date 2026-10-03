import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../locales/i18n';
import { Phone, ShieldAlert, Copy, Check, X, AlertTriangle, CreditCard } from 'lucide-react';

interface EmergencyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BANK_HOTLINES = [
  { bank: 'Vietcombank', phone: '1900 545413', desc: 'Trung tâm DVKH 24/7' },
  { bank: 'BIDV', phone: '1900 9247', desc: 'Tổng đài hỗ trợ khẩn cấp' },
  { bank: 'Techcombank', phone: '1800 588822', desc: 'Miễn cước 24/7' },
  { bank: 'VietinBank', phone: '1900 558868', desc: 'Hỗ trợ thẻ & ngân hàng' },
  { bank: 'Agribank', phone: '1900 558818', desc: 'Dịch vụ khách hàng 24/7' },
  { bank: 'MB Bank', phone: '1900 545426', desc: 'Hỗ trợ khẩn cấp 24/7' },
  { bank: 'ACB', phone: '1900 545486', desc: 'Trung tâm CSKH ACB' },
  { bank: 'Sacombank', phone: '1800 585888', desc: 'Đường dây nóng 24/7' },
];

export const EmergencyHelpModal: React.FC<EmergencyHelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyNote = () => {
    navigator.clipboard?.writeText(t.emergencyModal.helperNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{ backgroundColor: 'var(--danger)', color: '#ffffff', borderBottom: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={28} style={{ color: '#ffffff', flexShrink: 0 }} />
            <div>
              <h2
                id="emergency-modal-title"
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                {t.emergencyModal.title}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                {t.emergencyModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Bước 1: Khóa thẻ khẩn cấp */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(158, 31, 24, 0.08)',
              border: '1.5px solid var(--danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CreditCard size={22} style={{ color: 'var(--danger)' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>
                {t.emergencyModal.step1Title}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text)' }}>
              {t.emergencyModal.step1Desc}
            </p>
          </div>

          {/* Bước 2: Danh bạ hotline ngân hàng */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
              {t.emergencyModal.step2Title}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '10px',
              }}
            >
              {BANK_HOTLINES.map((item) => (
                <a
                  key={item.bank}
                  href={`tel:${item.phone.replace(/\s+/g, '')}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.bank}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    <Phone size={14} />
                    <span>{item.phone}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Bước 3: Công an & Du khách */}
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
              {t.emergencyModal.step3Title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="tel:113"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1.5px solid #ef4444',
                  color: '#991b1b',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                }}
              >
                <ShieldAlert size={20} />
                <span>{t.emergencyModal.policeNumber}</span>
              </a>

              <a
                href="tel:0693187200"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#e0f2fe',
                  border: '1.5px solid #0284c7',
                  color: '#075985',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <Phone size={18} />
                <span>{t.emergencyModal.cyberPolice}</span>
              </a>

              <a
                href="tel:19008888"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <Phone size={18} />
                <span>{t.emergencyModal.touristSupport}</span>
              </a>
            </div>
          </div>

          {/* Mẩu tin nhắn tiếng Việt hỗ trợ du khách */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg)',
              border: '1px dashed var(--border)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              {t.emergencyModal.helperNoteTitle}
            </div>
            <div
              style={{
                fontStyle: 'italic',
                fontSize: '14px',
                color: 'var(--text)',
                lineHeight: 1.6,
                backgroundColor: 'var(--surface)',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginBottom: '10px',
              }}
            >
              "{t.emergencyModal.helperNote}"
            </div>
            <button
              type="button"
              onClick={handleCopyNote}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: copied ? 'var(--safe)' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t.emergencyModal.copied : t.emergencyModal.copyBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ minHeight: '44px', padding: '8px 20px', fontSize: '14px' }}
          >
            {t.emergencyModal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
