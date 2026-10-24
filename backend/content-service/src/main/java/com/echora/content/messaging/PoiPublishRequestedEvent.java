package com.echora.content.messaging;

import com.echora.content.config.RabbitMQConfig;

/**
 * Spring application event nội bộ (KHÔNG gửi trực tiếp lên RabbitMQ).
 * Được phát trong transaction tạo/cập nhật POI; PoiPublishRelay chỉ xử lý sau khi transaction COMMIT.
 */
public record PoiPublishRequestedEvent(Long poiId, String routingKey) {
    public PoiPublishRequestedEvent(Long poiId) {
        this(poiId, RabbitMQConfig.ROUTING_KEY_POI_CREATED);
    }
}
