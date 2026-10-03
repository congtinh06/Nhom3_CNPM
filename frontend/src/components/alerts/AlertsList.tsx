import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Inbox, ChevronDown } from 'lucide-react';
import { AlertItem, LearnScenario } from '../../types/alert';
import { AlertCard } from './AlertCard';
import rawAlerts from '../../data/alerts.json';
import { useSpeech } from '../../hooks/useSpeech';

interface AlertsListProps {
  language: string;
  onNavigateToScenario?: (scenario: LearnScenario) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({ language, onNavigateToScenario }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // TTS speech hook
  const { isSpeaking, speakText, stopSpeaking } = useSpeech(language);
  const [activeSpeechAlertId, setActiveSpeechAlertId] = useState<string | null>(null);

  // Audience filter: 'all' | 'resident' | 'tourist'
  const currentAudienceParam = searchParams.get('audience') || 'all';
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'resident' | 'tourist'>(
    currentAudienceParam === 'resident' || currentAudienceParam === 'tourist'
      ? currentAudienceParam
      : 'all'
  );

  // Sync state if URL changes externally
  useEffect(() => {
    const aud = searchParams.get('audience');
    if (aud === 'resident' || aud === 'tourist') {
      setAudienceFilter(aud);
    } else {
      setAudienceFilter('all');
    }
  }, [searchParams]);

  // Handle filter change and update URL search param
  const handleFilterChange = (filter: 'all' | 'resident' | 'tourist') => {
    setAudienceFilter(filter);
    const newParams = new URLSearchParams(searchParams);
    if (filter === 'all') {
      newParams.delete('audience');
    } else {
      newParams.set('audience', filter);
    }
    setSearchParams(newParams, { replace: true });
    setVisibleCount(6);
  };

  // Pagination (show first 6, load more on click)
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Determine if dev or ?demo=1 is active
  const isDevOrDemo =
    import.meta.env.DEV ||
    location.search.includes('demo=1') ||
    import.meta.env.VITE_SHOW_DEMO === 'true';

  const isEn = language.startsWith('en');

  // Process and sort alerts
  const { filteredAlerts, lastUpdatedDate } = useMemo(() => {
    const list = rawAlerts as AlertItem[];

    // 1. Filter verified vs unverified sample data
    let visible = list.filter((item) => {
      if (item.verified) return true;
      return isDevOrDemo;
    });

    // Calculate newest date across all available items before audience filter
    let newestDate: string | null = null;
    visible.forEach((item) => {
      if (!newestDate || item.publishedAt > newestDate) {
        newestDate = item.publishedAt;
      }
    });

    // 2. Filter by audience
    if (audienceFilter !== 'all') {
      visible = visible.filter((item) => item.audience.includes(audienceFilter));
    }

    // 3. Helper to determine if older than 90 days
    const isOld = (item: AlertItem) => {
      if (item.evergreen) return false;
      try {
        const pub = new Date(item.publishedAt).getTime();
        return Date.now() - pub > 90 * 24 * 3600 * 1000;
      } catch {
        return false;
      }
    };

    // 4. Sort:
    // - Non-old items first, old items last
    // - If non-Vietnamese interface, prioritize tourist items
    // - Newest publishedAt first
    visible.sort((a, b) => {
      const aOld = isOld(a);
      const bOld = isOld(b);

      if (aOld !== bOld) {
        return aOld ? 1 : -1;
      }

      // If interface is English or other foreign languages, bubble tourist items
      if (!language.startsWith('vi')) {
        const aTourist = a.audience.includes('tourist');
        const bTourist = b.audience.includes('tourist');
        if (aTourist !== bTourist) {
          return aTourist ? -1 : 1;
        }
      }

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return { filteredAlerts: visible, lastUpdatedDate: newestDate };
  }, [audienceFilter, isDevOrDemo, language]);

  // Format the latest updated date
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdatedDate) return '—';
    try {
      const d = new Date(lastUpdatedDate);
      return d.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return lastUpdatedDate;
    }
  }, [lastUpdatedDate, isEn]);

  // Handle audio speech toggle per card
  const handleToggleSpeech = (alert: AlertItem) => {
    if (activeSpeechAlertId === alert.id && isSpeaking) {
      stopSpeaking();
      setActiveSpeechAlertId(null);
      return;
    }

    stopSpeaking();
    setActiveSpeechAlertId(alert.id);

    const localized = alert.i18n[isEn ? 'en' : 'vi'] || alert.i18n.vi || alert.i18n.en;
    const signsIntro = isEn ? 'Warning signs:' : 'Dấu hiệu nhận biết:';
    const actionIntro = isEn ? 'Recommended action:' : 'Việc nên làm:';

    const textToSpeak = `${localized.title}. ${signsIntro} ${localized.signs.join('. ')}. ${actionIntro} ${localized.action}.`;
    speakText(textToSpeak);
  };

  // Sync active speech state if speech stops automatically
  useEffect(() => {
    if (!isSpeaking) {
      setActiveSpeechAlertId(null);
    }
  }, [isSpeaking]);

  const displayedAlerts = filteredAlerts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAlerts.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Info Banner: Subtitle + Last Updated date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingBottom: '4px',
        }}
      >
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {isEn
            ? `Recent bank scams reported in HCMC. Last updated: ${formattedLastUpdated}.`
            : `Các chiêu lừa đang xuất hiện gần đây tại TP.HCM. Cập nhật lần cuối: ${formattedLastUpdated}.`}
        </p>

        {!isDevOrDemo && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {isEn ? 'Verified official alerts only' : 'Chỉ hiển thị cảnh báo đã kiểm chứng'}
          </span>
        )}
      </div>

      {/* Filter Chips Bar (WCAG AA compliant) */}
      <div
        role="group"
        aria-label={isEn ? 'Filter by target audience' : 'Lọc theo đối tượng'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginRight: '4px' }}>
          {isEn ? 'Audience:' : 'Đối tượng:'}
        </span>

        {[
          { key: 'all', label: isEn ? 'All' : 'Tất cả' },
          { key: 'resident', label: isEn ? 'Residents' : 'Người dân' },
          { key: 'tourist', label: isEn ? 'Tourists' : 'Du khách' },
        ].map((chip) => {
          const isSelected = audienceFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleFilterChange(chip.key as any)}
              aria-pressed={isSelected}
              style={{
                minHeight: '36px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: isSelected ? 600 : 500,
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? '#ffffff' : 'var(--text)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {displayedAlerts.length === 0 && (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '48px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '12px 0',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '14px',
            }}
          >
            <Inbox size={26} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px 0' }}>
            {isEn ? 'No alerts found for this group' : 'Chưa có cảnh báo nào cho nhóm này'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0', maxWidth: '380px', lineHeight: 1.5 }}>
            {isEn
              ? 'Try switching the filter to All to view other ongoing bank security alerts.'
              : 'Hãy thử chuyển bộ lọc sang Tất cả để xem các cảnh báo an ninh ngân hàng khác.'}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleFilterChange('all')}
            style={{ minHeight: '38px', padding: '0 16px', fontSize: '13px' }}
          >
            {isEn ? 'Show all alerts' : 'Xem tất cả cảnh báo'}
          </button>
        </div>
      )}

      {/* Alerts Grid: 2-3 columns on desktop, 1 column on mobile (gap >= 16px) */}
      {displayedAlerts.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '20px',
          }}
        >
          {displayedAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              language={language}
              isSpeakingThis={activeSpeechAlertId === alert.id && isSpeaking}
              onToggleSpeech={handleToggleSpeech}
              onNavigateToScenario={onNavigateToScenario}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            style={{
              minHeight: '42px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{isEn ? 'Load more alerts' : 'Xem thêm cảnh báo'}</span>
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
