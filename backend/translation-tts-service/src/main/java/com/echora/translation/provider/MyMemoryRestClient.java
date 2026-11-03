package com.echora.translation.provider;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;

/**
 * Adapter around the MyMemory HTTP API.
 *
 * <p>All MyMemory calls are idempotent GETs, so retry is safe. Resilience4j lives here rather
 * than in the provider so the provider can keep translating raw HTTP failures into its domain
 * exceptions. Retry stays outside the circuit breaker (default aspect order).</p>
 */
@Component
@ConditionalOnProperty(name = "app.translation.provider", havingValue = MyMemoryTranslationProvider.PROVIDER_NAME)
public class MyMemoryRestClient {

    private final RestClient restClient;

    @Autowired
    public MyMemoryRestClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.translation.mymemory.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.translation.mymemory.read-timeout-ms:10000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
    }

    /**
     * Constructor for unit tests with a preconfigured RestClient / MockRestServiceServer.
     */
    MyMemoryRestClient(RestClient restClient) {
        this.restClient = restClient;
    }

    @CircuitBreaker(name = "translationMyMemory")
    @Retry(name = "translationMyMemory")
    public String fetch(URI uri) {
        return restClient.get()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(String.class);
    }
}
