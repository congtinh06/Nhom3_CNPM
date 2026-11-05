package com.echora.location.client;

import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import feign.RetryableException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies the resilience4j annotations on the adapter with a real Spring AOP proxy.
 */
@SpringBootTest(properties = {
        "resilience4j.circuitbreaker.instances.locationContentService.minimum-number-of-calls=2",
        "resilience4j.circuitbreaker.instances.locationContentService.sliding-window-size=2",
        "resilience4j.circuitbreaker.instances.locationContentService.slow-call-duration-threshold=50ms",
        "resilience4j.circuitbreaker.instances.locationContentService.wait-duration-in-open-state=1s",
        // Tắt auto-transition trong test để trạng thái OPEN quan sát được một cách xác định
        // (nếu bật, chỉ cần chậm >1s là breaker đã chuyển HALF_OPEN và assert sẽ flaky).
        "resilience4j.circuitbreaker.instances.locationContentService.automatic-transition-from-open-to-half-open-enabled=false",
        "resilience4j.retry.instances.locationContentService.max-attempts=2",
        "resilience4j.retry.instances.locationContentService.wait-duration=10ms"
})
class ResilientContentServiceClientResilienceTest {

    private static final String INSTANCE = "locationContentService";

    @Autowired
    private ResilientContentServiceClient adapter;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @MockBean
    private ContentServiceClient delegate;

    @BeforeEach
    void setUp() {
        reset(delegate);
        circuitBreakerRegistry.circuitBreaker(INSTANCE).reset();
    }

    @Test
    @DisplayName("slow call is recorded as a slow call and does not open the circuit")
    void slowCallIsRecorded() {
        when(delegate.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    Thread.sleep(120);
                    return List.of();
                });

        adapter.getPoisInBoundingBox(null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE);

        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfSlowCalls()).isEqualTo(1);
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    @DisplayName("5xx is retried, then opens the circuit and short-circuits later calls")
    void serverErrorIsRetriedAndOpensCircuit() {
        when(delegate.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new FeignException.ServiceUnavailable("down", request(), null, null));

        assertThatThrownBy(() ->
                adapter.getPoisInBoundingBox(null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE))
                .isInstanceOf(FeignException.class);

        verify(delegate, times(2)).getPoisInBoundingBox(any(), any(), any(), any(), any());
        assertThat(circuitBreakerRegistry.circuitBreaker(INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);

        assertThatThrownBy(() ->
                adapter.getPoisInBoundingBox(null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE))
                .isInstanceOf(CallNotPermittedException.class);
        verify(delegate, times(2)).getPoisInBoundingBox(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("connection failure (dead upstream) is retried and opens the circuit")
    void deadUpstreamIsRetriedAndOpensCircuit() {
        when(delegate.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new RetryableException(
                        503, "Connection refused", Request.HttpMethod.GET, new Date(), request()));

        assertThatThrownBy(() ->
                adapter.getPoisInBoundingBox(null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE))
                .isInstanceOf(RetryableException.class);

        verify(delegate, times(2)).getPoisInBoundingBox(any(), any(), any(), any(), any());
        assertThat(circuitBreakerRegistry.circuitBreaker(INSTANCE).getState())
                .isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    @DisplayName("4xx is not retried and is ignored by the circuit breaker")
    void clientErrorDoesNotRetryOrOpenCircuit() {
        when(delegate.getPoisInBoundingBox(any(), any(), any(), any(), any()))
                .thenThrow(new FeignException.BadRequest("bad request", request(), null, null));

        assertThatThrownBy(() ->
                adapter.getPoisInBoundingBox(null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE))
                .isInstanceOf(FeignException.BadRequest.class);

        verify(delegate, times(1)).getPoisInBoundingBox(any(), any(), any(), any(), any());
        CircuitBreaker breaker = circuitBreakerRegistry.circuitBreaker(INSTANCE);
        assertThat(breaker.getMetrics().getNumberOfFailedCalls()).isZero();
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    private Request request() {
        return Request.create(
                Request.HttpMethod.GET,
                "http://localhost:8085/api/content/internal/pois/bounding-box",
                Collections.emptyMap(),
                null,
                StandardCharsets.UTF_8,
                new RequestTemplate());
    }
}
