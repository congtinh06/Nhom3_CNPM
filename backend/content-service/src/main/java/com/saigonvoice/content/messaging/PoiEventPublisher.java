package com.saigonvoice.content.messaging;

import com.saigonvoice.content.config.RabbitMQConfig;
import com.saigonvoice.content.event.PoiCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PoiEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishPoiCreated(PoiCreatedEvent event) {
        try {
            log.info("Publishing event {} for POI id={}, code={}", 
                    RabbitMQConfig.ROUTING_KEY_POI_CREATED, event.getPoiId(), event.getPoiCode());
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_POI_CREATED, event);
        } catch (Exception ex) {
            log.error("Failed to publish {} event for POI id={}: {}", 
                    RabbitMQConfig.ROUTING_KEY_POI_CREATED, event.getPoiId(), ex.getMessage(), ex);
        }
    }

    public void publishPoiUpdated(PoiCreatedEvent event) {
        try {
            log.info("Publishing event {} for POI id={}, code={}", 
                    RabbitMQConfig.ROUTING_KEY_POI_UPDATED, event.getPoiId(), event.getPoiCode());
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_POI_UPDATED, event);
        } catch (Exception ex) {
            log.error("Failed to publish {} event for POI id={}: {}", 
                    RabbitMQConfig.ROUTING_KEY_POI_UPDATED, event.getPoiId(), ex.getMessage(), ex);
        }
    }
}
