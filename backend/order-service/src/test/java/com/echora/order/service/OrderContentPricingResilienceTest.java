package com.echora.order.service;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.springboot3.circuitbreaker.autoconfigure.CircuitBreakerAutoConfiguration;
import io.github.resilience4j.springboot3.retry.autoconfigure.RetryAutoConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises the same named resilience4j instances used by the order price adapters.
 * POI price is a GET with Retry outside CircuitBreaker; product price is a POST with a breaker
 * only, because a retried POST is not safe.
 */
@SpringJUnitConfig
@EnableAspectJAutoProxy
@Import({
        CircuitBreakerAutoConfiguration.class,
        RetryAutoConfiguration.class,
        OrderContentPricingResilienceTest.TestConfig.class
})
@TestPropertySource(properties = {
        "resilience4j.circuitbreaker.instances.orderContentPoiPrice.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.orderContentPoiPrice.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.orderContentPoiPrice.slow-call-duration-threshold=50ms",
        "resilience4j.circuitbreaker.instances.orderContentPoiPrice.wait-duration-in-open-state=1s",
        "resilience4j.circuitbreaker.instances.orderContentPoiPrice.ignore-exceptions[0]=org.springframework.web.client.HttpClientErrorException",
        "resilience4j.retry.instances.orderContentPoiPrice.max-attempts=2",
        "resilience4j.retry.instances.orderContentPoiPrice.wait-duration=10ms",
        "resilience4j.retry.instances.orderContentPoiPrice.retry-exceptions[0]=java.io.IOException",
        "resilience4j.retry.instances.orderContentPoiPrice.retry-exceptions[1]=java.util.concurrent.TimeoutException",
        "resilience4j.retry.instances.orderContentPoiPrice.retry-exceptions[2]=org.springframework.web.client.ResourceAccessException",
        "resilience4j.retry.instances.orderContentPoiPrice.retry-exceptions[3]=org.springframework.web.client.HttpServerErrorException",
        "resilience4j.circuitbreaker.instances.orderContentProductPrice.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.orderContentProductPrice.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.orderContentProductPrice.wait-duration-in-open-state=1s",
        "resilience4j.circuitbreaker.instances.orderContentProductPrice.ignore-exceptions[0]=org.springframework.web.client.HttpClientErrorException"
})
class OrderContentPricingResilienceTest {

    private static final String POI_INSTANCE = "orderContentPoiPrice";
    private static final String PRODUCT_INSTANCE = "orderContentProductPrice";

    @Configuration
    static class TestConfig {
        @Component
        static class PoiProbe {
            @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = POI_INSTANCE)
            @Retry(name = POI_INSTANCE)
            public String call(Supplier<String> supplier) {
                return supplier.get();
            }
        }

        @Component
        static class ProductProbe {
            @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = PRODUCT_INSTANCE)
            public String call(Supplier<String> supplier) {
                return supplier.get();
            }
        }
    }

    @Autowired
    private TestConfig.PoiProbe poiProbe;

    @Autowired
    private TestConfig.ProductProbe productProbe;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @BeforeEach
    void setUp() {
        circuitBreakerRegistry.circuitBreaker(POI_INSTANCE).reset();
        circuitBreakerRegistry.circuitBreaker(PRODUCT_INSTANCE).reset();
    }

    @Test
    @DisplayName("POI slow call is measured without opening the circuit")
    void poiSlowCallIsRecorded() {
        poiProbe.call(() -> {
            try {
                Thread.sleep(120);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "ok";
        });

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(POI_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfSlowCalls()).isEqualTo(1);
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("POI 5xx is retried then opens the circuit")
    void poiServerErrorOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> poiProbe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpServerErrorException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        })).isInstanceOf(HttpServerErrorException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(POI_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> poiProbe.call(() -> "never"))
                .isInstanceOf(CallNotPermittedException.class);
    }

    @Test
    @DisplayName("POI dead upstream is retried then opens the circuit")
    void poiDeadUpstreamOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> poiProbe.call(() -> {
            attempts.incrementAndGet();
            throw new ResourceAccessException("dead", new IOException("connection refused"));
        })).isInstanceOf(ResourceAccessException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(POI_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    @DisplayName("POI 4xx is ignored and not retried")
    void poiClientErrorDoesNotOpenCircuit() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> poiProbe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpClientErrorException(org.springframework.http.HttpStatus.NOT_FOUND);
        })).isInstanceOf(HttpClientErrorException.class);

        assertThat(attempts).hasValue(1);
        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(POI_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("product POST 5xx is not retried and still opens the circuit")
    void productServerErrorIsNotRetried() {
        AtomicInteger attempts = new AtomicInteger();
        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(() -> productProbe.call(() -> {
                attempts.incrementAndGet();
                throw new HttpServerErrorException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
            })).isInstanceOf(HttpServerErrorException.class);
        }

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(PRODUCT_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> productProbe.call(() -> "never"))
                .isInstanceOf(CallNotPermittedException.class);
    }

    @Test
    @DisplayName("product POST 4xx is ignored and never opens the circuit")
    void productClientErrorDoesNotOpenCircuit() {
        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> productProbe.call(() -> {
                throw new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST);
            })).isInstanceOf(HttpClientErrorException.class);
        }

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(PRODUCT_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
