import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdminPoiLanguage, AdminPoiLanguageSummary, POI_LANGUAGES } from '../types/poi';
import { formatDateTime } from '../utils/format';

export interface PoiLanguageSummaryProps {
  languages?: AdminPoiLanguage[];
  summary?: AdminPoiLanguageSummary;
  poiName: string;
}

const LANGUAGE_STATUS_TEXT: Record<string, string> = {
  READY: 'Sẵn sàng',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  FAILED_TTS: 'Lỗi tổng hợp',
  FAILED: 'Lỗi tổng hợp',
  FAILED_TRANSLATION: 'Lỗi dịch thuật',
};

/* Chỉ một popover mở tại một thời điểm trên toàn trang admin. */
const closeCallbacks = new Set<() => void>();

function closeOthers(keep: () => void) {
  closeCallbacks.forEach((fn) => {
    if (fn !== keep) fn();
  });
}

function isFailed(status?: string): boolean {
  const norm = (status || '').toUpperCase();
  return norm === 'FAILED' || norm === 'FAILED_TTS' || norm === 'FAILED_TRANSLATION';
}

function isPending(status?: string): boolean {
  const norm = (status || '').toUpperCase();
  return norm === 'PENDING' || norm === 'PROCESSING';
}

function statusText(status?: string): string {
  const norm = (status || '').toUpperCase();
  return LANGUAGE_STATUS_TEXT[norm] || 'Chưa rõ';
}

function durationLabel(language: AdminPoiLanguage): string {
  if (
    (language.audioStatus || '').toUpperCase() === 'READY' &&
    language.audioDurationSeconds &&
    language.audioDurationSeconds > 0
  ) {
    return `${language.audioDurationSeconds} giây`;
  }
  return 'Chưa có';
}

function orderedLanguages(languages?: AdminPoiLanguage[]): AdminPoiLanguage[] {
  const list = languages ?? [];
  const byCode = new Map(list.map((lang) => [lang.languageCode, lang]));
  return POI_LANGUAGES.map(
    (lang) =>
      byCode.get(lang.code) || {
        languageCode: lang.code,
        languageName: lang.label,
        audioStatus: 'PENDING',
      }
  );
}

export const PoiLanguageSummary: React.FC<PoiLanguageSummaryProps> = ({
  languages,
  summary,
  poiName,
}) => {
  const list = orderedLanguages(languages);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const ready = summary?.ready ?? list.filter((l) => (l.audioStatus || '').toUpperCase() === 'READY').length;
  const total = summary?.total ?? list.length;
  const failed =
    summary?.failed ?? list.filter((l) => isFailed(l.audioStatus)).length;
  const pending =
    summary?.pending ?? list.filter((l) => isPending(l.audioStatus)).length;

  const closePopover = useCallback(() => {
    setOpen(false);
    closeCallbacks.delete(closePopover);
  }, []);

  const openPopover = useCallback(() => {
    closeOthers(closePopover);
    const el = triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const width = 400;
      const left = Math.max(8, Math.min(rect.left, (window.innerWidth || width) - width - 8));
      setPosition({ top: rect.bottom + 6, left });
    }
    closeCallbacks.add(closePopover);
    setOpen(true);
  }, [closePopover]);

  const handleToggle = () => {
    if (open) {
      closePopover();
    } else {
      openPopover();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      closePopover();
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target)) return;
      closePopover();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, closePopover]);

  useEffect(
    () => () => {
      closeCallbacks.delete(closePopover);
    },
    [closePopover]
  );

  return (
    <span className="adm-lang-summary-wrap" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="adm-lang-summary"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Xem trạng thái ngôn ngữ của ${poiName}`}
        onClick={handleToggle}
      >
        <span className="adm-lang-summary-text">
          {ready}/{total} sẵn sàng
        </span>
        {failed > 0 && <span className="adm-badge adm-badge-danger">{failed} lỗi</span>}
        {!failed && pending > 0 && (
          <span className="adm-badge adm-badge-warning">Chờ xử lý</span>
        )}
      </button>

      {open && (
        <div
          className="adm-lang-popover"
          role="dialog"
          aria-label={`Trạng thái ngôn ngữ của ${poiName}`}
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <table className="adm-lang-popover-table">
            <caption className="adm-table-caption">
              Trạng thái ngôn ngữ của {poiName}
            </caption>
            <thead>
              <tr>
                <th scope="col">Ngôn ngữ</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thời lượng</th>
                <th scope="col">Lý do lỗi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((language) => (
                <tr key={language.languageCode}>
                  <td className="adm-lang-popover-name">{language.languageName}</td>
                  <td>
                    {isFailed(language.audioStatus) ? (
                      <span className="adm-badge adm-badge-danger">
                        {statusText(language.audioStatus)}
                      </span>
                    ) : isPending(language.audioStatus) ? (
                      <span className="adm-badge adm-badge-warning">
                        {statusText(language.audioStatus)}
                      </span>
                    ) : (
                      <span className="adm-lang-popover-plain">
                        {statusText(language.audioStatus)}
                      </span>
                    )}
                  </td>
                  <td className="adm-lang-popover-plain">{durationLabel(language)}</td>
                  <td className="adm-lang-popover-plain">
                    {language.errorReason || 'Không có'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="adm-lang-popover-meta">
            <span>Lần thử gần nhất: {formatDateTime(list[0]?.lastAttemptAt)}</span>
          </div>

          <div className="adm-lang-popover-actions">
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              disabled
              title="Chức năng gửi lại yêu cầu đang được chuẩn bị"
            >
              Sắp có
            </button>
          </div>
        </div>
      )}
    </span>
  );
};
