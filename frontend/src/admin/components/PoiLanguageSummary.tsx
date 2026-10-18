import React, { useRef, useState } from 'react';
import { AdminPoiLanguage, AdminPoiLanguageSummary } from '../types/poi';
import { StatusBadge } from './StatusBadge';

export interface PoiLanguageSummaryProps {
  languages?: AdminPoiLanguage[];
  summary?: AdminPoiLanguageSummary;
  poiName: string;
}

function isFailed(status?: string): boolean {
  const norm = (status || '').toUpperCase();
  return norm === 'FAILED' || norm === 'FAILED_TTS';
}

function isReady(status?: string): boolean {
  return (status || '').toUpperCase() === 'READY';
}

function durationLabel(language: AdminPoiLanguage): string {
  if (isReady(language.audioStatus) && language.audioDurationSeconds && language.audioDurationSeconds > 0) {
    return `${language.audioDurationSeconds} giây`;
  }
  return '-';
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const PoiLanguageSummary: React.FC<PoiLanguageSummaryProps> = ({ languages, summary, poiName }) => {
  const list = languages ?? [];
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const ready = summary?.ready ?? list.filter((l) => isReady(l.audioStatus)).length;
  const total = summary?.total ?? list.length;
  const failed = summary?.failed ?? list.filter((l) => isFailed(l.audioStatus)).length;

  const openPopover = () => {
    const el = triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const width = 300;
      const left = Math.max(8, Math.min(rect.left, (window.innerWidth || width) - width - 8));
      setPosition({ top: rect.bottom + 6, left });
    }
    setOpen(true);
  };

  const handleClick = () => {
    if (open) {
      setOpen(false);
    } else {
      openPopover();
    }
  };

  return (
    <span
      className="adm-lang-summary-wrap"
      onMouseEnter={openPopover}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="adm-lang-summary"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Trạng thái thuyết minh của ${poiName}`}
        onClick={handleClick}
      >
        <span className="adm-lang-summary-text">
          {ready}/{total} sẵn sàng
        </span>
        {failed > 0 && (
          <span className="adm-badge adm-badge-danger">{failed} lỗi</span>
        )}
      </button>

      {open && (
        <div
          className="adm-lang-popover"
          role="dialog"
          aria-label={`Chi tiết thuyết minh của ${poiName}`}
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <ul className="adm-lang-popover-list">
            {list.map((language) => (
              <li key={language.languageCode} className="adm-lang-popover-item">
                <div className="adm-lang-popover-head">
                  <span className="adm-lang-popover-name">{language.languageName}</span>
                  <StatusBadge status={language.audioStatus} />
                </div>
                <div className="adm-lang-popover-meta">
                  <span>Thời lượng: {durationLabel(language)}</span>
                  <span>Thử gần nhất: {formatDateTime(language.lastAttemptAt)}</span>
                </div>
                {language.errorReason && (
                  <p className="adm-lang-popover-error">{language.errorReason}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
};
