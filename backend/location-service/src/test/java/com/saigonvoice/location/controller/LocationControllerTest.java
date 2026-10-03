package com.saigonvoice.location.controller;

import com.saigonvoice.location.dto.NearbyPoiDto;
import com.saigonvoice.location.dto.PoiInternalQrDto;
import com.saigonvoice.location.dto.ResolvePoiResponse;
import com.saigonvoice.location.exception.GlobalExceptionHandler;
import com.saigonvoice.location.service.LocationService;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import feign.RetryableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LocationController.class)
@Import(GlobalExceptionHandler.class)
class LocationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LocationService locationService;

    private Request dummyRequest() {
        return Request.create(
                Request.HttpMethod.GET,
                "http://localhost:8085/api/content/internal/pois",
                Collections.emptyMap(),
                null,
                StandardCharsets.UTF_8,
                new RequestTemplate()
        );
    }

    @Test
    @DisplayName("GET /nearby: returns 200 with list of POIs")
    void testGetNearby_Success() throws Exception {
        NearbyPoiDto poi = NearbyPoiDto.builder()
                .poiId(1L).poiCode("POI_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).distanceMeters(25.5)
                .build();

        when(locationService.getNearbyPois(10.7799, 106.7001, 500.0)).thenReturn(List.of(poi));

        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001")
                        .param("radius", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].poiId").value(1L))
                .andExpect(jsonPath("$[0].poiCode").value("POI_01"))
                .andExpect(jsonPath("$[0].distanceMeters").value(25.5));
    }

    @Test
    @DisplayName("GET /nearby: returns 400 when coordinates or radius are invalid")
    void testGetNearby_InvalidParams_Returns400() throws Exception {
        when(locationService.getNearbyPois(anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new IllegalArgumentException("Latitude must be between -90 and 90 degrees"));

        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "100.0")
                        .param("lng", "106.7001")
                        .param("radius", "500"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Latitude must be between -90 and 90 degrees"));
    }

    @Test
    @DisplayName("GET /nearby: returns 400 when missing required parameter")
    void testGetNearby_MissingParam_Returns400() throws Exception {
        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("GET /nearby: returns 400 with Parameter 'lat' must be a valid number when lat=abc")
    void testGetNearby_TypeMismatch_Returns400() throws Exception {
        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "abc")
                        .param("lng", "106.7001")
                        .param("radius", "500"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Parameter 'lat' must be a valid number"));
    }

    @Test
    @DisplayName("GET /resolve: returns 200 with matched false when no POI in geofence")
    void testResolve_NotMatched() throws Exception {
        when(locationService.resolvePoi(10.7799, 106.7001))
                .thenReturn(ResolvePoiResponse.notMatched());

        mockMvc.perform(get("/api/location/resolve")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matched").value(false))
                .andExpect(jsonPath("$.poi").doesNotExist());
    }

    @Test
    @DisplayName("GET /resolve: returns 200 with matched true and closest POI")
    void testResolve_Matched() throws Exception {
        NearbyPoiDto poi = NearbyPoiDto.builder()
                .poiId(1L).poiCode("POI_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).distanceMeters(10.2)
                .build();

        when(locationService.resolvePoi(10.7799, 106.7001))
                .thenReturn(ResolvePoiResponse.matched(poi));

        mockMvc.perform(get("/api/location/resolve")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matched").value(true))
                .andExpect(jsonPath("$.poi.poiId").value(1L))
                .andExpect(jsonPath("$.poi.distanceMeters").value(10.2));
    }

    @Test
    @DisplayName("GET /qr/{qrToken}: returns 200 with POI details")
    void testResolveByQr_Success() throws Exception {
        PoiInternalQrDto poi = PoiInternalQrDto.builder()
                .poiId(1L).poiCode("POI_01").title("Bưu điện Trung tâm Sài Gòn")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        when(locationService.resolveByQr("qr-buu-dien-01")).thenReturn(poi);

        mockMvc.perform(get("/api/location/qr/qr-buu-dien-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poiId").value(1L))
                .andExpect(jsonPath("$.title").value("Bưu điện Trung tâm Sài Gòn"));
    }

    @Test
    @DisplayName("GET /qr/{qrToken}: returns 404 when QR token is not found in content-service")
    void testResolveByQr_NotFound_Returns404() throws Exception {
        when(locationService.resolveByQr("unknown-token"))
                .thenThrow(new FeignException.NotFound("Not Found", dummyRequest(), null, null));

        mockMvc.perform(get("/api/location/qr/unknown-token"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("GET /nearby: returns 503 without stack trace when content-service times out")
    void testGetNearby_Timeout_Returns503() throws Exception {
        when(locationService.getNearbyPois(anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new RetryableException(
                        503,
                        "Read timed out",
                        Request.HttpMethod.GET,
                        new Date(),
                        dummyRequest()
                ));

        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001")
                        .param("radius", "500"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.message").value("Content-service is currently unavailable or timed out"))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("GET /nearby: returns 503 without stack trace when content-service is down")
    void testGetNearby_Down_Returns503() throws Exception {
        when(locationService.getNearbyPois(anyDouble(), anyDouble(), anyDouble()))
                .thenThrow(new FeignException.ServiceUnavailable("Service Unavailable", dummyRequest(), null, null));

        mockMvc.perform(get("/api/location/nearby")
                        .param("lat", "10.7799")
                        .param("lng", "106.7001")
                        .param("radius", "500"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }
}
