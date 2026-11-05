package com.echora.content.service;

import com.echora.content.config.RabbitMQConfig;
import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.entity.PublishEventType;
import com.echora.content.entity.PublishStatus;
import com.echora.content.entity.TranslationSource;
import com.echora.content.event.AuthoredPoiText;
import com.echora.content.event.PoiCreatedEvent;
import com.echora.content.event.PoiUpdatedEvent;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.messaging.PoiEventPublisher;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.PoiTranslationRepository;
import com.echora.content.util.TimeUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gửi poi.created / poi.updated cho 1 POI và GHI LẠI kết quả vào bảng poi (publish_status / attempts / last error).
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
                             @Value("${echora.publish-retry.max-attempts:5}") int maxAttempts) {
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
        return doPublish(poi, RabbitMQConfig.ROUTING_KEY_POI_CREATED);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String publishPoiUpdated(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        if (PublishStatus.PUBLISHED.equals(poi.getPublishStatus())) {
            return poi.getPublishStatus();
        }
        return doPublish(poi, RabbitMQConfig.ROUTING_KEY_POI_UPDATED);
    }

    /** Retry job gọi: xác định loại event dựa trên POI rồi gửi lại nếu chưa PUBLISHED */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String retryPendingPublish(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        if (PublishStatus.PUBLISHED.equals(poi.getPublishStatus())) {
            return poi.getPublishStatus();
        }
        return doPublish(poi, resolveRoutingKey(poi));
    }

    /** Admin yêu cầu gửi lại: reset bộ đếm rồi gửi ngay (kể cả POI đang FAILED hoặc đã PUBLISHED). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String republish(Long poiId) {
        return republish(poiId, false, null);
    }

    /**
     * Gửi lại event kèm cờ tạo lại audio. forceLanguages chỉ được dùng khi forceRegenerate=true.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String republish(Long poiId, boolean forceRegenerate, List<String> forceLanguages) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        poi.setPublishAttempts(0);
        poi.setPublishStatus(PublishStatus.PENDING);
        poi.setLastPublishError(null);
        return doPublish(poi, resolveRoutingKey(poi), forceRegenerate, forceLanguages);
    }

    private String resolveRoutingKey(Poi poi) {
        return PublishEventType.POI_UPDATED.equals(poi.getPublishEventType())
                ? RabbitMQConfig.ROUTING_KEY_POI_UPDATED
                : RabbitMQConfig.ROUTING_KEY_POI_CREATED;
    }

    private String doPublish(Poi poi, String routingKey) {
        return doPublish(poi, routingKey, false, null);
    }

    private String doPublish(Poi poi, String routingKey, boolean forceRegenerate, List<String> forceLanguages) {
        poi.setPublishAttempts(poi.getPublishAttempts() + 1);
        poi.setLastPublishAttemptAt(TimeUtils.nowUtc());
        try {
            PoiTranslation vi = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), SOURCE_LANG)
                    .orElseThrow(() -> new IllegalStateException("Missing source translation 'vi'"));

            Map<String, AuthoredPoiText> authoredTexts = collectAuthoredTexts(poi.getId());

            Object event;
            if (RabbitMQConfig.ROUTING_KEY_POI_UPDATED.equals(routingKey)) {
                event = PoiUpdatedEvent.builder()
                        .poiId(poi.getId())
                        .poiCode(poi.getCode())
                        .zoneId(poi.getZone().getId())
                        .sourceLanguage(SOURCE_LANG)
                        .title(vi.getTitle())
                        .summary(vi.getSummary())
                        .description(vi.getDescription())
                        .historicalSignificance(vi.getHistoricalSignificance())
                        .targetLanguages(TARGET_LANGUAGES)
                        .authoredTexts(authoredTexts)
                        .forceRegenerate(forceRegenerate)
                        .forceLanguages(forceRegenerate ? forceLanguages : null)
                        .build();
            } else {
                event = PoiCreatedEvent.builder()
                        .poiId(poi.getId())
                        .poiCode(poi.getCode())
                        .zoneId(poi.getZone().getId())
                        .sourceLanguage(SOURCE_LANG)
                        .title(vi.getTitle())
                        .summary(vi.getSummary())
                        .description(vi.getDescription())
                        .historicalSignificance(vi.getHistoricalSignificance())
                        .targetLanguages(TARGET_LANGUAGES)
                        .authoredTexts(authoredTexts)
                        .forceRegenerate(forceRegenerate)
                        .forceLanguages(forceRegenerate ? forceLanguages : null)
                        .build();
            }

            eventPublisher.publish(routingKey, event);

            poi.setPublishStatus(PublishStatus.PUBLISHED);
            poi.setLastPublishError(null);
            log.info("{} published for POI id={} (attempt {})", routingKey, poi.getId(), poi.getPublishAttempts());
        } catch (RuntimeException ex) {
            String error = truncate(ex.getMessage(), 1000);
            poi.setLastPublishError(error);
            if (poi.getPublishAttempts() >= maxAttempts) {
                poi.setPublishStatus(PublishStatus.FAILED);
                log.error("{} FAILED for POI id={} after {} attempts: {}", routingKey, poi.getId(), poi.getPublishAttempts(), error);
            } else {
                poi.setPublishStatus(PublishStatus.PENDING);
                log.warn("{} not published for POI id={} (attempt {}/{}), will retry: {}",
                        routingKey, poi.getId(), poi.getPublishAttempts(), maxAttempts, error);
            }
        }
        poiRepository.save(poi);
        return poi.getPublishStatus();
    }

    /**
     * Thu thập các bản dịch do người viết (translation_source = MANUAL) cho từng ngôn ngữ đích.
     * translation-tts-service sẽ dùng nguyên văn các ngôn ngữ này thay vì dịch máy.
     */
    private Map<String, AuthoredPoiText> collectAuthoredTexts(Long poiId) {
        Map<String, AuthoredPoiText> authored = new LinkedHashMap<>();
        for (String lang : TARGET_LANGUAGES) {
            translationRepository.findByPoiIdAndLanguageCode(poiId, lang)
                    .filter(t -> TranslationSource.MANUAL.name().equalsIgnoreCase(t.getSource()))
                    .ifPresent(t -> authored.put(lang, AuthoredPoiText.builder()
                            .title(t.getTitle())
                            .summary(t.getSummary())
                            .description(t.getDescription())
                            .historicalSignificance(t.getHistoricalSignificance())
                            .build()));
        }
        return authored;
    }

    @Transactional(readOnly = true)
    public List<Long> findPendingPublishIds(java.time.LocalDateTime olderThan) {
        return poiRepository.findPendingPublishIds(olderThan);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "unknown error";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
