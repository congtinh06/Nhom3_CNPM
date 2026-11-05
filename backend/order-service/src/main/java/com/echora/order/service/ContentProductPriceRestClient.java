package com.echora.order.service;

import com.echora.order.dto.ProductPrice;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Adapter around the content-service batch price endpoint.
 *
 * <p>This call is a POST and is not idempotent, so it intentionally has a circuit breaker but
 * no retry: a retried POST could duplicate work or side effects.</p>
 */
@Component
public class ContentProductPriceRestClient {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private final RestClient restClient;
    private final String internalApiKey;

    public ContentProductPriceRestClient(
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

    @CircuitBreaker(name = "orderContentProductPrice")
    public List<ProductPrice> fetchPrices(Collection<Long> productIds) {
        return restClient.post()
                .uri("/api/content/internal/products/prices")
                .header(HEADER_INTERNAL_API_KEY, internalApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("productIds", productIds))
                .retrieve()
                .body(new ParameterizedTypeReference<List<ProductPrice>>() {
                });
    }
}
