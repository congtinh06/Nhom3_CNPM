package com.echora.analytics.service;

import com.echora.analytics.client.ContentServiceClient;
import com.echora.analytics.dto.AnalyticsSummaryResponse;
import com.echora.analytics.dto.ContentPoiResponse;
import com.echora.analytics.repository.AnalyticsEventRepository;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsSummaryServiceTest {

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @Mock
    private ContentServiceClient contentServiceClient;

    @InjectMocks
    private AnalyticsSummaryServiceImpl analyticsSummaryService;

    @Test
    @DisplayName("Summary correctly aggregates scans, plays, zeros for missing keys, and populates Feign POI names")
    void testGetSummary_successWithFeign() {
        when(analyticsEventRepository.countByEventType("SCAN")).thenReturn(150L);
        when(analyticsEventRepository.countScansByTriggerType()).thenReturn(List.of(
                new Object[]{"QR", 100L},
                new Object[]{"GPS", 50L}
                // MANUAL is missing, should default to 0
        ));

        when(analyticsEventRepository.countByEventType("VISIT")).thenReturn(42L);
        when(analyticsEventRepository.countVisitsByTriggerType()).thenReturn(List.<Object[]>of(
                new Object[]{"QR", 30L}
                // DIRECT is missing, should default to 0
        ));
        when(analyticsEventRepository.countOnlineSessions(any())).thenReturn(7L);

        when(analyticsEventRepository.countStartedByEventType("AUDIO_PLAY")).thenReturn(80L);
        when(analyticsEventRepository.countByEventTypeAndCompletedTrue("AUDIO_PLAY")).thenReturn(60L);
        when(analyticsEventRepository.countAudioPlaysByLanguage()).thenReturn(List.of(
                new Object[]{"vi", 50L},
                new Object[]{"en", 30L}
                // ja and ko missing, should default to 0
        ));

        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class))).thenReturn(List.of(
                new Object[]{1L, 100L, 50L},
                new Object[]{2L, 50L, 30L}
        ));

        when(contentServiceClient.getPoiById(eq(1L), eq("vi")))
                .thenReturn(new ContentPoiResponse(1L, "Chợ Bến Thành"));
        when(contentServiceClient.getPoiById(eq(2L), eq("vi")))
                .thenReturn(new ContentPoiResponse(2L, "Nhà hát Thành phố"));

        AnalyticsSummaryResponse summary = analyticsSummaryService.getSummary();

        assertThat(summary.getTotalScans()).isEqualTo(150L);
        assertThat(summary.getScansByTrigger()).containsEntry("QR", 100L);
        assertThat(summary.getScansByTrigger()).containsEntry("GPS", 50L);
        assertThat(summary.getScansByTrigger()).containsEntry("MANUAL", 0L);

        assertThat(summary.getTotalVisits()).isEqualTo(42L);
        assertThat(summary.getVisitsByTrigger()).containsEntry("QR", 30L);
        assertThat(summary.getVisitsByTrigger()).containsEntry("DIRECT", 0L);
        assertThat(summary.getOnlineVisitors()).isEqualTo(7L);

        assertThat(summary.getTotalAudioPlays()).isEqualTo(80L);
        assertThat(summary.getAudioCompleted()).isEqualTo(60L);
        assertThat(summary.getPlaysByLanguage()).containsEntry("vi", 50L);
        assertThat(summary.getPlaysByLanguage()).containsEntry("en", 30L);
        assertThat(summary.getPlaysByLanguage()).containsEntry("ja", 0L);
        assertThat(summary.getPlaysByLanguage()).containsEntry("ko", 0L);

        assertThat(summary.getTopPois()).hasSize(2);
        assertThat(summary.getTopPois().get(0).getPoiId()).isEqualTo(1L);
        assertThat(summary.getTopPois().get(0).getName()).isEqualTo("Chợ Bến Thành");
        assertThat(summary.getTopPois().get(0).getScans()).isEqualTo(100L);
        assertThat(summary.getTopPois().get(0).getPlays()).isEqualTo(50L);

        assertThat(summary.getTopPois().get(1).getPoiId()).isEqualTo(2L);
        assertThat(summary.getTopPois().get(1).getName()).isEqualTo("Nhà hát Thành phố");
    }

    @Test
    @DisplayName("Summary handles Feign failure gracefully by setting name to null without failing")
    void testGetSummary_feignFailureFallback_setsNameToNull() {
        when(analyticsEventRepository.countByEventType("SCAN")).thenReturn(10L);
        when(analyticsEventRepository.countScansByTriggerType()).thenReturn(List.<Object[]>of());
        when(analyticsEventRepository.countByEventType("VISIT")).thenReturn(3L);
        when(analyticsEventRepository.countVisitsByTriggerType()).thenReturn(List.<Object[]>of());
        when(analyticsEventRepository.countOnlineSessions(any())).thenReturn(2L);
        when(analyticsEventRepository.countStartedByEventType("AUDIO_PLAY")).thenReturn(5L);
        when(analyticsEventRepository.countByEventTypeAndCompletedTrue("AUDIO_PLAY")).thenReturn(2L);
        when(analyticsEventRepository.countAudioPlaysByLanguage()).thenReturn(List.<Object[]>of());

        when(analyticsEventRepository.findTopPoisRaw(any(Pageable.class)))
                .thenReturn(Collections.singletonList(new Object[]{99L, 10L, 5L}));

        Request request = Request.create(
                Request.HttpMethod.GET,
                "/api/content/pois/99?lang=vi",
                Collections.emptyMap(),
                null,
                StandardCharsets.UTF_8,
                new RequestTemplate()
        );
        when(contentServiceClient.getPoiById(eq(99L), eq("vi")))
                .thenThrow(new FeignException.NotFound("POI not found", request, null, null));

        AnalyticsSummaryResponse summary = analyticsSummaryService.getSummary();

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalScans()).isEqualTo(10L);
        assertThat(summary.getTotalVisits()).isEqualTo(3L);
        assertThat(summary.getVisitsByTrigger()).containsEntry("QR", 0L);
        assertThat(summary.getVisitsByTrigger()).containsEntry("DIRECT", 0L);
        assertThat(summary.getOnlineVisitors()).isEqualTo(2L);
        assertThat(summary.getTopPois()).hasSize(1);
        assertThat(summary.getTopPois().get(0).getPoiId()).isEqualTo(99L);
        assertThat(summary.getTopPois().get(0).getName()).isNull();
        assertThat(summary.getTopPois().get(0).getScans()).isEqualTo(10L);
        assertThat(summary.getTopPois().get(0).getPlays()).isEqualTo(5L);
    }
}
