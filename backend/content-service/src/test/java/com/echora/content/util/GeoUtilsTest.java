package com.echora.content.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeoUtilsTest {

    @Test
    @DisplayName("Tính khoảng cách Haversine giữa Nhà thờ Đức Bà và Chợ Bến Thành (khoảng ~830m)")
    void haversineBetweenDucBaAndBenThanh() {
        // Nhà thờ Đức Bà: 10.7798, 106.6990
        // Chợ Bến Thành: 10.7725, 106.6980
        double dist = GeoUtils.haversineMeters(10.7798, 106.6990, 10.7725, 106.6980);
        assertThat(dist).isCloseTo(820.0, within(50.0));
    }

    @Test
    @DisplayName("doZonesOverlap trả về true khi khoảng cách tâm < tổng bán kính")
    void overlapDetectedWhenDistanceLessThanSumRadii() {
        BigDecimal lat1 = new BigDecimal("10.7769000");
        BigDecimal lng1 = new BigDecimal("106.7009000");
        int r1 = 600;

        // Điểm cách ~500m (chồng lấn vì 500m < 600m + 400m)
        BigDecimal lat2 = new BigDecimal("10.7800000");
        BigDecimal lng2 = new BigDecimal("106.7030000");
        int r2 = 400;

        boolean overlap = GeoUtils.doZonesOverlap(lat1, lng1, r1, lat2, lng2, r2);
        assertThat(overlap).isTrue();
    }

    @Test
    @DisplayName("doZonesOverlap trả về false khi khoảng cách tâm >= tổng bán kính")
    void noOverlapWhenFarApart() {
        BigDecimal lat1 = new BigDecimal("10.7769000");
        BigDecimal lng1 = new BigDecimal("106.7009000");
        int r1 = 600;

        // Chợ Lớn: cách ~5.4km > 600 + 700 = 1300m
        BigDecimal lat2 = new BigDecimal("10.7533000");
        BigDecimal lng2 = new BigDecimal("106.6575000");
        int r2 = 700;

        boolean overlap = GeoUtils.doZonesOverlap(lat1, lng1, r1, lat2, lng2, r2);
        assertThat(overlap).isFalse();
    }
}
