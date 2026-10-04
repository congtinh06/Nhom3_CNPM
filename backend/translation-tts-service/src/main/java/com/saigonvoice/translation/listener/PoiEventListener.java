package com.saigonvoice.translation.listener;

import com.saigonvoice.translation.event.PoiEventPayload;
import com.saigonvoice.translation.service.PoiPipelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PoiEventListener {

    private final PoiPipelineService pipelineService;

    @RabbitListener(queues = {
            "${app.rabbitmq.queues.poi-created:poi.created.queue}",
            "${app.rabbitmq.queues.poi-updated:poi.updated.queue}"
    })
    public void onPoiEvent(PoiEventPayload event) {
        log.info("Received POI event: poiId={}, sourceLang={}, targetLangs={}",
                event != null ? event.getPoiId() : null,
                event != null ? event.getSourceLanguage() : null,
                event != null ? event.getTargetLanguages() : null);

        pipelineService.processPoiEvent(event);
    }
}
