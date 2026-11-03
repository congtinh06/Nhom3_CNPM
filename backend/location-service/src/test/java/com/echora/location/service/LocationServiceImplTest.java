package com.echora.location.service;

import com.echora.location.client.ResilientContentServiceClient;
import com.echora.location.dto.NearbyPoiDto;
import com.echora.location.dto.NearbyPoisResponse;
import com.echora.location.dto.PoiBoundingBoxDto;
import com.echora.location.dto.PoiInternalQrDto;
import com.echora.location.dto.ResolvePoiResponse;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import feign.RetryableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceImplTest {

    @Mock
    private ResilientContentServiceClient contentServiceClient;

    private LocationServiceImpl locationService;

    @BeforeEach
    void setUp() {
        locationService = new LocationServiceImpl(contentServiceClient, 5000.0);
    }

    @Test
    @DisplayName("nearby: filters out POIs outside radius and sorts ascending by distance")
    void testGetNearbyPois_FiltersAndSorts() {
        // User at Saigon Central Post Office: 10.7799000, 106.7001000
        double userLat = 10.7799000;
        double userLng = 106.7001000;

        // POI 1: Central Post Office itself (distance ~0m)
        PoiBoundingBoxDto poi1 = PoiBoundingBoxDto.builder()
                .poiId(1L).poiCode("POI_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        // POI 2: Notre-Dame Cathedral (~120m away: 10.7798, 106.6990)
        PoiBoundingBoxDto poi2 = PoiBoundingBoxDto.builder()
                .poiId(2L).poiCode("POI_02").name("Nhà thờ Đức Bà")
                .latitude(new BigDecimal("10.7798000")).longitude(new BigDecimal("106.6990000"))
                .triggerRadiusMeters(50).build();

        // POI 3: Ben Thanh Market (~950m away: 10.7725, 106.6980)
        PoiBoundingBoxDto poi3 = PoiBoundingBoxDto.builder()
                .poiId(3L).poiCode("POI_03").name("Chợ Bến Thành")
                .latitude(new BigDecimal("10.7725000")).longitude(new BigDecimal("106.6980000"))
                .triggerRadiusMeters(60).build();

        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenReturn(List.of(poi3, poi1, poi2));

        // Search with radius 200m -> POI 3 must be filtered out
        NearbyPoisResponse response = locationService.getNearbyPois(userLat, userLng, 200.0);
        List<NearbyPoiDto> nearby = response.getPois();

        assertThat(response.isDegraded()).isFalse();
        assertThat(nearby).hasSize(2);
        // Sorted ascending: POI 1 first (~0m), then POI 2 (~120m)
        assertThat(nearby.get(0).getPoiId()).isEqualTo(1L);
        assertThat(nearby.get(0).getDistanceMeters()).isLessThan(1.0);
        assertThat(nearby.get(1).getPoiId()).isEqualTo(2L);
        assertThat(nearby.get(1).getDistanceMeters()).isGreaterThan(100.0);
    }

    @Test
    @DisplayName("nearby: returns empty degraded response when content-service times out")
    void testGetNearbyPois_Timeout_ReturnsDegraded() {
        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new RetryableException(
                        503,
                        "Read timed out",
                        Request.HttpMethod.GET,
                        new Date(),
                        dummyRequest()));

        NearbyPoisResponse response = locationService.getNearbyPois(10.7799, 106.7001, 500.0);

        assertThat(response.isDegraded()).isTrue();
        assertThat(response.getPois()).isEmpty();
        assertThat(response.getNotice()).contains("thử lại");
    }

    @Test
    @DisplayName("nearby: returns empty degraded response when content-service returns 5xx")
    void testGetNearbyPois_ServerError_ReturnsDegraded() {
        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new FeignException.ServiceUnavailable(
                        "Service Unavailable", dummyRequest(), null, null));

        NearbyPoisResponse response = locationService.getNearbyPois(10.7799, 106.7001, 500.0);

        assertThat(response.isDegraded()).isTrue();
        assertThat(response.getPois()).isEmpty();
    }

    @Test
    @DisplayName("nearby: propagates 4xx instead of masking it as degraded")
    void testGetNearbyPois_ClientError_IsNotDegraded() {
        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new FeignException.BadRequest("Bad Request", dummyRequest(), null, null));

        assertThatThrownBy(() -> locationService.getNearbyPois(10.7799, 106.7001, 500.0))
                .isInstanceOf(FeignException.BadRequest.class);
    }

    private Request dummyRequest() {
        return Request.create(
                Request.HttpMethod.GET,
                "http://localhost:8085/api/content/internal/pois/bounding-box",
                Collections.emptyMap(),
                null,
                StandardCharsets.UTF_8,
                new RequestTemplate());
    }

    @Test
    @DisplayName("resolve: returns not matched when user is outside all POI geofences")
    void testResolvePoi_OutsideGeofence() {
        // User at 10.7820, 106.7020 (~300m away from POI 1)
        double userLat = 10.7820000;
        double userLng = 106.7020000;

        PoiBoundingBoxDto poi1 = PoiBoundingBoxDto.builder()
                .poiId(1L).poiCode("POI_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenReturn(List.of(poi1));

        ResolvePoiResponse response = locationService.resolvePoi(userLat, userLng);

        assertThat(response.isMatched()).isFalse();
        assertThat(response.getPoi()).isNull();
    }

    @Test
    @DisplayName("resolve: returns matched POI when user is within trigger radius")
    void testResolvePoi_InsideGeofence() {
        // User is 10m away from POI 1
        double userLat = 10.7799000;
        double userLng = 106.7001000;

        PoiBoundingBoxDto poi1 = PoiBoundingBoxDto.builder()
                .poiId(1L).poiCode("POI_01").name("Bưu điện Trung tâm")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenReturn(List.of(poi1));

        ResolvePoiResponse response = locationService.resolvePoi(userLat, userLng);

        assertThat(response.isMatched()).isTrue();
        assertThat(response.getPoi()).isNotNull();
        assertThat(response.getPoi().getPoiId()).isEqualTo(1L);
        assertThat(response.getPoi().getDistanceMeters()).isLessThan(1.0);
    }

    @Test
    @DisplayName("resolve: when multiple POI geofences overlap user, selects the closest one")
    void testResolvePoi_MultipleOverlappingGeofences_PicksClosest() {
        // User is at (10.7799000, 106.7001000)
        double userLat = 10.7799000;
        double userLng = 106.7001000;

        // POI A is 10m away, triggerRadius 50m (User is inside)
        PoiBoundingBoxDto poiA = PoiBoundingBoxDto.builder()
                .poiId(10L).poiCode("POI_A").name("POI A")
                .latitude(new BigDecimal("10.7799900")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        // POI B is 35m away, triggerRadius 50m (User is also inside)
        PoiBoundingBoxDto poiB = PoiBoundingBoxDto.builder()
                .poiId(20L).poiCode("POI_B").name("POI B")
                .latitude(new BigDecimal("10.7802000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        when(contentServiceClient.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenReturn(List.of(poiB, poiA)); // Returned in any order

        ResolvePoiResponse response = locationService.resolvePoi(userLat, userLng);

        assertThat(response.isMatched()).isTrue();
        assertThat(response.getPoi()).isNotNull();
        // Must pick POI A because it is closer (~10m vs ~33m)
        assertThat(response.getPoi().getPoiId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("resolveByQr: calls contentServiceClient and returns POI info")
    void testResolveByQr_Success() {
        PoiInternalQrDto expected = PoiInternalQrDto.builder()
                .poiId(100L).poiCode("POI_TEST").title("Bưu điện Trung tâm Sài Gòn")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).build();

        when(contentServiceClient.getPoiByQrToken("qr-test-token")).thenReturn(expected);

        PoiInternalQrDto actual = locationService.resolveByQr("qr-test-token");

        assertThat(actual.getPoiId()).isEqualTo(100L);
        assertThat(actual.getTitle()).isEqualTo("Bưu điện Trung tâm Sài Gòn");
        verify(contentServiceClient).getPoiByQrToken("qr-test-token");
    }

    @Test
    @DisplayName("validation: rejects out-of-bounds latitude and longitude")
    void testValidation_Coordinates() {
        assertThatThrownBy(() -> locationService.getNearbyPois(95.0, 106.0, 500.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude must be between -90 and 90");

        assertThatThrownBy(() -> locationService.getNearbyPois(10.0, 200.0, 500.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Longitude must be between -180 and 180");
    }

    @Test
    @DisplayName("validation: rejects non-positive radius and radius exceeding maximum")
    void testValidation_Radius() {
        assertThatThrownBy(() -> locationService.getNearbyPois(10.0, 106.0, 0.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Radius must be greater than 0");

        assertThatThrownBy(() -> locationService.getNearbyPois(10.0, 106.0, -10.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Radius must be greater than 0");

        assertThatThrownBy(() -> locationService.getNearbyPois(10.0, 106.0, 6000.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Radius exceeds maximum allowed limit");
    }
}
