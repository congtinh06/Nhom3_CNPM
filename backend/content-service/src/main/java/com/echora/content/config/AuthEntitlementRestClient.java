package com.echora.content.config;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Thin adapter around the auth-service entitlement endpoints.
 *
 * <p>Resilience4j lives here so the filter and service code only deal with domain results.
 * Both endpoints are idempotent GETs, so retry is safe.</p>
 */
@Component
public class AuthEntitlementRestClient {

    private final RestClient restClient;
    private final String internalApiKey;

    @Autowired
    public AuthEntitlementRestClient(
            @Value("${app.auth-service.url:${AUTH_SERVICE_URL:http://localhost:8086}}") String baseUrl,
            @Value("${internal.api-key:}") String internalApiKey,
            @Value("${app.auth-service.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${app.auth-service.read-timeout-ms:3000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeoutMs);
        requestFactory.setReadTimeout(readTimeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.internalApiKey = internalApiKey;
    }

    /**
     * Constructor for tests with a preconfigured RestClient / MockRestServiceServer.
     */
    AuthEntitlementRestClient(RestClient restClient, String internalApiKey) {
        this.restClient = restClient;
        this.internalApiKey = internalApiKey;
    }

    @CircuitBreaker(name = "contentAuthEntitlement")
    @Retry(name = "contentAuthEntitlement")
    public PurchasedPoi[] fetchPurchasedPois(Long userId) {
        return restClient.get()
                .uri("/api/auth/internal/entitlements/{userId}/pois", userId)
                .header(EntitlementFilter.HEADER_INTERNAL_API_KEY, internalApiKey)
                .retrieve()
                .body(PurchasedPoi[].class);
    }

    @CircuitBreaker(name = "contentAuthEntitlement")
    @Retry(name = "contentAuthEntitlement")
    public EntitlementSnapshot fetchSnapshot(Long userId, Long poiId) {
        return restClient.get()
                .uri("/api/auth/internal/entitlements/{userId}/pois/{poiId}", userId, poiId)
                .header(EntitlementFilter.HEADER_INTERNAL_API_KEY, internalApiKey)
                .retrieve()
                .body(EntitlementSnapshot.class);
    }

    public static class PurchasedPoi {
        public Long poiId;
        public String expiresAt;
    }

    public static class EntitlementSnapshot {
        public Long userId;
        public String plan;
        public boolean premiumActive;
        public String premiumExpiresAt;
    }
}
