package com.echora.location.service;

import com.echora.location.client.ResilientContentServiceClient;
import com.echora.location.dto.NearbyPoiDto;
import com.echora.location.dto.NearbyPoisResponse;
import com.echora.location.dto.PoiBoundingBoxDto;
import com.echora.location.dto.PoiInternalQrDto;
import com.echora.location.dto.ResolvePoiResponse;
import com.echora.location.util.GeoUtils;
import feign.FeignException;
import feign.RetryableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class LocationServiceImpl implements LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationServiceImpl.class);

    private final ResilientContentServiceClient contentServiceClient;
    private final double maxRadiusMeters;

    public LocationServiceImpl(
            ResilientContentServiceClient contentServiceClient,
            @Value("${location.max-radius-meters:5000}") double maxRadiusMeters
    ) {
        this.contentServiceClient = contentServiceClient;
        this.maxRadiusMeters = maxRadiusMeters;
    }

    @Override
    public NearbyPoisResponse getNearbyPois(double lat, double lng, double radius) {
        validateCoordinates(lat, lng);
        validateRadius(radius);

        GeoUtils.BoundingBox bbox = GeoUtils.calculateBoundingBox(lat, lng, radius);
        List<PoiBoundingBoxDto> candidates;
        try {
            candidates = contentServiceClient.getPoisInBoundingBox(
                    null,
                    bbox.minLat(),
                    bbox.maxLat(),
                    bbox.minLng(),
                    bbox.maxLng()
            );
        } catch (RuntimeException ex) {
            if (!isDependencyFailure(ex)) {
                throw ex;
            }
            log.warn("content-service unavailable while loading nearby POIs; returning degraded response: {}",
                    ex.getMessage());
            return NearbyPoisResponse.degraded();
        }

        if (candidates == null || candidates.isEmpty()) {
            return NearbyPoisResponse.ok(List.of());
        }

        List<NearbyPoiDto> result = new ArrayList<>();
        for (PoiBoundingBoxDto poi : candidates) {
            if (poi.getLatitude() == null || poi.getLongitude() == null) {
                continue;
            }
            double dist = GeoUtils.haversineDistanceMeters(
                    lat, lng,
                    poi.getLatitude().doubleValue(),
                    poi.getLongitude().doubleValue()
            );

            if (dist <= radius) {
                result.add(NearbyPoiDto.builder()
                        .poiId(poi.getPoiId())
                        .poiCode(poi.getPoiCode())
                        .name(poi.getName())
                        .zoneId(poi.getZoneId())
                        .latitude(poi.getLatitude())
                        .longitude(poi.getLongitude())
                        .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                        .distanceMeters(roundDistance(dist))
                        .build());
            }
        }

        result.sort(Comparator.comparingDouble(NearbyPoiDto::getDistanceMeters));
        return NearbyPoisResponse.ok(result);
    }

    @Override
    public ResolvePoiResponse resolvePoi(double lat, double lng) {
        validateCoordinates(lat, lng);

        // Pre-filter with a search radius around the user (up to maxRadiusMeters, default 1000m)
        double searchRadius = Math.min(maxRadiusMeters, 1000.0);
        GeoUtils.BoundingBox bbox = GeoUtils.calculateBoundingBox(lat, lng, searchRadius);

        List<PoiBoundingBoxDto> candidates = contentServiceClient.getPoisInBoundingBox(
                null,
                bbox.minLat(),
                bbox.maxLat(),
                bbox.minLng(),
                bbox.maxLng()
        );

        if (candidates == null || candidates.isEmpty()) {
            return ResolvePoiResponse.notMatched();
        }

        NearbyPoiDto closestMatch = null;
        double minDistance = Double.MAX_VALUE;

        for (PoiBoundingBoxDto poi : candidates) {
            if (poi.getLatitude() == null || poi.getLongitude() == null) {
                continue;
            }
            double dist = GeoUtils.haversineDistanceMeters(
                    lat, lng,
                    poi.getLatitude().doubleValue(),
                    poi.getLongitude().doubleValue()
            );

            int triggerRadius = poi.getTriggerRadiusMeters() != null ? poi.getTriggerRadiusMeters() : 50;
            if (dist <= triggerRadius) {
                if (dist < minDistance) {
                    minDistance = dist;
                    closestMatch = NearbyPoiDto.builder()
                            .poiId(poi.getPoiId())
                            .poiCode(poi.getPoiCode())
                            .name(poi.getName())
                            .zoneId(poi.getZoneId())
                            .latitude(poi.getLatitude())
                            .longitude(poi.getLongitude())
                            .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                            .distanceMeters(roundDistance(dist))
                            .build();
                }
            }
        }

        if (closestMatch == null) {
            return ResolvePoiResponse.notMatched();
        }

        return ResolvePoiResponse.matched(closestMatch);
    }

    @Override
    public PoiInternalQrDto resolveByQr(String qrToken) {
        if (qrToken == null || qrToken.trim().isEmpty()) {
            throw new IllegalArgumentException("QR token must not be blank");
        }
        return contentServiceClient.getPoiByQrToken(qrToken);
    }

    private boolean isDependencyFailure(Throwable ex) {
        if (ex instanceof CallNotPermittedException || ex instanceof RetryableException) {
            return true;
        }
        if (ex instanceof FeignException feignException) {
            // 4xx are caller/validation errors and must keep their existing status mapping.
            return feignException.status() < 400 || feignException.status() >= 500;
        }
        return false;
    }

    private void validateCoordinates(double lat, double lng) {
        if (lat < -90.0 || lat > 90.0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90 degrees. Provided: " + lat);
        }
        if (lng < -180.0 || lng > 180.0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180 degrees. Provided: " + lng);
        }
    }

    private void validateRadius(double radius) {
        if (radius <= 0) {
            throw new IllegalArgumentException("Radius must be greater than 0 meters. Provided: " + radius);
        }
        if (radius > maxRadiusMeters) {
            throw new IllegalArgumentException("Radius exceeds maximum allowed limit of " + maxRadiusMeters + " meters. Provided: " + radius);
        }
    }

    private double roundDistance(double distance) {
        return BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
