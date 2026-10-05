package com.saigonvoice.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class AnalyticsRateLimitGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsRateLimitGlobalFilter.class);

    private static final int MAX_TRACKED_IPS = 10_000;
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final long WINDOW_DURATION_MS = 60_000L;

    // Bounded in-memory LRU map to ensure memory cannot grow without limit.
    // When tracked IPs exceed MAX_TRACKED_IPS, the eldest (least recently used) entry is evicted.
    private final Map<String, RateLimitWindow> rateLimitCache = Collections.synchronizedMap(
            new LinkedHashMap<>(128, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, RateLimitWindow> eldest) {
                    return size() > MAX_TRACKED_IPS;
                }
            }
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Rate limit applies strictly to POST /api/analytics/events
        if (!HttpMethod.POST.equals(request.getMethod()) ||
                !"/api/analytics/events".equals(path)) {
            return chain.filter(exchange);
        }

        // Security note: We intentionally ignore X-Forwarded-For headers to prevent client IP spoofing,
        // and rely exclusively on the direct TCP remote socket address of the incoming connection.
        String clientIp = resolveClientIp(request);

        long now = System.currentTimeMillis();
        long retryAfterSeconds;

        synchronized (rateLimitCache) {
            RateLimitWindow window = rateLimitCache.get(clientIp);
            if (window == null || (now - window.windowStartMs) >= WINDOW_DURATION_MS) {
                rateLimitCache.put(clientIp, new RateLimitWindow(now, 1));
                return chain.filter(exchange);
            } else {
                if (window.requestCount >= MAX_REQUESTS_PER_MINUTE) {
                    long remainingMs = WINDOW_DURATION_MS - (now - window.windowStartMs);
                    retryAfterSeconds = Math.max(1, (remainingMs + 999) / 1000);
                } else {
                    window.requestCount++;
                    return chain.filter(exchange);
                }
            }
        }

        log.warn("Rate limit exceeded for IP: {} on POST /api/analytics/events. Retry-After: {}s",
                clientIp, retryAfterSeconds);
        return sendRateLimitResponse(exchange, retryAfterSeconds);
    }

    private String resolveClientIp(ServerHttpRequest request) {
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }

    private Mono<Void> sendRateLimitResponse(ServerWebExchange exchange, long retryAfterSeconds) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));

        byte[] jsonBytes = String.format(
                "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Retry after %d seconds.\"}",
                retryAfterSeconds
        ).getBytes(StandardCharsets.UTF_8);

        DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
        return response.writeWith(Mono.just(buffer));
    }

    public void clearRateLimitCache() {
        rateLimitCache.clear();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 30;
    }

    private static class RateLimitWindow {
        final long windowStartMs;
        int requestCount;

        RateLimitWindow(long windowStartMs, int requestCount) {
            this.windowStartMs = windowStartMs;
            this.requestCount = requestCount;
        }
    }
}
