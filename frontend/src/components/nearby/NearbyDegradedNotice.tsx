import React from 'react';

export const NEARBY_DEGRADED_FALLBACK =
  'Không thể tải danh sách điểm gần bạn lúc này. Vui lòng thử lại sau.';

export interface NearbyDegradedNoticeProps {
  /** Friendly message returned by location-service when content-service is unavailable. */
  notice?: string | null;
  onRetry?: () => void;
}

/**
 * Shown when GET /api/location/nearby returns `degraded=true`.
 * The endpoint intentionally returns an empty list instead of a hard failure so the page can
 * keep rendering and invite the visitor to retry.
 */
export const NearbyDegradedNotice: React.FC<NearbyDegradedNoticeProps> = ({
  notice,
  onRetry,
}) => {
  return (
    <section
      className="nearby-data-error"
      role="status"
      aria-live="polite"
      data-testid="nearby-degraded-notice"
    >
      <div>
        <strong>Danh sách điểm gần bạn tạm thời chưa sẵn sàng</strong>
        <p>{notice?.trim() || NEARBY_DEGRADED_FALLBACK}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </section>
  );
};

export default NearbyDegradedNotice;
