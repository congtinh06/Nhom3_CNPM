package com.echora.content.config;

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
 * Exercises the same named resilience4j instance used by {@link AuthEntitlementRestClient}.
 * The probe method mirrors the adapter's annotation pair (Retry outside CircuitBreaker).
 */
@SpringJUnitConfig
@EnableAspectJAutoProxy
@Import({
        CircuitBreakerAutoConfiguration.class,
        RetryAutoConfiguration.class,
        ContentAuthEntitlementResilienceTest.TestConfig.class
})
@TestPropertySource(properties = {
        "resilience4j.circuitbreaker.instances.contentAuthEntitlement.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.contentAuthEntitlement.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.contentAuthEntitlement.slow-call-duration-threshold=50ms",
        "resilience4j.circuitbreaker.instances.contentAuthEntitlement.wait-duration-in-open-state=1s",
        "resilience4j.circuitbreaker.instances.contentAuthEntitlement.ignore-exceptions[0]=org.springframework.web.client.HttpClientErrorException",
        "resilience4j.retry.instances.contentAuthEntitlement.max-attempts=2",
        "resilience4j.retry.instances.contentAuthEntitlement.wait-duration=10ms",
        "resilience4j.retry.instances.contentAuthEntitlement.retry-exceptions[0]=java.io.IOException",
        "resilience4j.retry.instances.contentAuthEntitlement.retry-exceptions[1]=java.util.concurrent.TimeoutException",
        "resilience4j.retry.instances.contentAuthEntitlement.retry-exceptions[2]=org.springframework.web.client.ResourceAccessException",
        "resilience4j.retry.instances.contentAuthEntitlement.retry-exceptions[3]=org.springframework.web.client.HttpServerErrorException"
})
class ContentAuthEntitlementResilienceTest {

    private static final String INSTANCE = "contentAuthEntitlement";

    @Configuration
    static class TestConfig {
        @Component
        static class Probe {
            @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = INSTANCE)
            @Retry(name = INSTANCE)
            public String call(Supplier<String> supplier) {
                return supplier.get();
            }
        }
    }

    @Autowired
    private TestConfig.Probe probe;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @BeforeEach
    void setUp() {
        circuitBreakerRegistry.circuitBreaker(INSTANCE).reset();
    }

    @Test
    @DisplayName("slow call is measured without opening the circuit")
    void slowCallIsRecorded() {
        probe.call(() -> {
            try {
                Thread.sleep(120);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "ok";
        });

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfSlowCalls()).isEqualTo(1);
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("5xx is retried then opens the circuit")
    void serverErrorOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> probe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpServerErrorException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        })).isInstanceOf(HttpServerErrorException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);

        assertThatThrownBy(() -> probe.call(() -> "never"))
                .isInstanceOf(CallNotPermittedException.class);
    }

    @Test
    @DisplayName("dead upstream is retried then opens the circuit")
    void deadUpstreamOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> probe.call(() -> {
            attempts.incrementAndGet();
            throw new ResourceAccessException("dead", new IOException("connection refused"));
        })).isInstanceOf(ResourceAccessException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    @DisplayName("4xx is ignored by the circuit breaker and is not retried")
    void clientErrorDoesNotOpenCircuit() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> probe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpClientErrorException(org.springframework.http.HttpStatus.BAD_REQUEST);
        })).isInstanceOf(HttpClientErrorException.class);

        assertThat(attempts).hasValue(1);
        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
