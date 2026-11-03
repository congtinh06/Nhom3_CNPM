package com.echora.analytics.controller;

import com.echora.analytics.config.AnalyticsAdminFilter;
import com.echora.analytics.dto.AnalyticsSummaryResponse;
import com.echora.analytics.service.AnalyticsSummaryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsSummaryController.class)
@Import(AnalyticsAdminFilter.class)
@TestPropertySource(properties = "internal.api-key=test-gateway-internal-key")
class AnalyticsSummaryControllerTest {

    private static final String GATEWAY_KEY = "test-gateway-internal-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AnalyticsSummaryController analyticsSummaryController;

    @MockBean
    private AnalyticsSummaryService analyticsSummaryService;

    private AnalyticsSummaryResponse sampleResponse() {
        return AnalyticsSummaryResponse.builder()
                .totalScans(100L)
                .scansByTrigger(Map.of("QR", 80L, "GPS", 15L, "MANUAL", 5L))
                .totalAudioPlays(50L)
                .audioCompleted(35L)
                .playsByLanguage(Map.of("vi", 30L, "en", 15L, "ja", 5L, "ko", 0L))
                .topPois(List.of(
                        AnalyticsSummaryResponse.TopPoiDto.builder()
                                .poiId(1L)
                                .name("Chợ Bến Thành")
                                .scans(50L)
                                .plays(20L)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/analytics/summary: có X-User-Role ADMIN + khóa nội bộ -> 200 OK")
    void testGetSummary_returns200() throws Exception {
        when(analyticsSummaryService.getSummary()).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/analytics/summary")
                        .header("X-User-Role", "ADMIN")
                        .header("X-Internal-Api-Key", GATEWAY_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScans").value(100))
                .andExpect(jsonPath("$.scansByTrigger.QR").value(80))
                .andExpect(jsonPath("$.scansByTrigger.GPS").value(15))
                .andExpect(jsonPath("$.scansByTrigger.MANUAL").value(5))
                .andExpect(jsonPath("$.totalAudioPlays").value(50))
                .andExpect(jsonPath("$.audioCompleted").value(35))
                .andExpect(jsonPath("$.playsByLanguage.vi").value(30))
                .andExpect(jsonPath("$.playsByLanguage.ko").value(0))
                .andExpect(jsonPath("$.topPois[0].poiId").value(1))
                .andExpect(jsonPath("$.topPois[0].name").value("Chợ Bến Thành"))
                .andExpect(jsonPath("$.topPois[0].scans").value(50))
                .andExpect(jsonPath("$.topPois[0].plays").value(20));
    }

    @Test
    @DisplayName("GET /api/analytics/summary: thiếu header gateway -> 403 Forbidden")
    void testGetSummary_missingHeaders_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/summary"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.detail").value("Bạn không có quyền thực hiện thao tác này."));
    }

    @Test
    @DisplayName("GET /api/analytics/summary: thiếu khóa nội bộ -> 403 Forbidden")
    void testGetSummary_missingInternalKey_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .header("X-User-Role", "ADMIN"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/summary: sai khóa nội bộ -> 403 Forbidden")
    void testGetSummary_wrongInternalKey_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .header("X-User-Role", "ADMIN")
                        .header("X-Internal-Api-Key", "wrong-key"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/summary: role không phải ADMIN -> 403 Forbidden")
    void testGetSummary_wrongRole_returns403() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .header("X-User-Role", "USER")
                        .header("X-Internal-Api-Key", GATEWAY_KEY))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/analytics/summary: khóa nội bộ chưa cấu hình -> fail-closed 403")
    void testGetSummary_noConfiguredKey_failsClosed() throws Exception {
        AnalyticsAdminFilter unconfigured = new AnalyticsAdminFilter();
        ReflectionTestUtils.setField(unconfigured, "expectedApiKey", "");

        MockMvc failClosedMvc = MockMvcBuilders.standaloneSetup(analyticsSummaryController)
                .addFilters(unconfigured)
                .build();

        failClosedMvc.perform(get("/api/analytics/summary")
                        .header("X-User-Role", "ADMIN")
                        .header("X-Internal-Api-Key", GATEWAY_KEY))
                .andExpect(status().isForbidden());
    }
}
