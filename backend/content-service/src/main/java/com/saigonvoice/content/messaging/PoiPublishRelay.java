package com.saigonvoice.content.messaging;

import com.saigonvoice.content.service.PoiPublishService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Chỉ gửi event SAU KHI transaction tạo POI đã commit:
 * - commit lỗi  -> listener không chạy -> không có event "ma" trỏ tới POI không tồn tại;
 * - publish lỗi -> POI đã commit, PoiPublishService ghi PENDING/FAILED + lỗi, job gửi lại.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PoiPublishRelay {

    private final PoiPublishService poiPublishService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPoiPublishRequested(PoiPublishRequestedEvent event) {
        try {
            poiPublishService.publishPoiCreated(event.poiId());
        } catch (RuntimeException ex) {
            // Exception trong afterCommit sẽ lan ra request đã commit thành công -> chỉ log, job sẽ thử lại
            log.error("Unexpected error while publishing POI id={} after commit: {}", event.poiId(), ex.getMessage(), ex);
        }
    }
}
