package com.echora.analytics.service;

import com.echora.analytics.dto.PresenceRequest;
import com.echora.analytics.repository.AnalyticsPresenceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class AnalyticsPresenceServiceTest {

    @Mock
    private AnalyticsPresenceRepository presenceRepository;

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-10-29T04:00:00Z"), ZoneOffset.UTC);

    @Test
    @DisplayName("Ghi presence với session id, ngôn ngữ và thiết bị đã chuẩn hóa")
    void touchPersistsNormalizedPresence() {
        AnalyticsPresenceService service = new AnalyticsPresenceService(presenceRepository, FIXED_CLOCK);

        service.touch(PresenceRequest.builder()
                .sessionId("  sid_abc  ")
                .languageCode("vi")
                .deviceType("desktop")
                .build());

        ArgumentCaptor<LocalDateTime> timeCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(presenceRepository).upsertPresence(eq("sid_abc"), timeCaptor.capture(), eq("vi"), eq("desktop"));
        assertThat(timeCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 10, 29, 4, 0));
    }

    @Test
    @DisplayName("Ngôn ngữ không hợp lệ bị bỏ qua thay vì làm hỏng heartbeat")
    void touchDropsUnknownLanguage() {
        AnalyticsPresenceService service = new AnalyticsPresenceService(presenceRepository, FIXED_CLOCK);

        service.touch(PresenceRequest.builder()
                .sessionId("sid_abc")
                .languageCode("fr")
                .build());

        verify(presenceRepository).upsertPresence(eq("sid_abc"), any(), isNull(), isNull());
    }

    @Test
    @DisplayName("Session id rỗng không ghi gì cả")
    void touchIgnoresBlankSession() {
        AnalyticsPresenceService service = new AnalyticsPresenceService(presenceRepository, FIXED_CLOCK);

        service.touch(PresenceRequest.builder().sessionId("   ").build());

        verify(presenceRepository, never()).upsertPresence(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Lỗi ghi DB không được ném ra ngoài")
    void touchSwallowsRepositoryErrors() {
        AnalyticsPresenceService service = new AnalyticsPresenceService(presenceRepository, FIXED_CLOCK);
        doThrow(new RuntimeException("boom")).when(presenceRepository).upsertPresence(any(), any(), any(), any());

        service.touch(PresenceRequest.builder().sessionId("sid_abc").build());

        verify(presenceRepository).upsertPresence(eq("sid_abc"), any(), any(), any());
    }
}
