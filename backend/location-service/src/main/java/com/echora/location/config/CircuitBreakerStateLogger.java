package com.echora.location.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

/**
 * Emits a WARN log for every circuit breaker state transition, including the instance name and
 * the current trace id (when the transition happens on a request thread).
 */
@Component
public class CircuitBreakerStateLogger {

    private static final Logger log = LoggerFactory.getLogger(CircuitBreakerStateLogger.class);

    public CircuitBreakerStateLogger(CircuitBreakerRegistry registry) {
        registry.getAllCircuitBreakers().forEach(this::register);
        registry.getEventPublisher().onEntryAdded(event -> register(event.getAddedEntry()));
    }

    private void register(CircuitBreaker circuitBreaker) {
        circuitBreaker.getEventPublisher().onStateTransition(event -> log.warn(
                "CircuitBreaker '{}' state transition: {} -> {} traceId={}",
                circuitBreaker.getName(),
                event.getStateTransition().getFromState(),
                event.getStateTransition().getToState(),
                currentTraceId()));
    }

    private String currentTraceId() {
        String traceId = MDC.get(TraceIdFilter.MDC_TRACE_ID);
        return traceId == null || traceId.isBlank() ? "n/a" : traceId;
    }
}
