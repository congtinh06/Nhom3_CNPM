package com.echora.gateway.filter;

import com.echora.gateway.handler.ProblemDetailSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class AnalyticsRateLimitGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsRateLimitGlobalFilter.class);

    private static final int MAX_TRACKED_ENTRIES = 10_000;
    private static final long WINDOW_DURATION_MS = 60_000L;
    private static final int MIN_SECRET_LENGTH = 32;

    @Value("${app.jwt.secret:${JWT_SECRET:}}")
    private String jwtSecret;

    @Value("${gateway.trusted-proxies:${GATEWAY_TRUSTED_PROXIES:}}")
    private String trustedProxiesConfig;

    @Value("${gateway.rate-limit.analytics-per-minute:${RATE_LIMIT_ANALYTICS_PER_MINUTE:60}}")
    private int maxRequestsPerMinute = 60;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Bounded in-memory LRU map to ensure memory cannot grow without limit.
    // When tracked identities exceed MAX_TRACKED_ENTRIES, the eldest entry is evicted.
    private final Map<String, RateLimitWindow> rateLimitCache = Collections.synchronizedMap(
            new LinkedHashMap<>(128, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, RateLimitWindow> eldest) {
                    return size() > MAX_TRACKED_ENTRIES;
                }
            }
    );

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public void setTrustedProxiesConfig(String trustedProxiesConfig) {
        this.trustedProxiesConfig = trustedProxiesConfig;
    }

    public void setMaxRequestsPerMinute(int maxRequestsPerMinute) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Rate limit applies strictly to POST /api/analytics/events
        if (!HttpMethod.POST.equals(request.getMethod()) ||
                !"/api/analytics/events".equals(path)) {
            return chain.filter(exchange);
        }

        String rateLimitKey = resolveKey(exchange);

        long now = System.currentTimeMillis();
        long retryAfterSeconds;

        synchronized (rateLimitCache) {
            RateLimitWindow window = rateLimitCache.get(rateLimitKey);
            if (window == null || (now - window.windowStartMs) >= WINDOW_DURATION_MS) {
                rateLimitCache.put(rateLimitKey, new RateLimitWindow(now, 1));
                return chain.filter(exchange);
            } else {
                if (window.requestCount >= maxRequestsPerMinute) {
                    long remainingMs = WINDOW_DURATION_MS - (now - window.windowStartMs);
                    retryAfterSeconds = Math.max(1, (remainingMs + 999) / 1000);
                } else {
                    window.requestCount++;
                    return chain.filter(exchange);
                }
            }
        }

        log.warn("Rate limit exceeded for key: {} on POST /api/analytics/events. Retry-After: {}s",
                rateLimitKey, retryAfterSeconds);
        return sendRateLimitResponse(exchange, retryAfterSeconds);
    }

    /**
     * Resolves the identity key for the rate limiter bucket:
     * 1. Authenticated user id (from verified JWT) when present -> "user:<id>"
     * 2. Direct TCP socket IP
     * 3. First hop of X-Forwarded-For ONLY when direct peer is in trusted-proxy list
     *    (exact IP or CIDR entry) -> "ip:<first-hop>"
     * 4. Fall back to socket IP (untrusted clients cannot spoof headers) -> "ip:<socket-ip>"
     */
    public String resolveKey(ServerWebExchange exchange) {
        ServerHttpRequest request = exchange.getRequest();

        // 1. Authenticated user ID from validated JWT when present
        String userId = resolveAuthenticatedUserId(request);
        if (userId != null && !userId.isBlank()) {
            return "user:" + userId;
        }

        // 2. Direct TCP peer socket IP
        String socketIp = resolveSocketIp(request);

        // 3. Client IP from X-Forwarded-For first hop ONLY when direct peer is in trusted proxies
        if (isTrustedProxy(socketIp)) {
            String xff = request.getHeaders().getFirst("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String firstHop = xff.split(",")[0].trim();
                if (!firstHop.isEmpty()) {
                    return "ip:" + firstHop;
                }
            }
        }

        // 4. Fall back to direct socket IP (untrusted peers cannot spoof X-Forwarded-For)
        return "ip:" + socketIp;
    }

    private String resolveAuthenticatedUserId(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        if (jwtSecret == null || jwtSecret.isBlank() || resolveSecretBytes(jwtSecret.trim()).length < MIN_SECRET_LENGTH) {
            return null;
        }
        String token = authHeader.substring(7).trim();
        if (token.isEmpty() || token.length() > 8192) {
            return null;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            byte[] secretBytes = resolveSecretBytes(jwtSecret.trim());
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] expected = mac.doFinal((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
            byte[] actual = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) {
                return null;
            }
            JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            JsonNode exp = payload.get("exp");
            if (exp != null && exp.isNumber() && Instant.now().getEpochSecond() >= exp.asLong()) {
                return null;
            }
            String sub = payload.path("sub").asText("");
            return sub.isBlank() ? null : sub;
        } catch (Exception ex) {
            return null;
        }
    }

    private String resolveSocketIp(ServerHttpRequest request) {
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }
        return "unknown";
    }

    private boolean isTrustedProxy(String socketIp) {
        if (socketIp == null || socketIp.isBlank()) {
            return false;
        }
        if (trustedProxiesConfig == null || trustedProxiesConfig.isBlank()) {
            return false;
        }
        InetAddress peer = parseLiteralIp(socketIp);
        for (String proxy : trustedProxiesConfig.split(",")) {
            String trimmed = proxy.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.indexOf('/') >= 0) {
                // Ho tro CIDR (vd: 172.24.0.0/16) de khong vo khi Docker cap lai IP container.
                if (peer != null && matchesCidr(peer, trimmed)) {
                    return true;
                }
            } else if (trimmed.equalsIgnoreCase(socketIp)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Chi parse IP literal; khong bao gio phan giai DNS tu header/peer de tranh SSRF/treo request.
     */
    private InetAddress parseLiteralIp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return InetAddress.getByName(value.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private boolean matchesCidr(InetAddress peer, String cidr) {
        int slash = cidr.indexOf('/');
        try {
            InetAddress network = InetAddress.getByName(cidr.substring(0, slash).trim());
            int prefixLength = Integer.parseInt(cidr.substring(slash + 1).trim());

            byte[] peerBytes = peer.getAddress();
            byte[] networkBytes = network.getAddress();
            if (peerBytes.length != networkBytes.length) {
                return false;
            }

            int maxBits = peerBytes.length * 8;
            if (prefixLength < 0 || prefixLength > maxBits) {
                log.warn("Ignoring trusted proxy with invalid CIDR prefix: {}", cidr);
                return false;
            }

            int fullBytes = prefixLength / 8;
            for (int i = 0; i < fullBytes; i++) {
                if (peerBytes[i] != networkBytes[i]) {
                    return false;
                }
            }

            int remainingBits = prefixLength % 8;
            if (remainingBits == 0) {
                return true;
            }
            int mask = (0xFF << (8 - remainingBits)) & 0xFF;
            return (peerBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
        } catch (Exception ex) {
            log.warn("Ignoring invalid trusted proxy CIDR entry: {}", cidr);
            return false;
        }
    }

    private byte[] resolveSecretBytes(String secret) {
        try {
            byte[] decoded = Base64.getDecoder().decode(secret);
            if (decoded.length >= MIN_SECRET_LENGTH) {
                return decoded;
            }
        } catch (Exception ignored) {
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    private Mono<Void> sendRateLimitResponse(ServerWebExchange exchange, long retryAfterSeconds) {
        exchange.getResponse().getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
        exchange.getResponse().getHeaders().set("Access-Control-Expose-Headers", "Retry-After");
        return ProblemDetailSupport.write(exchange, HttpStatus.TOO_MANY_REQUESTS,
                String.format("Rate limit exceeded. Retry after %d seconds.", retryAfterSeconds));
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
