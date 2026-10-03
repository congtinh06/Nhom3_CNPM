package com.saigonvoice.location.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeoUtilsTest {

    @Test
    @DisplayName("Haversine: 1 degree longitude on Equator equals (R * pi / 180) meters")
    void testHaversine_EquatorOneDegreeLongitude() {
        // Known vector calculation:
        // Sphere with radius R = 6,371,000 m.
        // Arc of 1 degree = R * (pi / 180 rad)
        // = 6371000 * (Math.PI / 180) = 111,194.92664455873 meters.
        double lat1 = 0.0;
        double lng1 = 0.0;
        double lat2 = 0.0;
        double lng2 = 1.0;

        double expected = GeoUtils.EARTH_RADIUS_METERS * (Math.PI / 180.0);
        double actual = GeoUtils.haversineDistanceMeters(lat1, lng1, lat2, lng2);

        assertThat(actual).isCloseTo(expected, within(0.001));
        assertThat(actual).isCloseTo(111194.927, within(0.01));
    }

    @Test
    @DisplayName("Haversine: 1 degree latitude along prime meridian equals (R * pi / 180) meters")
    void testHaversine_MeridianOneDegreeLatitude() {
        // Known vector calculation:
        // Along meridian (lng = 0), 1 degree latitude from (0, 0) to (1, 0):
        // d = R * (pi / 180 rad) = 111,194.927 meters.
        double lat1 = 0.0;
        double lng1 = 0.0;
        double lat2 = 1.0;
        double lng2 = 0.0;

        double expected = GeoUtils.EARTH_RADIUS_METERS * (Math.PI / 180.0);
        double actual = GeoUtils.haversineDistanceMeters(lat1, lng1, lat2, lng2);

        assertThat(actual).isCloseTo(expected, within(0.001));
    }

    @Test
    @DisplayName("Haversine: identical point returns distance 0.0")
    void testHaversine_IdenticalPoint() {
        double dist = GeoUtils.haversineDistanceMeters(10.7799, 106.7001, 10.7799, 106.7001);
        assertThat(dist).isEqualTo(0.0);
    }

    @Test
    @DisplayName("BoundingBox: pre-filter dLat = r/111320 and dLng = r/(111320*cos(lat))")
    void testCalculateBoundingBox_NormalCoordinates() {
        // Given center at Saigon (10.7799, 106.7001), radius = 500 m
        // dLat = 500 / 111320 = 0.004491555875
        // cos(10.7799 deg) = cos(10.7799 * pi / 180) = 0.982367128
        // dLng = 500 / (111320 * 0.982367128) = 0.0045721764
        double lat = 10.7799;
        double lng = 106.7001;
        double radius = 500.0;

        GeoUtils.BoundingBox bbox = GeoUtils.calculateBoundingBox(lat, lng, radius);

        double expectedMinLat = 10.7799 - (500.0 / 111320.0);
        double expectedMaxLat = 10.7799 + (500.0 / 111320.0);
        double expectedDlng = 500.0 / (111320.0 * Math.cos(Math.toRadians(10.7799)));
        double expectedMinLng = 106.7001 - expectedDlng;
        double expectedMaxLng = 106.7001 + expectedDlng;

        assertThat(bbox.minLat().doubleValue()).isCloseTo(expectedMinLat, within(0.00001));
        assertThat(bbox.maxLat().doubleValue()).isCloseTo(expectedMaxLat, within(0.00001));
        assertThat(bbox.minLng().doubleValue()).isCloseTo(expectedMinLng, within(0.00001));
        assertThat(bbox.maxLng().doubleValue()).isCloseTo(expectedMaxLng, within(0.00001));
    }

    @Test
    @DisplayName("BoundingBox: clamps to -90, 90 and -180, 180")
    void testCalculateBoundingBox_Clamping() {
        GeoUtils.BoundingBox bboxNorthPole = GeoUtils.calculateBoundingBox(89.9999, 0.0, 5000.0);
        assertThat(bboxNorthPole.maxLat()).isEqualTo(new BigDecimal("90.0000000"));

        GeoUtils.BoundingBox bboxDateLine = GeoUtils.calculateBoundingBox(0.0, 179.9999, 5000.0);
        assertThat(bboxDateLine.maxLng()).isEqualTo(new BigDecimal("180.0000000"));
    }
}
