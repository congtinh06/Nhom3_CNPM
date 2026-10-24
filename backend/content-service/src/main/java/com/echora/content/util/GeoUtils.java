package com.echora.content.util;

import java.math.BigDecimal;

/**
 * Tiện ích tính toán địa lý và kiểm tra chồng lấn khu vực (zone) / geofence.
 */
public final class GeoUtils {

    /**
     * Bán kính trung bình của Trái Đất (WGS-84, tính theo mét).
     */
    public static final double EARTH_RADIUS_METERS = 6371000.0;

    private GeoUtils() {}

    /**
     * Tính khoảng cách đường tròn lớn theo công thức Haversine giữa 2 tọa độ (đơn vị: mét).
     */
    public static double haversineMeters(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            throw new IllegalArgumentException("Coordinates must not be null");
        }
        return haversineMeters(lat1.doubleValue(), lng1.doubleValue(), lat2.doubleValue(), lng2.doubleValue());
    }

    /**
     * Tính khoảng cách Haversine theo kiểu double (đơn vị: mét).
     */
    public static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLng / 2.0) * Math.sin(dLng / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Kiểm tra 2 khu vực hình tròn có bị chồng lấn hay không:
     * Chồng lấn nếu khoảng cách giữa 2 tâm < (bán kính 1 + bán kính 2).
     */
    public static boolean doZonesOverlap(BigDecimal lat1, BigDecimal lng1, int radius1Meters,
                                         BigDecimal lat2, BigDecimal lng2, int radius2Meters) {
        double distance = haversineMeters(lat1, lng1, lat2, lng2);
        return distance < (radius1Meters + radius2Meters);
    }
}
