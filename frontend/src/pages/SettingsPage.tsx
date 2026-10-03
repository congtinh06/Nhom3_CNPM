import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences, TextSize, SpeechRate, AppLanguage } from '../context/PreferencesContext';
import { seniorTranslations } from '../data/seniorI18n';
import { ArrowLeft, Check, Sun, Eye, Volume2, Activity, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    textSize,
    theme,
    speechRate,
    autoRead,
    reduceMotion,
    setLanguage,
    setTextSize,
    setTheme,
    setSpeechRate,
    setAutoRead,
    setReduceMotion,
  } = usePreferences();

  const t = seniorTranslations[language].settings;

  const languages: { code: AppLanguage; label: string }[] = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh', label: '中文' },
  ];

  return (
    <div className="app-container" style={{ padding: '24px 24px 80px 24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Top back button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '48px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1.5px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          <span>{t.backBtn}</span>
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'calc(22px * var(--font-scale, 1))', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px 0' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 'var(--body-font-size)', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
          {t.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* 1. Text Size Scaling */}
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            {t.textSize}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            {(['100%', '125%', '150%'] as TextSize[]).map((size) => {
              const isSelected = textSize === size;
              const labels: Record<TextSize, string> = {
                '100%': '100% (Chuẩn)',
                '125%': '125% (Lớn)',
                '150%': '150% (Rất lớn)',
              };
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTextSize(size)}
                  style={{
                   minHeight: '44px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    backgroundColor: isSelected ? 'rgba(10, 79, 150, 0.08)' : 'var(--surface)',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isSelected && <Check size={18} />}
                  <span>{labels[size]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Theme & Contrast */}
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            {t.theme}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                minHeight: '44px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: theme === 'light' ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                backgroundColor: theme === 'light' ? 'rgba(10, 79, 150, 0.08)' : 'var(--surface)',
                color: theme === 'light' ? 'var(--primary)' : 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Sun size={20} />
              <span>{t.themeLight}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('high-contrast')}
              style={{
                minHeight: '44px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: theme === 'high-contrast' ? '2px solid #FFFF00' : '1.5px solid var(--border)',
                backgroundColor: theme === 'high-contrast' ? '#000000' : 'var(--surface)',
                color: theme === 'high-contrast' ? '#FFFFFF' : 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Eye size={20} />
              <span>{t.themeHighContrast}</span>
            </button>
          </div>
        </div>

        {/* 3. Speech Rate */}
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            {t.speechRate}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {([0.75, 1.0] as SpeechRate[]).map((rate) => {
              const isSelected = speechRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  style={{
                   minHeight: '44px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    backgroundColor: isSelected ? 'rgba(10, 79, 150, 0.08)' : 'var(--surface)',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Volume2 size={20} />
                  <span>{rate === 0.75 ? t.rateSlow : t.rateNormal}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Motion & Auto-read Toggles */}
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text)',
              userSelect: 'none',
              minHeight: '40px',
            }}
          >
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <Activity size={16} style={{ color: 'var(--text-muted)' }} />
            <span>{t.reduceMotion}</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text)',
              userSelect: 'none',
              minHeight: '40px',
            }}
          >
            <input
              type="checkbox"
              checked={autoRead}
              onChange={(e) => setAutoRead(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <Volume2 size={16} style={{ color: 'var(--text-muted)' }} />
            <span>{t.autoRead}</span>
          </label>
        </div>

        {/* 5. Language Selection (Native names without flags) */}
        <div
          style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Globe size={16} style={{ color: 'var(--primary)' }} />
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {t.language}
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  style={{
                   minHeight: '40px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    backgroundColor: isSelected ? 'rgba(10, 79, 150, 0.08)' : 'var(--surface)',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isSelected && <Check size={16} />}
                  <span>{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
