package com.echora.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class UserAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(UserAuthGlobalFilter.class);

    private static final String ORDERS_PREFIX = "/api/orders";
    private static final String VNPAY_RETURN_PATH = "/api/orders/vnpay/return";
    private static final String VNPAY_IPN_PATH = "/api/orders/vnpay/ipn";
    private static final String CONTENT_POIS_PREFIX = "/api/content/pois/";
    private static final String CONTENT_GUIDE_PATH = "/api/content/pois/guide";
    private static final String CONTENT_QR_PREFIX = "/api/content/pois/qr/";
    private static final String AUDIO_PREFIX = "/api/tts/audio/";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final int MIN_SECRET_LENGTH = 32;
    private static final int MAX_TOKEN_LENGTH = 8192;
    private static final String UNAUTHORIZED_MESSAGE = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";

    @Value("${app.jwt.secret:${JWT_SECRET:}}")
    private String jwtSecret;

    @Value("${internal.api-key:${INTERNAL_API_KEY:}}")
    private String internalApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    void warnIfMisconfigured() {
        if (jwtSecret == null || jwtSecret.isBlank()
                || resolveSecretBytes(jwtSecret.trim()).length < MIN_SECRET_LENGTH) {
            log.warn("JWT_SECRET is missing or too short: ALL /api/orders routes are DENIED with 401.");
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("INTERNAL_API_KEY is empty: /api/orders routes cannot be forwarded and will be DENIED with 401.");
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getURI().getPath();

        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }
        boolean tokenRequired = isProtectedOrderPath(path) || isAudioPath(path);
        if (!tokenRequired && !isContentEntitlementPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        boolean hasBearer = authHeader != null
                && authHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length());
        if (!hasBearer) {
            return tokenRequired
                    ? sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE)
                    : chain.filter(exchange);
        }

        if (jwtSecret == null || jwtSecret.isBlank()
                || resolveSecretBytes(jwtSecret.trim()).length < MIN_SECRET_LENGTH
                || internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("Gateway auth configuration is incomplete. Denying [{}] (fail-closed).", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty() || token.length() > MAX_TOKEN_LENGTH) {
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        try {
            JsonNode payload = verifyToken(token);
            String userId = payload.path("sub").asText("");
            if (userId.isBlank()) {
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }
            String status = payload.path("status").asText("");
            if (!status.isBlank() && !"ACTIVE".equalsIgnoreCase(status.trim())) {
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }
            String role = payload.path("role").asText("USER");
            String plan = payload.path("plan").asText("FREE");

            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .headers(headers -> {
                        headers.set(UntrustedHeaderStripGlobalFilter.HEADER_USER_ID, userId);
                        headers.set(UntrustedHeaderStripGlobalFilter.HEADER_USER_ROLE, role);
                        headers.set(UntrustedHeaderStripGlobalFilter.HEADER_USER_PLAN, plan);
                        headers.set(UntrustedHeaderStripGlobalFilter.HEADER_INTERNAL_API_KEY, internalApiKey);
                    })
                    .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception ex) {
            log.warn("Invalid access token on [{}]: {}", path, ex.getMessage());
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }
    }

    private JsonNode verifyToken(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Malformed JWT");
        }

        JsonNode header = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
        if (!"HS256".equals(header.path("alg").asText(""))) {
            throw new IllegalArgumentException("Unsupported algorithm");
        }

        byte[] secretBytes = resolveSecretBytes(jwtSecret.trim());
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
        byte[] expected = mac.doFinal((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        byte[] actual = Base64.getUrlDecoder().decode(parts[2]);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new IllegalArgumentException("Invalid signature");
        }

        JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
        JsonNode exp = payload.get("exp");
        if (exp == null || !exp.isNumber() || Instant.now().getEpochSecond() >= exp.asLong()) {
            throw new IllegalArgumentException("Token expired");
        }
        return payload;
    }

    private boolean isProtectedOrderPath(String path) {
        if (path == null) {
            return false;
        }
        if (!(path.equals(ORDERS_PREFIX) || path.startsWith(ORDERS_PREFIX + "/"))) {
            return false;
        }
        return !VNPAY_RETURN_PATH.equals(path) && !VNPAY_IPN_PATH.equals(path);
    }

    private boolean isAudioPath(String path) {
        if (path == null || !path.startsWith(AUDIO_PREFIX)) {
            return false;
        }
        // Audio tiếng Việt là tài nguyên công cộng miễn phí, không bắt buộc đăng nhập
        if (path.contains("_vi_") || path.endsWith("_vi.mp3") || path.contains("-vi-")) {
            return false;
        }
        return true;
    }

    private boolean isContentEntitlementPath(String path) {
        if (path == null) {
            return false;
        }
        if (CONTENT_GUIDE_PATH.equals(path)) {
            return true;
        }
        if (path.startsWith(CONTENT_QR_PREFIX)) {
            return true;
        }
        if (!path.startsWith(CONTENT_POIS_PREFIX)) {
            return false;
        }
        String id = path.substring(CONTENT_POIS_PREFIX.length());
        return !id.isEmpty() && id.chars().allMatch(Character::isDigit);
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

    private Mono<Void> sendError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", exchange.getRequest().getURI().getPath());

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(body);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (Exception ex) {
            byte[] fallback = ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}")
                    .getBytes(StandardCharsets.UTF_8);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(fallback)));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}
