package com.echora.location.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class GeoUtils {

    public static final double EARTH_RADIUS_METERS = 6371000.0;
    private static final double METERS_PER_DEGREE_LAT = 111320.0;

    private GeoUtils() {
    }

    public record BoundingBox(
            BigDecimal minLat,
            BigDecimal maxLat,
            BigDecimal minLng,
            BigDecimal maxLng
    ) {}

    /**
     * Calculates the bounding box for pre-filtering:
     * dLat = r / 111320
     * dLng = r / (111320 * cos(lat))
     */
    public static BoundingBox calculateBoundingBox(double lat, double lng, double radiusMeters) {
        double dLat = radiusMeters / METERS_PER_DEGREE_LAT;
        double cosLat = Math.cos(Math.toRadians(lat));
        double dLng = (Math.abs(cosLat) < 1e-9)
                ? 180.0
                : radiusMeters / (METERS_PER_DEGREE_LAT * Math.abs(cosLat));

        double minLatVal = Math.max(-90.0, lat - dLat);
        double maxLatVal = Math.min(90.0, lat + dLat);
        double minLngVal = Math.max(-180.0, lng - dLng);
        double maxLngVal = Math.min(180.0, lng + dLng);

        return new BoundingBox(
                BigDecimal.valueOf(minLatVal).setScale(7, RoundingMode.HALF_UP),
                BigDecimal.valueOf(maxLatVal).setScale(7, RoundingMode.HALF_UP),
                BigDecimal.valueOf(minLngVal).setScale(7, RoundingMode.HALF_UP),
                BigDecimal.valueOf(maxLngVal).setScale(7, RoundingMode.HALF_UP)
        );
    }

    /**
     * Calculates distance between two points on Earth using Haversine formula with R = 6371000 m.
     */
    public static double haversineDistanceMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(rLat1) * Math.cos(rLat2)
                * Math.sin(dLng / 2.0) * Math.sin(dLng / 2.0);
        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
