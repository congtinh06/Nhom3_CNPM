import React, { useState } from 'react';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminPoiTranslation, POI_LANGUAGES } from '../types/poi';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { formatDateTime } from '../utils/format';

export interface PoiAudioStatusPanelProps {
  poiId: number;
  publishStatus: string;
  publishAttempts?: number | null;
  lastPublishAttemptAt?: string | null;
  translations: Record<string, AdminPoiTranslation>;
  onReload: () => void | Promise<void>;
  reloading?: boolean;
}

export const PoiAudioStatusPanel: React.FC<PoiAudioStatusPanelProps> = ({
  poiId,
  publishStatus,
  publishAttempts,
  lastPublishAttemptAt,
  translations,
  onReload,
  reloading = false,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [republishing, setRepublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRepublish = async () => {
    if (republishing) return;
    setRepublishing(true);
    setNotice(null);
    setActionError(null);
    try {
      await poiApi.republish(poiId);
      setConfirmOpen(false);
      setNotice('Đã gửi yêu cầu phát hành lại. Trạng thái sẽ được cập nhật sau khi hệ thống xử lý.');
      await onReload();
    } catch (err) {
      const norm = normalizeAdminError(err);
      setActionError(`Không thể phát hành lại: ${norm.message}`);
      setConfirmOpen(false);
    } finally {
      setRepublishing(false);
    }
  };

  const currentStatus = publishStatus || '';
  const isFailed = currentStatus === 'FAILED';

  const langStatuses = POI_LANGUAGES.map((lang) => {
    const translation = translations?.[lang.code];
    return {
      code: lang.code,
      label: lang.label,
      missing: !translation,
      audioStatus: translation?.audioStatus || 'PENDING',
      durationSeconds: translation?.audioDurationSeconds ?? null,
      errorReason: translation?.errorReason ?? null,
      lastAttemptAt: translation?.lastAttemptAt ?? null,
    };
  });

  return (
    <div className="adm-card adm-form-section">
      <div className="adm-card-head-row">
        <h2 className="adm-card-title">Trạng thái thuyết minh &amp; phát hành</h2>
        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-btn-sm"
          onClick={() => onReload()}
          disabled={reloading}
        >
          {reloading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <>
        {notice && (
          <div className="adm-alert adm-alert-success adm-alert-sm" role="status">
            <span>{notice}</span>
          </div>
        )}

        {actionError && (
          <div className="adm-alert adm-alert-danger adm-alert-sm" role="alert">
            <span>{actionError}</span>
          </div>
        )}

        <div className="adm-publish-row">
          <span className="adm-publish-label">Trạng thái phát hành sự kiện</span>
          <span className="adm-publish-value">
            {currentStatus ? (
              <StatusBadge status={currentStatus} />
            ) : (
              <span className="adm-date-text">-</span>
            )}
          </span>
        </div>

        <div className="adm-publish-meta">
          <span>Số lần thử: {publishAttempts ?? 0}</span>
          <span>Lần thử gần nhất: {formatDateTime(lastPublishAttemptAt)}</span>
        </div>

        {isFailed && (
          <div className="adm-alert adm-alert-danger adm-alert-sm" role="alert">
            <span>
              Quá trình phát hành thuyết minh cho điểm này đã thất bại. Vui lòng bấm "Phát hành
              lại" để hệ thống thử tạo lại nội dung và audio.
            </span>
          </div>
        )}

        <div className="adm-lang-status-list">
          {langStatuses.map((lang) => {
            const errorText =
              lang.errorReason ||
              (lang.audioStatus === 'FAILED_TTS'
                ? 'Lỗi tổng hợp giọng đọc. Hãy phát hành lại để tạo audio mới.'
                : null);
            return (
              <div key={lang.code} className="adm-lang-status-row">
                <span className="adm-lang-status-name">{lang.label}</span>
                <span className="adm-lang-status-badge">
                  {lang.missing ? (
                    <span className="adm-date-text">Chưa có bản dịch</span>
                  ) : (
                    <StatusBadge status={lang.audioStatus} />
                  )}
                </span>
                <span className="adm-lang-status-note">
                  {!lang.missing && (
                    <>
                      {lang.audioStatus === 'READY' && lang.durationSeconds ? (
                        <span>Thời lượng: {Math.round(lang.durationSeconds)} giây</span>
                      ) : null}
                      {errorText && <span className="adm-lang-status-error">{errorText}</span>}
                      <span>Thử gần nhất: {formatDateTime(lang.lastAttemptAt)}</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="adm-publish-actions">
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setConfirmOpen(true)}
            disabled={republishing}
          >
            Phát hành lại
          </button>
        </div>
      </>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Xác nhận phát hành lại thuyết minh"
        message="Hệ thống sẽ gửi lại sự kiện để tạo bản dịch và audio cho điểm này. Bạn có chắc chắn muốn tiếp tục?"
        confirmText={republishing ? 'Đang xử lý...' : 'Xác nhận phát hành lại'}
        cancelText="Hủy bỏ"
        variant="primary"
        onConfirm={handleRepublish}
        onCancel={() => {
          if (!republishing) {
            setConfirmOpen(false);
          }
        }}
      />
    </div>
  );
};
