package com.saigonvoice.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
import java.security.MessageDigest;

@Component
public class AdminAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthGlobalFilter.class);

    public static final String HEADER_ADMIN_KEY = "X-Admin-Key";
    private static final String ADMIN_CONTENT_PREFIX = "/api/content/admin";
    private static final String ANALYTICS_SUMMARY_PATH = "/api/analytics/summary";

    // Read from ADMIN_API_KEY environment variable. No default value in code or yml.
    @Value("${ADMIN_API_KEY:}")
    private String adminApiKey;

    public AdminAuthGlobalFilter() {
    }

    // Constructor for testing
    public AdminAuthGlobalFilter(String adminApiKey) {
        this.adminApiKey = adminApiKey;
    }

    public void setAdminApiKey(String adminApiKey) {
        this.adminApiKey = adminApiKey;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getURI().getPath();

        // 1. OPTIONS preflight requests must NOT require the key
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        // 2. Identify protected paths: any method on /api/content/admin/** and GET /api/analytics/summary
        boolean isAdminContent = path != null && (path.equals(ADMIN_CONTENT_PREFIX) || path.startsWith(ADMIN_CONTENT_PREFIX + "/"));
        boolean isAnalyticsSummary = HttpMethod.GET.equals(method) && ANALYTICS_SUMMARY_PATH.equals(path);

        if (!isAdminContent && !isAnalyticsSummary) {
            return chain.filter(exchange);
        }

        // 3. Fail-closed: If ADMIN_API_KEY is empty or unset, protected paths must ALWAYS return 401
        // Note: Generic body with no hints, do NOT reveal whether the key is configured
        if (adminApiKey == null || adminApiKey.isBlank()) {
            log.warn("ADMIN_API_KEY is unset or empty. Denying access to protected path [{}] (fail-closed)", path);
            return sendUnauthorized(exchange);
        }

        // 4. Verify client-supplied X-Admin-Key header
        String clientKey = exchange.getRequest().getHeaders().getFirst(HEADER_ADMIN_KEY);
        if (clientKey == null || clientKey.isBlank()) {
            log.warn("Missing {} header for path: {}", HEADER_ADMIN_KEY, path);
            return sendUnauthorized(exchange);
        }

        // 5. Constant-time comparison (MessageDigest.isEqual) to prevent timing attacks. Do NOT log the key!
        byte[] expectedBytes = adminApiKey.getBytes(StandardCharsets.UTF_8);
        byte[] clientBytes = clientKey.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedBytes, clientBytes)) {
            log.warn("Invalid {} header for path: {}", HEADER_ADMIN_KEY, path);
            return sendUnauthorized(exchange);
        }

        // 6. Security rule: Do NOT forward X-Admin-Key downstream
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(HEADER_ADMIN_KEY);
                    headers.remove(HEADER_ADMIN_KEY.toLowerCase());
                })
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Void> sendUnauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // Generic error body with no hints
        byte[] jsonBytes = "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Unauthorized\"}"
                .getBytes(StandardCharsets.UTF_8);

        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
