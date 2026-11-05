package com.echora.translation.messaging;

import com.echora.translation.event.PoiAudioFailedEvent;
import com.echora.translation.event.PoiAudioProgressEvent;
import com.echora.translation.event.PoiAudioReadyEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PoiAudioEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:echora.topic}")
    private String exchange;

    @Value("${app.rabbitmq.routing-keys.poi-audio-progress:poi.audio.progress}")
    private String routingKeyProgress;

    @Value("${app.rabbitmq.routing-keys.poi-audio-ready:poi.audio.ready}")
    private String routingKeyReady;

    @Value("${app.rabbitmq.routing-keys.poi-audio-failed:poi.audio.failed}")
    private String routingKeyFailed;

    public void publishAudioProgress(PoiAudioProgressEvent event) {
        log.info("Publishing poi.audio.progress: poiId={}, lang={}, hash={}",
                event.getPoiId(), event.getLanguageCode(), event.getContentHash());
        rabbitTemplate.convertAndSend(exchange, routingKeyProgress, event);
    }

    public void publishAudioReady(PoiAudioReadyEvent event) {
        log.info("Publishing poi.audio.ready: poiId={}, lang={}, hash={}",
                event.getPoiId(), event.getLanguageCode(), event.getContentHash());
        rabbitTemplate.convertAndSend(exchange, routingKeyReady, event);
    }

    public void publishAudioFailed(PoiAudioFailedEvent event) {
        log.warn("Publishing poi.audio.failed: poiId={}, lang={}, status={}, error={}",
                event.getPoiId(), event.getLanguageCode(), event.getAudioStatus(), event.getErrorMessage());
        rabbitTemplate.convertAndSend(exchange, routingKeyFailed, event);
    }
}
