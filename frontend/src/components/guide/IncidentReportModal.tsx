import React, { useState, useEffect } from 'react';
import { Poi } from '../../types/poi';
import { useTranslation } from '../../locales/i18n';
import { X, CheckCircle, ShieldAlert } from 'lucide-react';

interface IncidentReportModalProps {
  poi: Poi | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (poiId: number | string, incidentType: string, desc: string) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  poi,
  isOpen,
  onClose,
  onSubmitIncident,
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<string>('option1');
  const [desc, setDesc] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setDesc('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !poi) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitIncident(poi.id, selectedOption, desc);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const options = [
    { id: 'option1', label: t.incidentModal.option1 },
    { id: 'option2', label: t.incidentModal.option2 },
    { id: 'option3', label: t.incidentModal.option3 },
    { id: 'option4', label: t.incidentModal.option4 },
  ];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header" style={{ backgroundColor: '#fffbeb', borderBottom: '1.5px solid #fef3c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} style={{ color: '#d97706' }} />
            <div>
              <h2 id="incident-modal-title" style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#92400e' }}>
                {t.incidentModal.title}
              </h2>
              <div style={{ fontSize: '13px', color: '#b45309' }}>
                {poi.name} - {poi.bankName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#92400e',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isSuccess ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 16px',
                  textAlign: 'center',
                  gap: '12px',
                }}
              >
                <CheckCircle size={48} style={{ color: 'var(--safe)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--safe)' }}>
                  {t.incidentModal.successMsg}
                </h3>
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t.incidentModal.subtitle}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {options.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: selectedOption === opt.id ? 'rgba(10, 79, 150, 0.08)' : 'var(--bg)',
                        border: selectedOption === opt.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: selectedOption === opt.id ? 600 : 500,
                      }}
                    >
                      <input
                        type="radio"
                        name="incidentOption"
                        value={opt.id}
                        checked={selectedOption === opt.id}
                        onChange={() => setSelectedOption(opt.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={3}
                    className="textarea-public"
                    placeholder={t.incidentModal.descPlaceholder}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '14px' }}
                  />
                </div>
              </>
            )}
          </div>

          {!isSuccess && (
            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ minHeight: '44px', padding: '8px 18px', fontSize: '14px' }}
              >
                {t.incidentModal.cancelBtn}
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  minHeight: '44px',
                  padding: '8px 24px',
                  fontSize: '14px',
                  backgroundColor: 'var(--danger)',
                  borderColor: 'var(--danger)',
                }}
              >
                {t.incidentModal.submitBtn}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
