package com.echora.analytics.service;

import com.echora.analytics.entity.AnalyticsEvent;
import com.echora.analytics.messaging.AnalyticsEventMessage;
import com.echora.analytics.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventIngestionServiceImpl implements AnalyticsEventIngestionService {

    private final AnalyticsEventRepository analyticsEventRepository;

    @Override
    @Transactional
    public void ingestEvent(AnalyticsEventMessage message) {
        log.debug("Processing analytics event message: eventId={}, eventType={}, poiId={}",
                message.getEventId(), message.getEventType(), message.getPoiId());

        if (message.getEventId() != null && analyticsEventRepository.existsByEventId(message.getEventId())) {
            log.info("Duplicate event_id detected before save, skipping idempotent event: {}", message.getEventId());
            return;
        }

        AnalyticsEvent entity = AnalyticsEvent.builder()
                .eventId(message.getEventId())
                .eventType(message.getEventType())
                .poiId(message.getPoiId())
                .languageCode(message.getLanguageCode())
                .triggerType(message.getTriggerType())
                .completed(message.getCompleted())
                .deviceType(message.getDeviceType())
                .sessionId(message.getSessionId())
                .occurredAt(message.getOccurredAt())
                .build();

        try {
            analyticsEventRepository.save(entity);
            log.info("Successfully persisted analytics event: eventId={}, eventType={}, poiId={}",
                    entity.getEventId(), entity.getEventType(), entity.getPoiId());
        } catch (DataIntegrityViolationException ex) {
            if (message.getEventId() != null && analyticsEventRepository.existsByEventId(message.getEventId())) {
                log.info("Duplicate event_id caught during save (DataIntegrityViolationException), skipping: {}",
                        message.getEventId());
                return;
            }
            log.error("DataIntegrityViolationException during save for eventId={}, eventType={}: {}",
                    message.getEventId(), message.getEventType(), ex.getMessage(), ex);
            throw ex;
        }
    }
}

