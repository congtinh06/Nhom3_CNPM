package com.echora.analytics.controller;

import com.echora.analytics.config.AnalyticsAdminFilter;
import com.echora.analytics.dto.AnalyticsTrendsResponse;
import com.echora.analytics.service.AnalyticsSummaryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsTrendsController.class)
@Import(AnalyticsAdminFilter.class)
@TestPropertySource(properties = "internal.api-key=test-gateway-internal-key")
class AnalyticsTrendsControllerTest {

    private static final String GATEWAY_KEY = "test-gateway-internal-key";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsSummaryService analyticsSummaryService;

    @Test
    @DisplayName("GET /api/analytics/admin/trends: có role ADMIN + khóa nội bộ -> 200 OK")
    void testGetTrends_returns200() throws Exception {
        when(analyticsSummaryService.getTrends(eq(14))).thenReturn(sampleTrends());

        mockMvc.perform(get("/api/analytics/admin/trends")
                        .header("X-User-Role", "ADMIN")
                        .header("X-Internal-Api-Key", GATEWAY_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(2))
                .andExpect(jsonPath("$.series.length()").value(2))
                .andExpect(jsonPath("$.series[0].date").value("2026-10-24"))
                .andExpect(jsonPath("$.series[0].scans").value(9))
                .andExpect(jsonPath("$.series[1].scans").value(12))
                .andExpect(jsonPath("$.today.scans").value(12))
                .andExpect(jsonPath("$.yesterday.scans").value(9));
    }

    @Test
    @DisplayName("GET /api/analytics/admin/trends: thiếu header gateway -> 403 Forbidden")
    void testGetTrends_missingHeaders_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/admin/trends"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/admin/trends: role không phải ADMIN -> 403 Forbidden")
    void testGetTrends_wrongRole_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/admin/trends")
                        .header("X-User-Role", "USER")
                        .header("X-Internal-Api-Key", GATEWAY_KEY))
                .andExpect(status().isForbidden());
    }

    private AnalyticsTrendsResponse sampleTrends() {
        return AnalyticsTrendsResponse.builder()
                .days(2)
                .series(List.of(
                        AnalyticsTrendsResponse.DailyPointDto.builder()
                                .date("2026-10-24")
                                .visits(5L)
                                .scans(9L)
                                .plays(3L)
                                .build(),
                        AnalyticsTrendsResponse.DailyPointDto.builder()
                                .date("2026-10-25")
                                .visits(4L)
                                .scans(12L)
                                .plays(7L)
                                .build()
                ))
                .today(AnalyticsTrendsResponse.DailyCountsDto.builder()
                        .visits(4L).scans(12L).plays(7L).build())
                .yesterday(AnalyticsTrendsResponse.DailyCountsDto.builder()
                        .visits(5L).scans(9L).plays(3L).build())
                .build();
    }
}
