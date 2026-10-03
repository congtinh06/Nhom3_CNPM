package com.saigonvoice.content.service;

import com.saigonvoice.content.config.RabbitMQConfig;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.entity.PublishStatus;
import com.saigonvoice.content.event.PoiCreatedEvent;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.messaging.PoiEventPublisher;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import com.saigonvoice.content.util.TimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Gửi poi.created cho 1 POI và GHI LẠI kết quả vào bảng poi (publish_status / attempts / last error).
 * Chạy transaction riêng (REQUIRES_NEW) vì được gọi từ AFTER_COMMIT listener và từ job gửi lại.
 * Không ném lỗi publish ra ngoài: lỗi được lưu vào DB để job/admin xử lý.
 */
@Service
@Slf4j
public class PoiPublishService {

    static final String SOURCE_LANG = "vi";
    static final List<String> TARGET_LANGUAGES = List.of("en", "ja", "ko");

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;
    private final PoiEventPublisher eventPublisher;
    private final int maxAttempts;

    public PoiPublishService(PoiRepository poiRepository,
                             PoiTranslationRepository translationRepository,
                             PoiEventPublisher eventPublisher,
                             @Value("${saigonvoice.publish-retry.max-attempts:5}") int maxAttempts) {
        this.poiRepository = poiRepository;
        this.translationRepository = translationRepository;
        this.eventPublisher = eventPublisher;
        this.maxAttempts = maxAttempts;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String publishPoiCreated(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        if (PublishStatus.PUBLISHED.equals(poi.getPublishStatus())) {
            return poi.getPublishStatus();
        }
        return doPublish(poi);
    }

    /** Admin yêu cầu gửi lại: reset bộ đếm rồi gửi ngay (kể cả POI đang FAILED hoặc đã PUBLISHED). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String republish(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        poi.setPublishAttempts(0);
        poi.setPublishStatus(PublishStatus.PENDING);
        poi.setLastPublishError(null);
        return doPublish(poi);
    }

    private String doPublish(Poi poi) {
        poi.setPublishAttempts(poi.getPublishAttempts() + 1);
        poi.setLastPublishAttemptAt(TimeUtils.nowUtc());
        try {
            PoiTranslation vi = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), SOURCE_LANG)
                    .orElseThrow(() -> new IllegalStateException("Missing source translation 'vi'"));

            PoiCreatedEvent event = PoiCreatedEvent.builder()
                    .poiId(poi.getId())
                    .poiCode(poi.getCode())
                    .zoneId(poi.getZone().getId())
                    .sourceLanguage(SOURCE_LANG)
                    .title(vi.getTitle())
                    .summary(vi.getSummary())
                    .description(vi.getDescription())
                    .historicalSignificance(vi.getHistoricalSignificance())
                    .targetLanguages(TARGET_LANGUAGES)
                    .build();

            eventPublisher.publish(RabbitMQConfig.ROUTING_KEY_POI_CREATED, event);

            poi.setPublishStatus(PublishStatus.PUBLISHED);
            poi.setLastPublishError(null);
            log.info("poi.created published for POI id={} (attempt {})", poi.getId(), poi.getPublishAttempts());
        } catch (RuntimeException ex) {
            String error = truncate(ex.getMessage(), 1000);
            poi.setLastPublishError(error);
            if (poi.getPublishAttempts() >= maxAttempts) {
                poi.setPublishStatus(PublishStatus.FAILED);
                log.error("poi.created FAILED for POI id={} after {} attempts: {}", poi.getId(), poi.getPublishAttempts(), error);
            } else {
                poi.setPublishStatus(PublishStatus.PENDING);
                log.warn("poi.created not published for POI id={} (attempt {}/{}), will retry: {}",
                        poi.getId(), poi.getPublishAttempts(), maxAttempts, error);
            }
        }
        poiRepository.save(poi);
        return poi.getPublishStatus();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "unknown error";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
