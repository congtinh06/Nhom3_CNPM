package com.echora.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Removes identity/trust headers that only the gateway itself may set.
 * Runs before every other global filter, so a client-forged X-User-Role or
 * X-Internal-Api-Key can never reach a downstream service.
 */
@Component
public class UntrustedHeaderStripGlobalFilter implements GlobalFilter, Ordered {

    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_PLAN = "X-User-Plan";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String HEADER_USER_ID = "X-User-Id";

    public static final String HEADER_TRACE_ID = "X-Trace-Id";
    public static final String HEADER_REQUEST_ID = "X-Request-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(HEADER_USER_ROLE);
                    headers.remove(HEADER_USER_PLAN);
                    headers.remove(HEADER_INTERNAL_API_KEY);
                    headers.remove(HEADER_USER_ID);
                    // Normalize X-Request-Id -> X-Trace-Id so a client-supplied trace
                    // id is honored consistently across gateway error handlers and
                    // forwarded downstream. X-Trace-Id wins when both are present.
                    if (isBlank(headers.getFirst(HEADER_TRACE_ID))) {
                        String requestId = headers.getFirst(HEADER_REQUEST_ID);
                        if (!isBlank(requestId)) {
                            headers.set(HEADER_TRACE_ID, requestId);
                        }
                    }
                })
                .build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 5;
    }
}
