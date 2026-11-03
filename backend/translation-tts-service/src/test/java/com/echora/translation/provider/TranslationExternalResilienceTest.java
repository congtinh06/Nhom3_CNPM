package com.echora.translation.provider;

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
 * Exercises the same named resilience4j instances used by the MyMemory adapter and the edge-tts
 * runner. MyMemory GETs are retried; edge-tts is breaker-only because the pipeline already
 * retries TTS with backoff.
 */
@SpringJUnitConfig
@EnableAspectJAutoProxy
@Import({
        CircuitBreakerAutoConfiguration.class,
        RetryAutoConfiguration.class,
        TranslationExternalResilienceTest.TestConfig.class
})
@TestPropertySource(properties = {
        "resilience4j.circuitbreaker.instances.translationMyMemory.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.translationMyMemory.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.translationMyMemory.slow-call-duration-threshold=50ms",
        "resilience4j.circuitbreaker.instances.translationMyMemory.wait-duration-in-open-state=1s",
        "resilience4j.circuitbreaker.instances.translationMyMemory.ignore-exceptions[0]=org.springframework.web.client.HttpClientErrorException",
        "resilience4j.retry.instances.translationMyMemory.max-attempts=2",
        "resilience4j.retry.instances.translationMyMemory.wait-duration=10ms",
        "resilience4j.retry.instances.translationMyMemory.retry-exceptions[0]=java.io.IOException",
        "resilience4j.retry.instances.translationMyMemory.retry-exceptions[1]=java.util.concurrent.TimeoutException",
        "resilience4j.retry.instances.translationMyMemory.retry-exceptions[2]=org.springframework.web.client.ResourceAccessException",
        "resilience4j.retry.instances.translationMyMemory.retry-exceptions[3]=org.springframework.web.client.HttpServerErrorException",
        "resilience4j.circuitbreaker.instances.translationEdgeTts.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.translationEdgeTts.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.translationEdgeTts.wait-duration-in-open-state=1s",
        "resilience4j.circuitbreaker.instances.translationEdgeTts.ignore-exceptions[0]=java.lang.IllegalArgumentException"
})
class TranslationExternalResilienceTest {

    private static final String MYMEMORY_INSTANCE = "translationMyMemory";
    private static final String EDGE_TTS_INSTANCE = "translationEdgeTts";

    @Configuration
    static class TestConfig {
        @Component
        static class MyMemoryProbe {
            @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = MYMEMORY_INSTANCE)
            @Retry(name = MYMEMORY_INSTANCE)
            public String call(Supplier<String> supplier) {
                return supplier.get();
            }
        }

        @Component
        static class EdgeTtsProbe {
            @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = EDGE_TTS_INSTANCE)
            public String call(Supplier<String> supplier) {
                return supplier.get();
            }
        }
    }

    @Autowired
    private TestConfig.MyMemoryProbe myMemoryProbe;

    @Autowired
    private TestConfig.EdgeTtsProbe edgeTtsProbe;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @BeforeEach
    void setUp() {
        circuitBreakerRegistry.circuitBreaker(MYMEMORY_INSTANCE).reset();
        circuitBreakerRegistry.circuitBreaker(EDGE_TTS_INSTANCE).reset();
    }

    @Test
    @DisplayName("MyMemory slow call is measured without opening the circuit")
    void myMemorySlowCallIsRecorded() {
        myMemoryProbe.call(() -> {
            try {
                Thread.sleep(120);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "ok";
        });

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(MYMEMORY_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfSlowCalls()).isEqualTo(1);
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("MyMemory 5xx is retried then opens the circuit")
    void myMemoryServerErrorOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> myMemoryProbe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpServerErrorException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE);
        })).isInstanceOf(HttpServerErrorException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(MYMEMORY_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> myMemoryProbe.call(() -> "never"))
                .isInstanceOf(CallNotPermittedException.class);
    }

    @Test
    @DisplayName("MyMemory dead upstream is retried then opens the circuit")
    void myMemoryDeadUpstreamOpensCircuitAfterRetries() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> myMemoryProbe.call(() -> {
            attempts.incrementAndGet();
            throw new ResourceAccessException("dead", new IOException("connection refused"));
        })).isInstanceOf(ResourceAccessException.class);

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(MYMEMORY_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    @DisplayName("MyMemory 4xx is ignored and not retried")
    void myMemoryClientErrorDoesNotOpenCircuit() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> myMemoryProbe.call(() -> {
            attempts.incrementAndGet();
            throw new HttpClientErrorException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS);
        })).isInstanceOf(HttpClientErrorException.class);

        assertThat(attempts).hasValue(1);
        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(MYMEMORY_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("edge-tts failure is not retried here and still opens the circuit")
    void edgeTtsFailureIsNotRetried() {
        AtomicInteger attempts = new AtomicInteger();
        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(() -> edgeTtsProbe.call(() -> {
                attempts.incrementAndGet();
                throw new IllegalStateException("edge-tts failed");
            })).isInstanceOf(IllegalStateException.class);
        }

        assertThat(attempts).hasValue(2);
        assertThat(circuitBreakerRegistry.circuitBreaker(EDGE_TTS_INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> edgeTtsProbe.call(() -> "never"))
                .isInstanceOf(CallNotPermittedException.class);
    }

    @Test
    @DisplayName("edge-tts bad input is ignored and never opens the circuit")
    void edgeTtsBadInputDoesNotOpenCircuit() {
        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> edgeTtsProbe.call(() -> {
                throw new IllegalArgumentException("Text to synthesize cannot be null or empty");
            })).isInstanceOf(IllegalArgumentException.class);
        }

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(EDGE_TTS_INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
