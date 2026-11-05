package com.echora.analytics.consumer;

import com.echora.analytics.config.RabbitMQConfig;
import com.echora.analytics.messaging.AnalyticsEventMessage;
import com.echora.analytics.service.AnalyticsEventIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsEventListener {

    private final AnalyticsEventIngestionService analyticsEventIngestionService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_ANALYTICS_EVENT)
    public void handleAnalyticsEvent(AnalyticsEventMessage message) {
        analyticsEventIngestionService.ingestEvent(message);
    }
}
