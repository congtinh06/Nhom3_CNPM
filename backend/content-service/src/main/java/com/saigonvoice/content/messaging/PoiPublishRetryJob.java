package com.saigonvoice.content.messaging;

import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.service.PoiPublishService;
import com.saigonvoice.content.util.TimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

/**
 * Job gửi lại poi.created / poi.updated cho các POI còn PENDING (lần gửi trước lỗi, hoặc service tắt giữa commit và publish).
 * POI vượt max-attempts chuyển FAILED và job bỏ qua; admin dùng POST /api/content/admin/pois/{id}/republish.
 * Chạy 1 instance (đồ án); nếu scale nhiều instance cần khóa phân tán (vd. ShedLock).
 */
@Component
@ConditionalOnProperty(name = "saigonvoice.publish-retry.enabled", havingValue = "true", matchIfMissing = true)
@Slf4j
public class PoiPublishRetryJob {

    private final PoiRepository poiRepository;
    private final PoiPublishService poiPublishService;
    private final Duration minAge;

    public PoiPublishRetryJob(PoiRepository poiRepository,
                              PoiPublishService poiPublishService,
                              @Value("${saigonvoice.publish-retry.min-age:PT30S}") Duration minAge) {
        this.poiRepository = poiRepository;
        this.poiPublishService = poiPublishService;
        this.minAge = minAge;
    }

    @Scheduled(initialDelayString = "${saigonvoice.publish-retry.initial-delay:PT30S}",
               fixedDelayString = "${saigonvoice.publish-retry.interval:PT60S}")
    public void retryPendingPublishes() {
        List<Long> ids = poiRepository.findPendingPublishIds(TimeUtils.nowUtc().minus(minAge));
        if (ids.isEmpty()) {
            return;
        }
        log.info("Retrying pending publishes for {} POI(s): {}", ids.size(), ids);
        for (Long id : ids) {
            try {
                poiPublishService.retryPendingPublish(id);
            } catch (RuntimeException ex) {
                log.error("Retry publish crashed for POI id={}: {}", id, ex.getMessage(), ex);
            }
        }
    }
}
