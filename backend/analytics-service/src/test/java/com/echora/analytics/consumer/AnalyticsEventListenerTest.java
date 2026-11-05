package com.echora.analytics.consumer;

import com.echora.analytics.messaging.AnalyticsEventMessage;
import com.echora.analytics.service.AnalyticsEventIngestionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AnalyticsEventListenerTest {

    @Mock
    private AnalyticsEventIngestionService analyticsEventIngestionService;

    @InjectMocks
    private AnalyticsEventListener analyticsEventListener;

    @Test
    @DisplayName("AnalyticsEventListener delegates event processing to AnalyticsEventIngestionService")
    void testHandleAnalyticsEvent_delegatesToService() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("event-uuid-1")
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .sessionId("session-1")
                .occurredAt(LocalDateTime.now())
                .build();

        analyticsEventListener.handleAnalyticsEvent(message);

        verify(analyticsEventIngestionService, times(1)).ingestEvent(message);
    }
}
