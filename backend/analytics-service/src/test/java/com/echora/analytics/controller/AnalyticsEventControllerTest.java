package com.echora.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.echora.analytics.dto.CreateEventRequest;
import com.echora.analytics.exception.AnalyticsPublishException;
import com.echora.analytics.exception.GlobalExceptionHandler;
import com.echora.analytics.service.AnalyticsEventService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AnalyticsEventController.class)
@Import(GlobalExceptionHandler.class)
class AnalyticsEventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnalyticsEventService analyticsEventService;

    @Test
    @DisplayName("POST /api/analytics/events returns 202 Accepted when valid SCAN event")
    void testRecordEvent_validScan_returns202() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(1L)
                .languageCode("vi")
                .triggerType("QR")
                .sessionId("sess-123")
                .build();

        doNothing().when(analyticsEventService).processAndPublish(any(CreateEventRequest.class));

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());
    }

    @Test
    @DisplayName("POST /api/analytics/events returns 202 Accepted when valid AUDIO_PLAY event")
    void testRecordEvent_validAudioPlay_returns202() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("AUDIO_PLAY")
                .poiId(2L)
                .languageCode("en")
                .completed(true)
                .build();

        doNothing().when(analyticsEventService).processAndPublish(any(CreateEventRequest.class));

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isAccepted());
    }

    @Test
    @DisplayName("POST /api/analytics/events returns 400 Bad Request on invalid request body")
    void testRecordEvent_invalidRequest_returns400() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(1L)
                .languageCode("vi")
                // Missing triggerType for SCAN
                .build();

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.errors").isMap());
    }

    @Test
    @DisplayName("POST /api/analytics/events returns 400 ProblemDetail on malformed JSON")
    void testRecordEvent_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://api.echora.dev/problems/400"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.detail").value(
                        "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra định dạng JSON và thử lại."));
    }

    @Test
    @DisplayName("POST /api/analytics/events returns 503 Service Unavailable when broker publish fails")
    void testRecordEvent_brokerPublishFails_returns503() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .eventType("SCAN")
                .poiId(1L)
                .languageCode("vi")
                .triggerType("GPS")
                .build();

        doThrow(new AnalyticsPublishException("Broker connection error", new RuntimeException("connection refused")))
                .when(analyticsEventService).processAndPublish(any(CreateEventRequest.class));

        mockMvc.perform(post("/api/analytics/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.title").value("Service Unavailable"))
                .andExpect(jsonPath("$.detail").value("Service is temporarily unable to process event due to message broker unavailability"));
    }
}
