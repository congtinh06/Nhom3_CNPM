package com.echora.analytics.service;

import com.echora.analytics.config.RabbitMQConfig;
import com.echora.analytics.dto.CreateEventRequest;
import com.echora.analytics.messaging.AnalyticsEventMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AnalyticsEventServiceTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Test
    @DisplayName("Generated occurredAt is explicit UTC using a fixed UTC Clock")
    void testProcessAndPublish_occurredAtIsUtcWithFixedClock() {
        Instant fixedInstant = Instant.parse("2026-10-05T08:30:00.123Z");
        Clock fixedClock = Clock.fixed(fixedInstant, ZoneOffset.UTC);

        AnalyticsEventServiceImpl service = new AnalyticsEventServiceImpl(rabbitTemplate, fixedClock);

        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .sessionId("sess-123")
                .build();

        service.processAndPublish(request);

        ArgumentCaptor<AnalyticsEventMessage> captor = ArgumentCaptor.forClass(AnalyticsEventMessage.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ANALYTICS_EVENT),
                captor.capture()
        );

        AnalyticsEventMessage message = captor.getValue();
        assertThat(message.getOccurredAt()).isEqualTo(LocalDateTime.of(2026, 10, 5, 8, 30, 0, 123_000_000));
        assertThat(message.getOccurredAt()).isEqualTo(LocalDateTime.ofInstant(fixedInstant, ZoneOffset.UTC));
    }

    @Test
    @DisplayName("Generated occurredAt is forced to UTC even if injected Clock has non-UTC ZoneId")
    void testProcessAndPublish_clockWithNonUtcZone_stillGeneratesUtc() {
        Instant fixedInstant = Instant.parse("2026-10-05T08:30:00.123Z");
        // Clock configured with Asia/Ho_Chi_Minh (+07:00)
        Clock plus7Clock = Clock.fixed(fixedInstant, ZoneId.of("Asia/Ho_Chi_Minh"));

        AnalyticsEventServiceImpl service = new AnalyticsEventServiceImpl(rabbitTemplate, plus7Clock);

        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .build();

        service.processAndPublish(request);

        ArgumentCaptor<AnalyticsEventMessage> captor = ArgumentCaptor.forClass(AnalyticsEventMessage.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ANALYTICS_EVENT),
                captor.capture()
        );

        AnalyticsEventMessage message = captor.getValue();
        // Must still be 08:30:00 (UTC), NOT 15:30:00 (+07:00)
        assertThat(message.getOccurredAt().getHour()).isEqualTo(8);
        assertThat(message.getOccurredAt()).isEqualTo(LocalDateTime.of(2026, 10, 5, 8, 30, 0, 123_000_000));
    }
}
