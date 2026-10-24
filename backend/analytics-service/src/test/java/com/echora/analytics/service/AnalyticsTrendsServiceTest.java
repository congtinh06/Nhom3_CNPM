package com.echora.analytics.service;

import com.echora.analytics.client.ContentServiceClient;
import com.echora.analytics.dto.AnalyticsTrendsResponse;
import com.echora.analytics.repository.AnalyticsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsTrendsServiceTest {

    /** Đóng băng đồng hồ tại 2026-10-25T00:00:00Z => 07:00 giờ Việt Nam, today = 2026-10-25. */
    private static final Instant FROZEN = Instant.parse("2026-10-25T00:00:00Z");

    @Mock
    private AnalyticsEventRepository analyticsEventRepository;

    @Mock
    private ContentServiceClient contentServiceClient;

    @InjectMocks
    private AnalyticsSummaryServiceImpl analyticsSummaryService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(analyticsSummaryService, "clock", Clock.fixed(FROZEN, ZoneOffset.UTC));
        lenient().when(analyticsEventRepository.findDailyEventSeries(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of());
    }

    @Test
    @DisplayName("Trends điền đủ số ngày, map số liệu theo ngày và tách today/yesterday")
    void testGetTrends_mapsRowsAndSeparatesTodayYesterday() {
        when(analyticsEventRepository.findDailyEventSeries(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(
                        new Object[]{"2026-10-23", 5L, 8L, 3L},
                        new Object[]{"2026-10-24", 11L, 20L, 15L},
                        new Object[]{"2026-10-25", 4L, 12L, 9L}
                ));

        AnalyticsTrendsResponse trends = analyticsSummaryService.getTrends(3);

        assertThat(trends.getDays()).isEqualTo(3);
        assertThat(trends.getSeries()).hasSize(3);
        assertThat(trends.getSeries().get(0).getDate()).isEqualTo("2026-10-23");
        assertThat(trends.getSeries().get(1).getScans()).isEqualTo(20L);
        assertThat(trends.getSeries().get(2).getDate()).isEqualTo("2026-10-25");

        assertThat(trends.getToday().getScans()).isEqualTo(12L);
        assertThat(trends.getToday().getVisits()).isEqualTo(4L);
        assertThat(trends.getToday().getPlays()).isEqualTo(9L);
        assertThat(trends.getYesterday().getScans()).isEqualTo(20L);
        assertThat(trends.getYesterday().getVisits()).isEqualTo(11L);
        assertThat(trends.getYesterday().getPlays()).isEqualTo(15L);
    }

    @Test
    @DisplayName("Trends điền 0 cho ngày trống trên chuỗi biểu đồ")
    void testGetTrends_fillsMissingDaysWithZero() {
        when(analyticsEventRepository.findDailyEventSeries(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(new Object[]{"2026-10-24", 7L, 9L, 2L}));

        AnalyticsTrendsResponse trends = analyticsSummaryService.getTrends(3);

        assertThat(trends.getSeries()).hasSize(3);
        assertThat(trends.getSeries().get(0).getDate()).isEqualTo("2026-10-23");
        assertThat(trends.getSeries().get(0).getScans()).isEqualTo(0L);
        assertThat(trends.getSeries().get(1).getScans()).isEqualTo(9L);
        assertThat(trends.getSeries().get(2).getScans()).isEqualTo(0L);
        assertThat(trends.getToday().getScans()).isEqualTo(0L);
        assertThat(trends.getYesterday().getScans()).isEqualTo(9L);
    }

    @Test
    @DisplayName("Trends trả về 14 ngày mặc định khi days <= 0 và giới hạn tối đa 60 ngày")
    void testGetTrends_clampsDays() {
        assertThat(analyticsSummaryService.getTrends(0).getDays()).isEqualTo(14);
        assertThat(analyticsSummaryService.getTrends(-5).getDays()).isEqualTo(14);
        assertThat(analyticsSummaryService.getTrends(500).getDays()).isEqualTo(60);
        assertThat(analyticsSummaryService.getTrends(500).getSeries()).hasSize(60);
    }

    @Test
    @DisplayName("Trends không fail khi query báo lỗi: trả về chuỗi toàn 0")
    void testGetTrends_repositoryFailureReturnsZeros() {
        when(analyticsEventRepository.findDailyEventSeries(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("db down"));

        AnalyticsTrendsResponse trends = analyticsSummaryService.getTrends(7);

        assertThat(trends.getSeries()).hasSize(7);
        assertThat(trends.getSeries().get(0).getVisits()).isEqualTo(0L);
        assertThat(trends.getSeries().get(6).getScans()).isEqualTo(0L);
        assertThat(trends.getToday().getScans()).isEqualTo(0L);
        assertThat(trends.getYesterday().getScans()).isEqualTo(0L);
    }

    @Test
    @DisplayName("Trends gửi đúng khoảng thời gian UTC cho bucket giờ Việt Nam")
    void testGetTrends_passesUtcRangeForVietnamBuckets() {
        analyticsSummaryService.getTrends(1);

        org.mockito.ArgumentCaptor<LocalDateTime> fromCaptor =
                org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        org.mockito.ArgumentCaptor<LocalDateTime> toCaptor =
                org.mockito.ArgumentCaptor.forClass(LocalDateTime.class);
        verify(analyticsEventRepository).findDailyEventSeries(fromCaptor.capture(), toCaptor.capture());

        assertThat(fromCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 10, 24, 17, 0));
        assertThat(toCaptor.getValue()).isEqualTo(LocalDateTime.of(2026, 10, 25, 17, 0));
    }
}
