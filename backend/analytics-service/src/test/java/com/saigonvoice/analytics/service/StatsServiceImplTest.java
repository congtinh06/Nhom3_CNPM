package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.StatsResponse;
import com.saigonvoice.analytics.entity.ReportChannel;
import com.saigonvoice.analytics.repository.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsServiceImplTest {

    @Mock
    private ReportRepository repository;

    private StatsServiceImpl statsService;

    @BeforeEach
    void setUp() {
        statsService = new StatsServiceImpl(repository);
    }

    @Test
    @DisplayName("Tính thống kê đúng khi có dữ liệu WEB và SMS")
    void testGetStats_WithMixedData() {
        when(repository.count()).thenReturn(10L);
        when(repository.countByIsPhishing(Boolean.TRUE)).thenReturn(3L);
        when(repository.countByIsPhishing(Boolean.FALSE)).thenReturn(6L);
        when(repository.countByChannel(ReportChannel.WEB)).thenReturn(6L);
        when(repository.countByChannel(ReportChannel.SMS)).thenReturn(4L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.FALSE)).thenReturn(4L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.TRUE)).thenReturn(2L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.FALSE)).thenReturn(2L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.TRUE)).thenReturn(1L);

        StatsResponse stats = statsService.getStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalScans());
        assertEquals(3L, stats.getPhishingDetected());
        assertEquals(6L, stats.getSafeLinks());
        assertEquals(6L, stats.getWebScans());
        assertEquals(4L, stats.getSmsScans());
        assertEquals(4L, stats.getWebSafe());
        assertEquals(2L, stats.getWebPhishing());
        assertEquals(2L, stats.getSmsSafe());
        assertEquals(1L, stats.getSmsPhishing());
        // 3/10 = 30% -> định dạng kiểu Việt Nam dùng dấu phẩy thập phân
        assertEquals("30,0%", stats.getPhishingPercentage());
    }

    @Test
    @DisplayName("Trả về 0 và 0,0% khi database rỗng (không chia cho 0)")
    void testGetStats_EmptyDatabase() {
        when(repository.count()).thenReturn(0L);

        StatsResponse stats = statsService.getStats();

        assertNotNull(stats);
        assertEquals(0L, stats.getTotalScans());
        assertEquals(0L, stats.getPhishingDetected());
        assertEquals(0L, stats.getSafeLinks());
        assertEquals("0,0%", stats.getPhishingPercentage());
    }

    @Test
    @DisplayName("Báo cáo PENDING (isPhishing = null) không tính vào an toàn hay giả mạo")
    void testGetStats_PendingReportsExcludedFromVerdicts() {
        when(repository.count()).thenReturn(5L);
        when(repository.countByIsPhishing(Boolean.TRUE)).thenReturn(1L);
        when(repository.countByIsPhishing(Boolean.FALSE)).thenReturn(2L);
        when(repository.countByChannel(ReportChannel.WEB)).thenReturn(5L);
        when(repository.countByChannel(ReportChannel.SMS)).thenReturn(0L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.FALSE)).thenReturn(2L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.TRUE)).thenReturn(1L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.FALSE)).thenReturn(0L);
        when(repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.TRUE)).thenReturn(0L);

        StatsResponse stats = statsService.getStats();

        assertEquals(5L, stats.getTotalScans());
        // 1 + 2 < 5: 2 báo cáo PENDING không bị tính nhầm vào nhánh nào
        assertEquals(3L, stats.getPhishingDetected() + stats.getSafeLinks());
        assertEquals("20,0%", stats.getPhishingPercentage());
    }
}
