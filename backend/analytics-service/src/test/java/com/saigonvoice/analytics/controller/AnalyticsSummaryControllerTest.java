package com.saigonvoice.analytics.controller;

import com.saigonvoice.analytics.dto.AnalyticsSummaryResponse;
import com.saigonvoice.analytics.service.AnalyticsSummaryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsSummaryController.class)
class AnalyticsSummaryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsSummaryService analyticsSummaryService;

    @Test
    @DisplayName("GET /api/analytics/summary returns 200 OK with expected JSON structure")
    void testGetSummary_returns200() throws Exception {
        AnalyticsSummaryResponse response = AnalyticsSummaryResponse.builder()
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

        when(analyticsSummaryService.getSummary()).thenReturn(response);

        mockMvc.perform(get("/api/analytics/summary")
                        .contentType(MediaType.APPLICATION_JSON))
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
}
