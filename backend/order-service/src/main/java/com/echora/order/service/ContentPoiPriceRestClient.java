package com.echora.order.service;

import com.echora.order.dto.PoiPremiumPrice;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Adapter around the content-service POI price endpoint.
 *
 * <p>Resilience4j lives here instead of in the controller or the domain client. This is an
 * idempotent GET, so retry is safe. Retry stays outside the circuit breaker (default aspect
 * order), which records every physical attempt.</p>
 */
@Component
public class ContentPoiPriceRestClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;

    public ContentPoiPriceRestClient(
            @Value("${app.content-service.url:http://localhost:8085}") String baseUrl,
            @Value("${internal.api-key:}") String internalApiKey,
            @Value("${app.content-service.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${app.content-service.read-timeout-ms:3000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeoutMs);
        requestFactory.setReadTimeout(readTimeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.internalApiKey = internalApiKey;
    }

    @CircuitBreaker(name = "orderContentPoiPrice")
    @Retry(name = "orderContentPoiPrice")
    public PoiPremiumPrice fetchPoiPrice(Long poiId) {
        return restClient.get()
                .uri("/api/content/internal/pois/{id}/premium-price", poiId)
                .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                .retrieve()
                .body(PoiPremiumPrice.class);
    }
}
