package com.echora.content.config;

import com.echora.content.exception.EntitlementServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Gọi nội bộ auth-service để kiểm tra quyền Premium mua lẻ theo POI:
 * - danh sách POI user đã mua (cache 60 giây trong bộ nhớ),
 * - kiểm tra 1 POI cụ thể.
 *
 * <p>Failures are never cached and are rethrown as
 * {@link EntitlementServiceUnavailableException}; the filter turns that into a 503 so an
 * auth-service outage can never be interpreted as "no purchase" and accidentally grant access.</p>
 */
@Component
@Slf4j
public class InternalPoiEntitlementClient {

    private static final long CACHE_TTL_SECONDS = 60;

    private final AuthEntitlementRestClient authClient;
    private final String internalApiKey;
    private final Map<Long, CachedPois> purchasedCache = new ConcurrentHashMap<>();

    public InternalPoiEntitlementClient(
            AuthEntitlementRestClient authClient,
            @Value("${internal.api-key:}") String internalApiKey) {
        this.authClient = authClient;
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
            AuthEntitlementRestClient.PurchasedPoi[] fetched = authClient.fetchPurchasedPois(userId);
            List<Long> ids = new ArrayList<>();
            if (fetched != null) {
                for (AuthEntitlementRestClient.PurchasedPoi poi : fetched) {
                    if (poi != null && poi.poiId != null) {
                        ids.add(poi.poiId);
                    }
                }
            }
            List<Long> result = List.copyOf(ids);
            // Only successful responses are cached. An outage must not become a cached "empty".
            purchasedCache.put(userId, new CachedPois(result, now.plusSeconds(CACHE_TTL_SECONDS)));
            return result;
        } catch (RuntimeException ex) {
            log.warn("Không thể kiểm tra danh sách POI đã mua (userId={}): {}", userId, ex.getMessage());
            throw new EntitlementServiceUnavailableException(
                    "Không thể xác minh quyền sở hữu POI lúc này.", ex);
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
            AuthEntitlementRestClient.EntitlementSnapshot snapshot =
                    authClient.fetchSnapshot(userId, poiId);
            return snapshot != null && snapshot.premiumActive;
        } catch (RuntimeException ex) {
            log.warn("Không thể kiểm tra quyền POI (userId={}, poiId={}): {}", userId, poiId, ex.getMessage());
            throw new EntitlementServiceUnavailableException(
                    "Không thể xác minh quyền sở hữu POI lúc này.", ex);
        }
    }

    private record CachedPois(List<Long> poiIds, Instant expiresAt) {
    }
}
