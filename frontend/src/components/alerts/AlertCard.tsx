import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  CreditCard,
  QrCode,
  PhoneCall,
  Banknote,
  Volume2,
  Square,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { AlertItem, LearnScenario } from '../../types/alert';

interface AlertCardProps {
  alert: AlertItem;
  language: string;
  isSpeakingThis: boolean;
  onToggleSpeech: (alert: AlertItem) => void;
  onNavigateToScenario?: (scenario: LearnScenario) => void;
}

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'sms':
      return <MessageSquare size={18} style={{ color: 'var(--primary)' }} />;
    case 'atm':
      return <CreditCard size={18} style={{ color: 'var(--primary)' }} />;
    case 'qr':
      return <QrCode size={18} style={{ color: 'var(--primary)' }} />;
    case 'call':
      return <PhoneCall size={18} style={{ color: 'var(--primary)' }} />;
    case 'exchange':
      return <Banknote size={18} style={{ color: 'var(--primary)' }} />;
    default:
      return <AlertCircle size={18} style={{ color: 'var(--primary)' }} />;
  }
};

const formatRelativeTime = (dateStr: string, lang: string): string => {
  if (!dateStr) return '—';
  try {
    const pub = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24));

    if (lang === 'vi') {
      if (diffDays <= 0) return 'Hôm nay';
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
      return `${Math.floor(diffDays / 365)} năm trước`;
    } else {
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  } catch {
    return dateStr;
  }
};

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  language,
  isSpeakingThis,
  onToggleSpeech,
  onNavigateToScenario,
}) => {
  const navigate = useNavigate();

  // Localized content with fallback to vi or en
  const isEn = language.startsWith('en');
  const localized = alert.i18n[isEn ? 'en' : 'vi'] || alert.i18n.vi || alert.i18n.en;

  // Check if older than 90 days and not evergreen
  const isOld = (() => {
    if (alert.evergreen) return false;
    try {
      const pub = new Date(alert.publishedAt).getTime();
      const diffMs = Date.now() - pub;
      return diffMs > 90 * 24 * 3600 * 1000;
    } catch {
      return false;
    }
  })();

  const audienceLabel = (aud: 'resident' | 'tourist') => {
    if (aud === 'resident') return isEn ? 'Residents' : 'Người dân';
    return isEn ? 'Tourists' : 'Du khách';
  };

  const handleCheckAction = () => {
    if (!alert.related.checkChannel) return;
    navigate(`/check?channel=${alert.related.checkChannel}`);
  };

  const handleScenarioClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (alert.related.learnScenario && onNavigateToScenario) {
      onNavigateToScenario(alert.related.learnScenario);
    }
  };

  return (
    <article
      className="alert-card"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: isOld ? 0.88 : 1,
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Row 1: Icon + Title + Relative Date */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            {getCategoryIcon(alert.category)}
          </div>
          <h2
            style={{
              fontSize: '17px',
              fontWeight: 600,
              lineHeight: 1.4,
              color: 'var(--text)',
              margin: 0,
              wordBreak: 'break-word',
            }}
          >
            {localized.title}
          </h2>
        </div>

        {/* Date */}
        <span
          title={`Ngày công bố: ${alert.publishedAt}`}
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            paddingTop: '2px',
          }}
        >
          {formatRelativeTime(alert.publishedAt, isEn ? 'en' : 'vi')}
        </span>
      </div>

      {/* Row 2: Badges (Audience, Old, and Unverified Sample) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {alert.audience.map((aud) => (
          <span
            key={aud}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {audienceLabel(aud)}
          </span>
        ))}

        {isOld && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(91, 99, 107, 0.1)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {isEn ? 'Older' : 'Cũ'}
          </span>
        )}

        {!alert.verified && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(122, 82, 0, 0.08)',
              color: 'var(--warning)',
              border: '1px solid rgba(122, 82, 0, 0.2)',
            }}
          >
            {isEn ? 'Sample unverified' : 'Nội dung mẫu, chưa xác minh'}
          </span>
        )}
      </div>

      {/* Signs Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {isEn ? 'Warning signs:' : 'Dấu hiệu nhận biết:'}
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '18px',
            fontSize: '14px',
            lineHeight: 1.55,
            color: 'var(--text)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {localized.signs.map((sign, idx) => (
            <li key={idx} style={{ wordBreak: 'break-word' }}>
              {sign}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Box: Most prominent part of card */}
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(11, 79, 156, 0.05)',
          border: '1px solid rgba(11, 79, 156, 0.18)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
          {isEn ? 'Recommended action:' : 'Việc nên làm:'}
        </span>
        <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text)', margin: 0, wordBreak: 'break-word' }}>
          {localized.action}
        </p>
      </div>

      {/* Source Line */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        {alert.source.name ? (
          <span>
            {isEn ? 'Source: ' : 'Nguồn: '}
            {alert.source.url ? (
              <a
                href={alert.source.url}
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                <span>{alert.source.name}</span>
                <ExternalLink size={11} />
              </a>
            ) : (
              <span>{alert.source.name}</span>
            )}
          </span>
        ) : !alert.verified ? (
          <span style={{ fontStyle: 'italic', opacity: 0.85 }}>
            {isEn ? 'Sample data awaiting official source verification.' : 'Dữ liệu mẫu chờ xác minh từ cơ quan chính thống.'}
          </span>
        ) : null}
      </div>

      {/* Card Actions Footer: Max 1 Primary button + Secondary Listen + Text link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
          marginTop: 'auto',
        }}
      >
        {/* Left: Secondary Listen button */}
        <button
          type="button"
          onClick={() => onToggleSpeech(alert)}
          className="btn-secondary"
          style={{
            minHeight: '38px',
            padding: '0 12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-label={isSpeakingThis ? (isEn ? 'Stop reading' : 'Dừng đọc') : (isEn ? 'Listen to this alert' : 'Nghe cảnh báo này')}
        >
          {isSpeakingThis ? <Square size={13} fill="currentColor" /> : <Volume2 size={15} />}
          <span>{isSpeakingThis ? (isEn ? 'Dừng đọc' : 'Dừng đọc') : (isEn ? 'Nghe' : 'Nghe')}</span>
        </button>

        {/* Right actions: Primary check button OR text link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {alert.related.learnScenario && (
            <button
              type="button"
              onClick={handleScenarioClick}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                fontSize: '13px',
                color: 'var(--primary)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'underline',
              }}
            >
              <span>{isEn ? 'View scam guide' : 'Xem hướng dẫn nhận biết'}</span>
              <ArrowRight size={13} />
            </button>
          )}

          {alert.related.checkChannel && (
            <button
              type="button"
              onClick={handleCheckAction}
              className="btn-primary"
              style={{
                minHeight: '38px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>
                {alert.related.checkChannel === 'sms'
                  ? isEn
                    ? 'Check your SMS message'
                    : 'Kiểm tra tin nhắn của bạn'
                  : isEn
                  ? 'Check your link'
                  : 'Kiểm tra liên kết của bạn'}
              </span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
