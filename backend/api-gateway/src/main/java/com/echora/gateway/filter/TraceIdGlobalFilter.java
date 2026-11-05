package com.echora.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Resolves the trace id as early as possible, echoes it in the response
 * header and forwards it downstream in X-Trace-Id.
 *
 * <p>Spring Cloud Gateway is reactive, so MDC is only set for the duration of
 * this filter (the thread may be reused by another request afterwards). This
 * one log line is enough to correlate the gateway hop; downstream services get
 * the same value through the X-Trace-Id request header, which their servlet
 * TraceIdFilter copies into MDC.
 */
@Component
public class TraceIdGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(TraceIdGlobalFilter.class);

    public static final String TRACE_ID_HEADER = "X-Trace-Id";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String MDC_TRACE_ID = "traceId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String traceId = exchange.getRequest().getHeaders().getFirst(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);
        }
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        } else {
            traceId = traceId.trim();
        }

        final String resolvedTraceId = traceId;
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> headers.set(TRACE_ID_HEADER, resolvedTraceId))
                .build();
        exchange.getResponse().getHeaders().set(TRACE_ID_HEADER, resolvedTraceId);

        MDC.put(MDC_TRACE_ID, resolvedTraceId);
        try {
            log.info("Gateway request {} {} traceId={}",
                    exchange.getRequest().getMethod(), exchange.getRequest().getURI().getPath(),
                    resolvedTraceId);
        } finally {
            MDC.remove(MDC_TRACE_ID);
        }

        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        // Run right after UntrustedHeaderStripGlobalFilter normalizes X-Request-Id.
        return Ordered.HIGHEST_PRECEDENCE + 6;
    }
}
