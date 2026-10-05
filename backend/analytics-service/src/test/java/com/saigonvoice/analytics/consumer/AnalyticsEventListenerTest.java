package com.saigonvoice.analytics.consumer;

import com.saigonvoice.analytics.entity.AnalyticsEvent;
import com.saigonvoice.analytics.messaging.AnalyticsEventMessage;
import com.saigonvoice.analytics.repository.AnalyticsEventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsEventListenerTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @InjectMocks
    private AnalyticsEventListener analyticsEventListener;

    @Test
    @DisplayName("New event message is successfully persisted")
    void testHandleAnalyticsEvent_newEvent_savesSuccessfully() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("event-uuid-1")
                .eventType("SCAN")
                .poiId(10L)
                .languageCode("vi")
                .triggerType("QR")
                .sessionId("session-1")
                .occurredAt(LocalDateTime.now())
                .build();

        when(analyticsEventRepository.existsByEventId("event-uuid-1")).thenReturn(false);

        analyticsEventListener.handleAnalyticsEvent(message);

        ArgumentCaptor<AnalyticsEvent> captor = ArgumentCaptor.forClass(AnalyticsEvent.class);
        verify(analyticsEventRepository, times(1)).save(captor.capture());

        AnalyticsEvent saved = captor.getValue();
        assertThat(saved.getEventId()).isEqualTo("event-uuid-1");
        assertThat(saved.getEventType()).isEqualTo("SCAN");
        assertThat(saved.getPoiId()).isEqualTo(10L);
        assertThat(saved.getLanguageCode()).isEqualTo("vi");
        assertThat(saved.getTriggerType()).isEqualTo("QR");
        assertThat(saved.getSessionId()).isEqualTo("session-1");
    }

    @Test
    @DisplayName("Duplicate eventId detected via existsByEventId is skipped without calling save")
    void testHandleAnalyticsEvent_duplicateEventId_skippedBeforeSave() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("existing-uuid")
                .eventType("AUDIO_PLAY")
                .poiId(5L)
                .languageCode("en")
                .completed(true)
                .occurredAt(LocalDateTime.now())
                .build();

        when(analyticsEventRepository.existsByEventId("existing-uuid")).thenReturn(true);

        analyticsEventListener.handleAnalyticsEvent(message);

        verify(analyticsEventRepository, never()).save(any(AnalyticsEvent.class));
    }

    @Test
    @DisplayName("DataIntegrityViolationException on duplicate eventId is caught and skipped, not thrown to DLQ")
    void testHandleAnalyticsEvent_dataIntegrityViolation_caughtAndSkipped() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("conflict-uuid")
                .eventType("SCAN")
                .poiId(3L)
                .languageCode("ja")
                .triggerType("GPS")
                .occurredAt(LocalDateTime.now())
                .build();

        when(analyticsEventRepository.existsByEventId("conflict-uuid")).thenReturn(false);
        when(analyticsEventRepository.save(any(AnalyticsEvent.class)))
                .thenThrow(new DataIntegrityViolationException("Violation of UNIQUE KEY constraint"));

        assertDoesNotThrow(() -> analyticsEventListener.handleAnalyticsEvent(message));

        verify(analyticsEventRepository, times(1)).save(any(AnalyticsEvent.class));
    }
}
