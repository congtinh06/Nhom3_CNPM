import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { RealVsFakeItem } from '../../data/seniorI18n';

interface RealVsFakeProps {
  realTitle: string;
  fakeTitle: string;
  items: RealVsFakeItem[];
}

export const RealVsFake: React.FC<RealVsFakeProps> = ({
  realTitle,
  fakeTitle,
  items,
}) => {
  const [mobileTab, setMobileTab] = useState<'real' | 'fake'>('real');

  return (
    <div style={{ margin: '16px 0' }}>
      <style>{`
        .real-vs-fake-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .real-vs-fake-mobile-toggle {
          display: none;
        }
        @media (max-width: 768px) {
          .real-vs-fake-grid {
            display: block;
          }
          .real-vs-fake-mobile-toggle {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
        }
      `}</style>

      {/* Mobile Toggle Buttons (Min-height 56px) */}
      <div className="real-vs-fake-mobile-toggle">
        <button
          type="button"
          onClick={() => setMobileTab('real')}
          style={{
            flex: 1,
            minHeight: '56px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            border: mobileTab === 'real' ? '2.5px solid var(--safe)' : '1.5px solid var(--border)',
            backgroundColor: mobileTab === 'real' ? 'rgba(20, 89, 47, 0.1)' : 'var(--surface)',
            color: mobileTab === 'real' ? 'var(--safe)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{realTitle}</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('fake')}
          style={{
            flex: 1,
            minHeight: '56px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            border: mobileTab === 'fake' ? '2.5px solid var(--danger)' : '1.5px solid var(--border)',
            backgroundColor: mobileTab === 'fake' ? 'rgba(158, 31, 24, 0.1)' : 'var(--surface)',
            color: mobileTab === 'fake' ? 'var(--danger)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <XCircle size={20} />
          <span>{fakeTitle}</span>
        </button>
      </div>

      <div className="real-vs-fake-grid">
        {/* Column 1: Real (Example Bank) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '24px',
            borderRadius: '8px',
            border: '2px solid var(--safe)',
            backgroundColor: 'var(--surface)',
            ...(typeof window !== 'undefined' && window.innerWidth <= 768 && mobileTab !== 'real'
              ? { display: 'none' }
              : {}),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px' }}>
            <CheckCircle2 size={26} style={{ color: 'var(--safe)', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--safe)', margin: 0 }}>
                {realTitle}
              </h4>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                Ngân hàng mẫu &quot;Example Bank&quot;
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
            {items.map((item) => (
              <div key={`real-${item.id}`} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--safe)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.id}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                    {item.realText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Fake */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '24px',
            borderRadius: '8px',
            border: '2px solid var(--danger)',
            backgroundColor: 'var(--surface)',
            ...(typeof window !== 'undefined' && window.innerWidth <= 768 && mobileTab !== 'fake'
              ? { display: 'none' }
              : {}),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px' }}>
            <XCircle size={26} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>
                {fakeTitle}
              </h4>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                Dấu hiệu nhận biết kẻ gian
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '6px' }}>
            {items.map((item) => (
              <div key={`fake-${item.id}`} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.id}
                </span>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '19px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                    {item.fakeText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
