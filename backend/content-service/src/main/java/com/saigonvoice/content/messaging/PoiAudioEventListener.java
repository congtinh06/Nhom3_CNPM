package com.saigonvoice.content.messaging;

import com.saigonvoice.content.config.RabbitMQConfig;
import com.saigonvoice.content.event.PoiAudioFailedEvent;
import com.saigonvoice.content.event.PoiAudioReadyEvent;
import com.saigonvoice.content.service.PoiAudioUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Mỗi routing key một queue, mỗi listener nhận đúng một kiểu cụ thể.
 * Kiểu được suy ra từ tham số method (TypePrecedence.INFERRED) nên không cần header __TypeId__ của bên gửi.
 * Lỗi -> retry theo spring.rabbitmq.listener.simple.retry -> hết lượt thì reject (không requeue) -> DLQ.
 */
@Component
@RequiredArgsConstructor
public class PoiAudioEventListener {

    private final PoiAudioUpdateService poiAudioUpdateService;

    @RabbitListener(id = "poiAudioReadyListener", queues = RabbitMQConfig.QUEUE_POI_AUDIO_READY)
    public void onAudioReady(PoiAudioReadyEvent event) {
        poiAudioUpdateService.applyAudioReady(event);
    }

    @RabbitListener(id = "poiAudioFailedListener", queues = RabbitMQConfig.QUEUE_POI_AUDIO_FAILED)
    public void onAudioFailed(PoiAudioFailedEvent event) {
        poiAudioUpdateService.applyAudioFailed(event);
    }
}
