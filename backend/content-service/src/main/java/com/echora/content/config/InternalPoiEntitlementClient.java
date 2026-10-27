package com.echora.content.config;

import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Gọi nội bộ auth-service để kiểm tra quyền Premium mua lẻ theo POI:
 * - danh sách POI user đã mua (cache 60 giây trong bộ nhớ),
 * - kiểm tra 1 POI cụ thể.
 */
@Component
@Slf4j
public class InternalPoiEntitlementClient {

    private static final long CACHE_TTL_SECONDS = 60;

    private final RestClient restClient;
    private final String internalApiKey;
    private final Map<Long, CachedPois> purchasedCache = new ConcurrentHashMap<>();

    InternalPoiEntitlementClient(@Value("${app.auth-service.url:${AUTH_SERVICE_URL:http://localhost:8086}}") String baseUrl,
                                 @Value("${internal.api-key:}") String internalApiKey) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.internalApiKey = internalApiKey;
    }

    List<Long> purchasedPoiIds(Long userId) {
        if (internalApiKey == null || internalApiKey.isBlank() || userId == null) {
            return List.of();
        }
        CachedPois cached = purchasedCache.get(userId);
        Instant now = Instant.now();
        if (cached != null && now.isBefore(cached.expiresAt)) {
            return cached.poiIds;
        }

        try {
            PurchasedPoi[] fetched = restClient.get()
                    .uri("/api/auth/internal/entitlements/{userId}/pois", userId)
                    .header(EntitlementFilter.HEADER_INTERNAL_API_KEY, internalApiKey)
                    .retrieve()
                    .body(PurchasedPoi[].class);
            List<Long> ids = new java.util.ArrayList<>();
            if (fetched != null) {
                for (PurchasedPoi poi : fetched) {
                    if (poi != null && poi.poiId != null) {
                        ids.add(poi.poiId);
                    }
                }
            }
            List<Long> result = List.copyOf(ids);
            purchasedCache.put(userId, new CachedPois(result, now.plusSeconds(CACHE_TTL_SECONDS)));
            return result;
        } catch (Exception ex) {
            log.warn("Không thể kiểm tra danh sách POI đã mua (userId={}): {}", userId, ex.getMessage());
            return List.of();
        }
    }

    boolean hasPurchasedPoi(Long userId, Long poiId) {
        if (userId == null || poiId == null) {
            return false;
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            return false;
        }
        try {
            EntitlementSnapshot snapshot = restClient.get()
                    .uri("/api/auth/internal/entitlements/{userId}/pois/{poiId}", userId, poiId)
                    .header(EntitlementFilter.HEADER_INTERNAL_API_KEY, internalApiKey)
                    .retrieve()
                    .body(EntitlementSnapshot.class);
            return snapshot != null && snapshot.premiumActive;
        } catch (Exception ex) {
            log.warn("Không thể kiểm tra quyền POI (userId={}, poiId={}): {}", userId, poiId, ex.getMessage());
            return false;
        }
    }

    private record CachedPois(List<Long> poiIds, Instant expiresAt) {
    }

    private static class PurchasedPoi {
        public Long poiId;
        public String expiresAt;
    }

    private static class EntitlementSnapshot {
        public Long userId;
        public String plan;
        public boolean premiumActive;
        public String premiumExpiresAt;
    }
}
