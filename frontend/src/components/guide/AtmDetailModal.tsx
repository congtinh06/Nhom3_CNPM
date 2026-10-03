import React, { useState, useEffect } from 'react';
import { Poi } from '../../types/poi';
import { useTranslation } from '../../locales/i18n';
import { X, Volume2, CreditCard, ArrowDownCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AtmDetailModalProps {
  poi: Poi | null;
  isOpen: boolean;
  onClose: () => void;
  onSpeakText: (text: string, lang?: string) => void;
}

export const AtmDetailModal: React.FC<AtmDetailModalProps> = ({
  poi,
  isOpen,
  onClose,
  onSpeakText,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !poi) return null;

  const withdrawSteps = [
    {
      num: 1,
      title: 'Kiểm tra khe thẻ & camera',
      content: t.atmFlowModal.stepWithdraw1,
      tip: 'Lắc nhẹ khe thẻ bằng 2 ngón tay. Nếu lỏng lẻo hoặc có vết cạy gắn băng dính thì không dùng.',
      isWarning: true,
    },
    {
      num: 2,
      title: 'Đưa thẻ đúng chiều',
      content: t.atmFlowModal.stepWithdraw2,
      tip: 'Mặt có chip điện tử hướng lên trên và đưa vào trước theo hướng mũi tên.',
      isWarning: false,
    },
    {
      num: 3,
      title: 'Che bàn phím khi bấm PIN',
      content: t.atmFlowModal.stepWithdraw3,
      tip: 'Dùng lòng bàn tay hoặc ví tiền che kín phía trên bàn phím để phòng camera lén gắn phía trên.',
      isWarning: true,
    },
    {
      num: 4,
      title: 'Chọn số tiền rút',
      content: t.atmFlowModal.stepWithdraw4,
      tip: 'Hạn mức rút mỗi lần thường là 2.000.000 - 5.000.000 VNĐ. Có thể rút nhiều lần nếu cần thêm.',
      isWarning: false,
    },
    {
      num: 5,
      title: 'Nhận thẻ TRƯỚC, nhận tiền SAU',
      content: t.atmFlowModal.stepWithdraw5,
      tip: 'CẢNH BÁO: Máy ATM tại Việt Nam sẽ nuốt lại thẻ nếu bạn không lấy sau 30 giây! Hãy cất thẻ trước rồi mới lấy tiền.',
      isWarning: true,
    },
  ];

  const depositSteps = [
    {
      num: 1,
      title: 'Xác thực tài khoản',
      content: t.atmFlowModal.stepDeposit1,
      tip: 'Chọn Nạp tiền trên màn hình cảm ứng, đưa thẻ hoặc CCCD gắn chip vào khe nhận diện.',
      isWarning: false,
    },
    {
      num: 2,
      title: 'Chuẩn bị tiền giấy',
      content: t.atmFlowModal.stepDeposit2,
      tip: 'Vuốt thẳng mép tiền, không gập đôi. Bỏ hết ghim bấm, dây thun, băng dính trước khi nạp.',
      isWarning: true,
    },
    {
      num: 3,
      title: 'Đặt tiền vào khay nạp tự động',
      content: t.atmFlowModal.stepDeposit3,
      tip: 'Khay nhận tối đa 100 - 200 tờ/lần. Máy sẽ trả lại các tờ bị rách hoặc gấp góc để bạn lấy lại.',
      isWarning: false,
    },
  ];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="atm-detail-title"
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ backgroundColor: 'var(--bg)', borderBottom: '1.5px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {poi.bankName}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {poi.isIndoor ? t.guide.indoor : t.guide.outdoor}
              </span>
            </div>
            <h2 id="atm-detail-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
              {poi.name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {poi.address}
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
              color: 'var(--text-muted)',
              borderRadius: '6px',
            }}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '4px 20px 0 20px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('withdraw')}
            style={{
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'withdraw' ? '3px solid var(--primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'withdraw' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CreditCard size={18} />
            <span>{t.atmFlowModal.tabWithdraw}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deposit')}
            style={{
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'deposit' ? '3px solid var(--primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'deposit' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ArrowDownCircle size={18} />
            <span>{t.atmFlowModal.tabDeposit}</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(activeTab === 'withdraw' ? withdrawSteps : depositSteps).map((step) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: step.isWarning ? 'rgba(158, 31, 24, 0.04)' : 'var(--bg)',
                border: step.isWarning ? '1.5px solid rgba(158, 31, 24, 0.3)' : '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: step.isWarning ? 'var(--danger)' : 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '15px',
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: step.isWarning ? 'var(--danger)' : 'var(--text)' }}>
                    {step.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onSpeakText(`${step.title}. ${step.content}`, language)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                    title={t.atmFlowModal.listenStep}
                  >
                    <Volume2 size={14} />
                    <span>{t.atmFlowModal.listenStep}</span>
                  </button>
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text)' }}>
                  {step.content}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    fontSize: '12px',
                    color: step.isWarning ? 'var(--danger)' : 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  {step.isWarning ? <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> : <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <span>{step.tip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ minHeight: '44px', padding: '8px 24px', fontSize: '14px' }}
          >
            {t.atmFlowModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
