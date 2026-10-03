package com.saigonvoice.content.messaging;

/**
 * Spring application event nội bộ (KHÔNG gửi lên RabbitMQ).
 * Được phát trong transaction tạo POI; PoiPublishRelay chỉ xử lý sau khi transaction COMMIT.
 */
public record PoiPublishRequestedEvent(Long poiId) {
}
