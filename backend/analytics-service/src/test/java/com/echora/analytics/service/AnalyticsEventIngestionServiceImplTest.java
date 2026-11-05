package com.echora.analytics.service;

import com.echora.analytics.entity.AnalyticsEvent;
import com.echora.analytics.messaging.AnalyticsEventMessage;
import com.echora.analytics.repository.AnalyticsEventRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsEventIngestionServiceImplTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @InjectMocks
    private AnalyticsEventIngestionServiceImpl ingestionService;

    @Test
    @DisplayName("New event message is successfully persisted")
    void testIngestEvent_newEvent_savesSuccessfully() {
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

        ingestionService.ingestEvent(message);

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
    void testIngestEvent_duplicateEventId_skippedBeforeSave() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("existing-uuid")
                .eventType("AUDIO_PLAY")
                .poiId(5L)
                .languageCode("en")
                .completed(true)
                .occurredAt(LocalDateTime.now())
                .build();

        when(analyticsEventRepository.existsByEventId("existing-uuid")).thenReturn(true);

        ingestionService.ingestEvent(message);

        verify(analyticsEventRepository, never()).save(any(AnalyticsEvent.class));
    }

    @Test
    @DisplayName("DataIntegrityViolationException on duplicate eventId is caught and skipped, not thrown to DLQ")
    void testIngestEvent_dataIntegrityViolation_caughtAndSkipped() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("conflict-uuid")
                .eventType("SCAN")
                .poiId(3L)
                .languageCode("ja")
                .triggerType("GPS")
                .occurredAt(LocalDateTime.now())
                .build();

        // First check returns false, re-check in catch returns true (concurrent insert)
        when(analyticsEventRepository.existsByEventId("conflict-uuid")).thenReturn(false, true);
        when(analyticsEventRepository.save(any(AnalyticsEvent.class)))
                .thenThrow(new DataIntegrityViolationException("Violation of UNIQUE KEY constraint"));

        assertDoesNotThrow(() -> ingestionService.ingestEvent(message));

        verify(analyticsEventRepository, times(1)).save(any(AnalyticsEvent.class));
    }

    @Test
    @DisplayName("DataIntegrityViolationException on non-duplicate error (CHECK or NOT NULL) is rethrown to DLQ")
    void testIngestEvent_dataIntegrityViolation_nonDuplicate_rethrows() {
        AnalyticsEventMessage message = AnalyticsEventMessage.builder()
                .eventId("invalid-check-uuid")
                .eventType("INVALID_TYPE")
                .poiId(3L)
                .languageCode("ja")
                .triggerType("GPS")
                .occurredAt(LocalDateTime.now())
                .build();

        // Both checks return false (not a duplicate eventId)
        when(analyticsEventRepository.existsByEventId("invalid-check-uuid")).thenReturn(false);
        when(analyticsEventRepository.save(any(AnalyticsEvent.class)))
                .thenThrow(new DataIntegrityViolationException("Violation of CHECK constraint"));

        assertThrows(DataIntegrityViolationException.class,
                () -> ingestionService.ingestEvent(message));

        verify(analyticsEventRepository, times(1)).save(any(AnalyticsEvent.class));
    }
}

