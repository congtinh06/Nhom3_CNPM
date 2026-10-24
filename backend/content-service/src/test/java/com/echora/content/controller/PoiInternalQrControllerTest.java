package com.echora.content.controller;

import com.echora.content.config.InternalApiKeyFilter;
import com.echora.content.dto.PoiInternalQrDto;
import com.echora.content.exception.GlobalExceptionHandler;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.service.PoiContentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PoiInternalQrControllerTest {

    private static final String VALID_KEY = "test-internal-secret-key-123";
    private static final String QR_TOKEN = "qr-buu-dien-01";

    @Mock
    private PoiContentService poiContentService;

    @InjectMocks
    private PoiController poiController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        InternalApiKeyFilter filter = new InternalApiKeyFilter();
        ReflectionTestUtils.setField(filter, "expectedApiKey", VALID_KEY);

        mockMvc = MockMvcBuilders.standaloneSetup(poiController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(filter)
                .build();
    }

    @Test
    @DisplayName("GET /api/content/internal/pois/qr/{qrToken}: có key đúng và token tồn tại -> 200 OK")
    void testGetInternalPoiByQrToken_ValidKey_Returns200() throws Exception {
        PoiInternalQrDto dto = PoiInternalQrDto.builder()
                .poiId(1L)
                .poiCode("POI_BUU_DIEN_01")
                .zoneId(1L)
                .latitude(new BigDecimal("10.7799000"))
                .longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(40)
                .title("Bưu điện Trung tâm Sài Gòn")
                .build();

        when(poiContentService.getInternalPoiByQrToken(QR_TOKEN)).thenReturn(dto);

        mockMvc.perform(get("/api/content/internal/pois/qr/{qrToken}", QR_TOKEN)
                        .header(InternalApiKeyFilter.HEADER, VALID_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(1))
                .andExpect(jsonPath("$.poiCode").value("POI_BUU_DIEN_01"))
                .andExpect(jsonPath("$.zoneId").value(1))
                .andExpect(jsonPath("$.latitude").value(10.7799000))
                .andExpect(jsonPath("$.longitude").value(106.7001000))
                .andExpect(jsonPath("$.triggerRadiusMeters").value(40))
                .andExpect(jsonPath("$.title").value("Bưu điện Trung tâm Sài Gòn"));
    }

    @Test
    @DisplayName("GET /api/content/internal/pois/qr/{qrToken}: thiếu header X-Internal-Api-Key -> 401 Unauthorized")
    void testGetInternalPoiByQrToken_MissingKey_Returns401() throws Exception {
        mockMvc.perform(get("/api/content/internal/pois/qr/{qrToken}", QR_TOKEN))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Missing or invalid X-Internal-Api-Key"));
    }

    @Test
    @DisplayName("GET /api/content/internal/pois/qr/{qrToken}: sai header X-Internal-Api-Key -> 401 Unauthorized")
    void testGetInternalPoiByQrToken_InvalidKey_Returns401() throws Exception {
        mockMvc.perform(get("/api/content/internal/pois/qr/{qrToken}", QR_TOKEN)
                        .header(InternalApiKeyFilter.HEADER, "wrong-key"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Missing or invalid X-Internal-Api-Key"));
    }

    @Test
    @DisplayName("GET /api/content/internal/pois/qr/{qrToken}: có key đúng nhưng token không tồn tại -> 404 Not Found")
    void testGetInternalPoiByQrToken_TokenNotFound_Returns404() throws Exception {
        when(poiContentService.getInternalPoiByQrToken("unknown-qr"))
                .thenThrow(new ResourceNotFoundException("POI not found with QR token: unknown-qr"));

        mockMvc.perform(get("/api/content/internal/pois/qr/{qrToken}", "unknown-qr")
                        .header(InternalApiKeyFilter.HEADER, VALID_KEY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("POI not found with QR token: unknown-qr"));
    }

    @Test
    @DisplayName("GET /api/content/pois: request có Origin: http://evil.example không nhận Access-Control-Allow-Origin")
    void noWildcardCorsHeaderOnPublicGet() throws Exception {
        when(poiContentService.getPois(null)).thenReturn(List.of());

        mockMvc.perform(get("/api/content/pois")
                        .header("Origin", "http://evil.example"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("GET /api/content/admin/pois/publish-status: request có Origin: http://evil.example không nhận Access-Control-Allow-Origin")
    void noWildcardCorsHeaderOnAdminGet() throws Exception {
        when(poiContentService.getPublishStatuses("FAILED")).thenReturn(List.of());

        mockMvc.perform(get("/api/content/admin/pois/publish-status")
                        .header("Origin", "http://evil.example"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
