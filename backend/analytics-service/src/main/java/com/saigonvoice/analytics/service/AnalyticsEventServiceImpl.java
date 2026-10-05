package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.config.RabbitMQConfig;
import com.saigonvoice.analytics.dto.CreateEventRequest;
import com.saigonvoice.analytics.exception.AnalyticsPublishException;
import com.saigonvoice.analytics.messaging.AnalyticsEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventServiceImpl implements AnalyticsEventService {

    private final RabbitTemplate rabbitTemplate;

    @Override
    public void processAndPublish(CreateEventRequest request) {
        String eventId = UUID.randomUUID().toString();
        LocalDateTime occurredAt = LocalDateTime.now();

        Boolean completed = request.getCompleted();
        if ("AUDIO_PLAY".equalsIgnoreCase(request.getEventType()) && completed == null) {
            completed = false;
        }

        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId(eventId)
                .eventType(request.getEventType())
                .poiId(request.getPoiId())
                .languageCode(request.getLanguageCode())
                .triggerType(request.getTriggerType())
                .completed(completed)
                .sessionId(request.getSessionId())
                .occurredAt(occurredAt)
                .build();

        log.debug("Publishing analytics event: eventId={}, eventType={}, poiId={}", eventId, request.getEventType(), request.getPoiId());

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_ANALYTICS_EVENT,
                    message
            );
        } catch (AmqpException ex) {
            log.error("RabbitMQ publish failed for eventId={}: {}", eventId, ex.getMessage(), ex);
            throw new AnalyticsPublishException("Failed to publish event to message broker", ex);
        }
    }
}
