package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.CreateEventRequest;
import com.saigonvoice.analytics.exception.AnalyticsPublishException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RabbitMQFastFailTest {

    @Test
    @DisplayName("Real RabbitTemplate pointed at unreachable host fails fast within 4s and throws AnalyticsPublishException")
    void testRealRabbitTemplate_unreachableHost_failsFast() {
        // Point at a non-routable / blackhole address (RFC 5737 TEST-NET-1) with 1500ms timeout
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory("192.0.2.1", 5672);
        connectionFactory.setConnectionTimeout(1500);
        connectionFactory.setChannelCheckoutTimeout(1500);

        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(new Jackson2JsonMessageConverter());
        AnalyticsEventServiceImpl eventService = new AnalyticsEventServiceImpl(rabbitTemplate);

        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .build();

        long start = System.currentTimeMillis();
        try {
            AnalyticsPublishException thrown = assertThrows(
                    AnalyticsPublishException.class,
                    () -> eventService.processAndPublish(request)
            );
            long elapsed = System.currentTimeMillis() - start;

            assertThat(thrown).hasMessageContaining("Failed to publish event to message broker");
            // Must fail fast, well below the >30s curl timeout
            assertThat(elapsed).isLessThan(4000);
        } finally {
            connectionFactory.destroy();
        }
    }

    @Test
    @DisplayName("Real RabbitTemplate pointed at closed localhost port fails immediately and throws AnalyticsPublishException")
    void testRealRabbitTemplate_closedLocalPort_failsImmediately() {
        // Point to an unused local port where Connection Refused is returned immediately
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory("127.0.0.1", 59999);
        connectionFactory.setConnectionTimeout(2000);
        connectionFactory.setChannelCheckoutTimeout(2000);

        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(new Jackson2JsonMessageConverter());
        AnalyticsEventServiceImpl eventService = new AnalyticsEventServiceImpl(rabbitTemplate);

        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("AUDIO_PLAY")
                .poiId(5L)
                .languageCode("en")
                .completed(true)
                .build();

        long start = System.currentTimeMillis();
        try {
            AnalyticsPublishException thrown = assertThrows(
                    AnalyticsPublishException.class,
                    () -> eventService.processAndPublish(request)
            );
            long elapsed = System.currentTimeMillis() - start;

            assertThat(thrown).hasMessageContaining("Failed to publish event to message broker");
            assertThat(elapsed).isLessThan(1500);
        } finally {
            connectionFactory.destroy();
        }
    }
}
