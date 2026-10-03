import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { seniorTranslations } from '../data/seniorI18n';
import { useSpeech } from '../hooks/useSpeech';
import { PhoneCall, Copy, Check, ArrowRight, ArrowLeft, Volume2, Square, ShieldAlert } from 'lucide-react';

export const EmergencyHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = usePreferences();
  const t = seniorTranslations[language]?.emergency || seniorTranslations['vi'].emergency;
  const { isSpeaking, speakText, stopSpeaking } = useSpeech(language);

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyHelper = () => {
    navigator.clipboard.writeText(t.helperCardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullSpeech = `${t.title}. ${t.subtitle}. ${t.action1Title}. ${t.action1Desc}. ${t.action2Title}. ${t.action2Desc}. ${t.action3Title}. ${t.action3Desc}.`;
      speakText(fullSpeech);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '840px', paddingBottom: '40px' }}>
      {/* Top back button & Speech Read */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '40px',
            padding: '0 14px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          <span>{t.backBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleSpeak}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '40px',
            padding: '0 16px',
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: isSpeaking ? 'var(--danger)' : 'var(--primary)',
          }}
        >
          {isSpeaking ? <Square size={15} fill="currentColor" /> : <Volume2 size={16} />}
          <span>{isSpeaking ? 'Dừng đọc' : 'Nghe toàn bộ hướng dẫn'}</span>
        </button>
      </div>

      {/* Calm Emergency Header Card */}
      <div
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--danger-light)',
          border: '1px solid rgba(179, 38, 30, 0.25)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldAlert size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>
            {t.title}
          </h1>
        </div>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
          {t.subtitle}
        </p>
      </div>

      {/* 3 Numbered Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        {/* Action 1 */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {t.action1Title}
            </h2>
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0, paddingLeft: '42px' }}>
            {t.action1Desc}
          </p>
        </div>

        {/* Action 2 */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {t.action2Title}
            </h2>
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0', paddingLeft: '42px' }}>
            {t.action2Desc}
          </p>
          <div style={{ paddingLeft: '42px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid rgba(11, 79, 156, 0.25)',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <PhoneCall size={18} />
              <span>{t.action2Btn}</span>
            </div>
          </div>
        </div>

        {/* Action 3 */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--safe)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              3
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {t.action3Title}
            </h2>
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 14px 0', paddingLeft: '42px' }}>
            {t.action3Desc}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingLeft: '42px' }}>
            <a
              href="tel:113"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--danger)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                flex: '1 1 200px',
              }}
            >
              <PhoneCall size={18} />
              <span>{t.callPoliceBtn}</span>
            </a>

            <a
              href="tel:19008888"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                flex: '1 1 200px',
              }}
            >
              <PhoneCall size={18} />
              <span>{t.callEmbassyBtn}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyable Vietnamese Message for Local Helper */}
      <div
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface)',
          border: '1px dashed var(--primary)',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
          {t.helperCardTitle}
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            fontSize: '18px',
            lineHeight: 1.6,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '14px',
          }}
        >
          &quot;{t.helperCardText}&quot;
        </div>
        <button
          type="button"
          onClick={handleCopyHelper}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
            padding: '0 18px',
            borderColor: copied ? 'var(--safe)' : 'var(--border)',
            color: copied ? 'var(--safe)' : 'var(--text)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? t.copiedNotice : t.copyHelperBtn}</span>
        </button>
      </div>

      {/* Report Incident Navigation */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/report')}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
            padding: '0 20px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <span>{t.reportBtn}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
