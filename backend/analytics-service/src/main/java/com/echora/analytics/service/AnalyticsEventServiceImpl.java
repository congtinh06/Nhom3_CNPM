package com.echora.analytics.service;

import com.echora.analytics.config.RabbitMQConfig;
import com.echora.analytics.dto.CreateEventRequest;
import com.echora.analytics.exception.AnalyticsPublishException;
import com.echora.analytics.messaging.AnalyticsEventMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@Slf4j
public class AnalyticsEventServiceImpl implements AnalyticsEventService {

    private final RabbitTemplate rabbitTemplate;
    private final Clock clock;

    @Autowired
    public AnalyticsEventServiceImpl(RabbitTemplate rabbitTemplate, @Autowired(required = false) Clock clock) {
        this.rabbitTemplate = rabbitTemplate;
        this.clock = (clock != null) ? clock : Clock.systemUTC();
    }

    public AnalyticsEventServiceImpl(RabbitTemplate rabbitTemplate) {
        this(rabbitTemplate, Clock.systemUTC());
    }

    @Override
    public void processAndPublish(CreateEventRequest request) {
        String eventId = UUID.randomUUID().toString();
        LocalDateTime occurredAt = LocalDateTime.now(clock.withZone(ZoneOffset.UTC));

        Boolean completed = request.getCompleted();
        if ("AUDIO_PLAY".equalsIgnoreCase(request.getEventType()) && completed == null) {
            completed = false;
        }

        String triggerType = request.getTriggerType();
        if ("VISIT".equalsIgnoreCase(request.getEventType())
                && (triggerType == null || triggerType.isBlank())) {
            triggerType = "DIRECT";
        }

        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId(eventId)
                .eventType(request.getEventType())
                .poiId(request.getPoiId())
                .languageCode(request.getLanguageCode())
                .triggerType(triggerType)
                .completed(completed)
                .deviceType(request.getDeviceType())
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
        } catch (Exception ex) {
            log.error("Unexpected error publishing eventId={}: {}", eventId, ex.getMessage(), ex);
            throw new AnalyticsPublishException("Failed to publish event to message broker", ex);
        }
    }
}
