package com.saigonvoice.analytics.consumer;

import com.saigonvoice.analytics.config.RabbitMQConfig;
import com.saigonvoice.analytics.entity.AnalyticsEvent;
import com.saigonvoice.analytics.messaging.AnalyticsEventMessage;
import com.saigonvoice.analytics.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventListener {

    private final AnalyticsEventRepository analyticsEventRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_ANALYTICS_EVENT)
    public void handleAnalyticsEvent(AnalyticsEventMessage message) {
        log.debug("Received analytics event message: eventId={}, eventType={}, poiId={}",
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
