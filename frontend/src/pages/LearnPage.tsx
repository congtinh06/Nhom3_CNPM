import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { seniorTranslations } from '../data/seniorI18n';
import { StepCarousel, StepItem } from '../components/senior/StepCarousel';
import { RealVsFake } from '../components/senior/RealVsFake';
import { AlertsList } from '../components/alerts/AlertsList';
import { LearnScenario } from '../types/alert';
import {
  CreditCard,
  QrCode,
  PhoneCall,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  ImageIcon,
  BookOpen,
  BellRing,
} from 'lucide-react';

export const LearnPage: React.FC = () => {
  const { language } = usePreferences();
  const t = seniorTranslations[language]?.learn || seniorTranslations['vi'].learn;
  const isEn = language.startsWith('en');

  // URL search params for tab synchronization (?tab=recent)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'recent' ? 'recent' : 'common';

  const handleTabChange = (newTab: 'common' | 'recent') => {
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 'recent') {
      nextParams.set('tab', 'recent');
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const [selectedCatId, setSelectedCatId] = useState<'atm_skimmer' | 'fake_qr' | 'fake_call'>('atm_skimmer');
  const currentCategory = t.categories.find((c) => c.id === selectedCatId) || t.categories[0];

  // Callback to switch to "Thủ đoạn thường gặp" tab and select specific scenario
  const handleNavigateToScenario = (scenario: LearnScenario) => {
    let catId: 'atm_skimmer' | 'fake_qr' | 'fake_call' = 'atm_skimmer';
    if (scenario === 'qr') catId = 'fake_qr';
    if (scenario === 'call') catId = 'fake_call';

    setSelectedCatId(catId);
    handleTabChange('common');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build the 5 steps for StepCarousel without duplicating category titles
  const steps: StepItem[] = [
    {
      title: t.step1Title,
      speechText: `${currentCategory.title}. ${currentCategory.howItLooks}`,
      content: (
        <div>
          {/* 16:9 illustration placeholder */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              maxHeight: '180px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              marginBottom: '14px',
            }}
          >
            <ImageIcon size={18} style={{ opacity: 0.6 }} />
            <span>Hình ảnh nhận diện thiết bị / dấu hiệu nghi vấn</span>
          </div>

          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 10px 0' }}>
            {currentCategory.howItLooks}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {currentCategory.shortDesc}
          </p>
        </div>
      ),
    },
    {
      title: t.step2Title,
      speechText: `So sánh thật và giả. ${currentCategory.realVsFake.items.map((i) => `${i.label}. Thật: ${i.realText}. Giả: ${i.fakeText}.`).join(' ')}`,
      content: (
        <RealVsFake
          realTitle={currentCategory.realVsFake.realTitle}
          fakeTitle={currentCategory.realVsFake.fakeTitle}
          items={currentCategory.realVsFake.items}
        />
      ),
    },
    {
      title: t.step3Title,
      speechText: `Dấu hiệu nhận biết. ${currentCategory.redFlags.join('. ')}`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentCategory.redFlags.map((flag, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(122, 82, 0, 0.05)',
                border: '1px solid rgba(122, 82, 0, 0.2)',
              }}
            >
              <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text)' }}>
                {flag}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t.step4Title,
      speechText: `Bạn cần làm gì. ${currentCategory.whatToDo}`,
      content: (
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(26, 107, 58, 0.05)',
            border: '1px solid rgba(26, 107, 58, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--safe)', flexShrink: 0 }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--safe)' }}>
              Hành động an toàn nên làm
            </span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
            {currentCategory.whatToDo}
          </p>
        </div>
      ),
    },
    {
      title: t.step5Title,
      speechText: `Nếu đã lỡ xảy ra. ${currentCategory.ifHappened}`,
      content: (
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(179, 38, 30, 0.05)',
            border: '1px solid rgba(179, 38, 30, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--danger)' }}>
              Nếu nghi ngờ bị lộ thông tin:
            </span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
            {currentCategory.ifHappened}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="app-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '18px' }}>
        <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
          {t.title}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          {t.subtitle}
        </p>
      </div>

      {/* 2. Top-level Segmented Control: "Thủ đoạn thường gặp" (default) vs "Cảnh báo gần đây" */}
      <div
        role="tablist"
        aria-label="Chế độ học nhận biết"
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
          border: '1px solid var(--border)',
          marginBottom: '22px',
          maxWidth: '460px',
        }}
      >
        <button
          id="tab-common"
          role="tab"
          type="button"
          aria-selected={activeTab === 'common'}
          aria-controls="panel-common"
          onClick={() => handleTabChange('common')}
          style={{
            flex: 1,
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: activeTab === 'common' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'common' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'common' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: activeTab === 'common' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '38px',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={16} />
          <span>{isEn ? 'Common Tactics' : 'Thủ đoạn thường gặp'}</span>
        </button>

        <button
          id="tab-recent"
          role="tab"
          type="button"
          aria-selected={activeTab === 'recent'}
          aria-controls="panel-recent"
          onClick={() => handleTabChange('recent')}
          style={{
            flex: 1,
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: activeTab === 'recent' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'recent' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'recent' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: activeTab === 'recent' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '38px',
            transition: 'all 0.15s ease',
          }}
        >
          <BellRing size={16} />
          <span>{isEn ? 'Recent Alerts' : 'Cảnh báo gần đây'}</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'recent' ? (
        <div id="panel-recent" role="tabpanel" aria-labelledby="tab-recent">
          <AlertsList language={language} onNavigateToScenario={handleNavigateToScenario} />
        </div>
      ) : (
        <div id="panel-common" role="tabpanel" aria-labelledby="tab-common">
          {/* 3 Scenario Selector Cards (Segmented, short text, small icons) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {t.categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              const getIcon = () => {
                if (cat.id === 'atm_skimmer') return <CreditCard size={18} />;
                if (cat.id === 'fake_qr') return <QrCode size={18} />;
                return <PhoneCall size={18} />;
              };

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '52px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                    color: isSelected ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isSelected ? '0 1px 3px rgba(11,79,156,0.1)' : 'var(--shadow-card)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                    {getIcon()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: isSelected ? 600 : 500, lineHeight: 1.3 }}>
                    {cat.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sequential Step Carousel for Selected Category */}
          <StepCarousel
            key={selectedCatId}
            steps={steps}
            stepIndicatorText={t.stepIndicator}
            prevBtnText={t.prevBtn}
            nextBtnText={t.nextBtn}
            langCode={language}
          />
        </div>
      )}
    </div>
  );
};

