package com.saigonvoice.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class InternalPathBlockFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(InternalPathBlockFilter.class);

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    private static final String CONTENT_PREFIX = "/api/content";
    private static final String INTERNAL_CONTENT_PREFIX = "/api/content/internal";
    private static final String ADMIN_CONTENT_PREFIX = "/api/content/admin";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 1. Strip any client-supplied X-Internal-Api-Key header on ALL incoming requests
        ServerHttpRequest mutatedRequest = request.mutate()
                .headers(headers -> {
                    headers.remove(HEADER_INTERNAL_API_KEY);
                    headers.remove(HEADER_INTERNAL_API_KEY.toLowerCase());
                })
                .build();
        ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedRequest).build();

        // If path is not under /api/content, allow to proceed (e.g. /api/location/**, /api/tts/**, /api/analytics/**)
        if (path == null || (!path.equals(CONTENT_PREFIX) && !path.startsWith(CONTENT_PREFIX + "/"))) {
            return chain.filter(mutatedExchange);
        }

        // 2. /api/content/internal/** (any method) -> 404 Not Found
        if (path.equals(INTERNAL_CONTENT_PREFIX) || path.startsWith(INTERNAL_CONTENT_PREFIX + "/")) {
            log.warn("Blocked public access attempt to internal endpoint: {}", path);
            return sendNotFound(mutatedExchange);
        }

        // 3. /api/content/admin/** -> Handled and authorized by AdminAuthGlobalFilter; allow through
        if (path.equals(ADMIN_CONTENT_PREFIX) || path.startsWith(ADMIN_CONTENT_PREFIX + "/")) {
            return chain.filter(mutatedExchange);
        }

        // 4. Preflight OPTIONS requests for CORS must not be blocked
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(mutatedExchange);
        }

        // 5. Everything else under /api/content/**: allow ONLY GET and HEAD
        if (!HttpMethod.GET.equals(method) && !HttpMethod.HEAD.equals(method)) {
            log.warn("Blocked disallowed method [{}] on public content endpoint: {}", method, path);
            return sendNotFound(mutatedExchange);
        }

        // 6. Path must strictly match allowed public content paths
        if (!isAllowedPublicContentPath(path)) {
            log.warn("Blocked request to unrecognized content path: {}", path);
            return sendNotFound(mutatedExchange);
        }

        return chain.filter(mutatedExchange);
    }

    private boolean isAllowedPublicContentPath(String path) {
        return path.equals("/api/content/categories") ||
                path.equals("/api/content/pois") || path.startsWith("/api/content/pois/") ||
                path.equals("/api/content/routes") || path.startsWith("/api/content/routes/") ||
                path.equals("/api/content/zones") || path.startsWith("/api/content/zones/") ||
                path.equals("/api/content/products") || path.startsWith("/api/content/products/");
    }

    private Mono<Void> sendNotFound(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.NOT_FOUND);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] jsonBytes = "{\"status\":404,\"error\":\"Not Found\",\"message\":\"Not Found\"}"
                .getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}
