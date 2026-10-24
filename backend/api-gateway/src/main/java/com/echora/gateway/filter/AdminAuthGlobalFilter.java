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
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Bộ lọc xác thực quyền ADMIN trung tâm trên API Gateway.
 * Mọi yêu cầu tới endpoint quản trị phải có Authorization: Bearer &lt;token&gt; hợp lệ với role ADMIN.
 * Từ chối 401 nếu chưa xác thực, sai chữ ký, sai thuật toán, thiếu exp hoặc token hết hạn.
 * Từ chối 403 nếu đã xác thực nhưng không phải ADMIN.
 * Sau khi xác thực thành công, gateway mới gắn các header tin cậy (X-User-Role, X-User-Id,
 * X-Internal-Api-Key) để các dịch vụ hạ nguồn biết yêu cầu này xuất phát từ gateway.
 */
@Component
public class AdminAuthGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AdminAuthGlobalFilter.class);

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final int MIN_SECRET_LENGTH = 32;
    private static final int MAX_TOKEN_LENGTH = 8192;

    private static final String ADMIN_API_PREFIX = "/api/admin";
    private static final String ADMIN_CONTENT_PREFIX = "/api/content/admin";
    private static final String ADMIN_AUTH_PREFIX = "/api/auth/admin";
    private static final String ANALYTICS_SUMMARY_PATH = "/api/analytics/summary";
    private static final String PROTECTED_SENTINEL = "/api/admin";

    private static final String UNAUTHORIZED_MESSAGE = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
    private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

    @Value("${app.jwt.secret:${JWT_SECRET:}}")
    private String jwtSecret;

    @Value("${internal.api-key:${INTERNAL_API_KEY:}}")
    private String internalApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AdminAuthGlobalFilter() {
    }

    public AdminAuthGlobalFilter(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public void setInternalApiKey(String internalApiKey) {
        this.internalApiKey = internalApiKey;
    }

    @PostConstruct
    void warnIfMisconfiguredAtStartup() {
        if (jwtSecret == null || jwtSecret.isBlank() || resolveSecretBytes(jwtSecret.trim()).length < MIN_SECRET_LENGTH) {
            log.warn("JWT_SECRET is missing or shorter than {} characters: ALL admin routes are DENIED with 401 (fail-closed).",
                    MIN_SECRET_LENGTH);
        }
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("INTERNAL_API_KEY is empty: admin routes cannot be forwarded to downstream services and will be DENIED with 401 (fail-closed).");
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getURI().getPath();

        // 1. OPTIONS preflight requests khong can xac thuc
        if (HttpMethod.OPTIONS.equals(method)) {
            return chain.filter(exchange);
        }

        // 2. Nhan dien cac route quan tri (deny by default cho moi endpoint admin)
        if (!isAdminPath(path)) {
            return chain.filter(exchange);
        }

        // 3. Fail-closed: neu JWT_SECRET chua duoc cau hinh hoac qua ngan (< 32 ky tu), tu choi 401
        if (jwtSecret == null || jwtSecret.isBlank()) {
            log.warn("JWT_SECRET is unset or empty. Denying access to protected admin path [{}] (fail-closed)", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        byte[] secretBytes = resolveSecretBytes(jwtSecret.trim());
        if (secretBytes.length < MIN_SECRET_LENGTH) {
            log.warn("JWT_SECRET is shorter than 32 characters. Denying access to [{}] (fail-closed)", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        // 4. Fail-closed: neu thieu khoa noi bo, khong the bao dam hạ nguồn tin cay gateway
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("INTERNAL_API_KEY is unset or empty. Denying admin access to [{}] (fail-closed)", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        // 5. Trích xuất Authorization header: Bearer <token>
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            log.warn("Missing or invalid Authorization header on admin route [{}]", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            log.warn("Blank Bearer token on admin route [{}]", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        // 6. Chan token qua lon truoc khi phan tich
        if (token.length() > MAX_TOKEN_LENGTH) {
            log.warn("Oversized JWT ({} chars) on admin route [{}]", token.length(), path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        // 7. Kiem tra va giai ma JWT
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            log.warn("Malformed JWT structure on admin route [{}]", path);
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }

        try {
            // Kiem tra thuat toan trong header: chi chap nhan dung HS256
            byte[] headerBytes = Base64.getUrlDecoder().decode(parts[0]);
            JsonNode headerNode = objectMapper.readTree(headerBytes);
            String alg = headerNode.path("alg").asText("");
            if (!"HS256".equals(alg)) {
                log.warn("Unsupported JWT algorithm [{}] on admin route [{}]", alg, path);
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }

            // Kiem tra chu ky HMAC-SHA256 bang so sanh constant-time
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSig = mac.doFinal(signingInput.getBytes(StandardCharsets.US_ASCII));
            byte[] clientSig = Base64.getUrlDecoder().decode(parts[2]);

            if (!MessageDigest.isEqual(expectedSig, clientSig)) {
                log.warn("Invalid JWT signature on admin route [{}]", path);
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }

            // Giai ma payload
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payloadNode = objectMapper.readTree(payloadBytes);

            // Bat buoc co claim exp va phai con han
            JsonNode expNode = payloadNode.get("exp");
            if (expNode == null || !expNode.isNumber()) {
                log.warn("Missing or non-numeric exp claim on admin route [{}]", path);
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }
            long exp = expNode.asLong();
            if (Instant.now().getEpochSecond() >= exp) {
                log.warn("Expired JWT access token on admin route [{}]", path);
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }

            String userId = payloadNode.path("sub").asText("unknown");

            // Kiem tra trang thai tai khoan: chi cho phep ACTIVE khi claim status duoc cung cap
            JsonNode statusNode = payloadNode.get("status");
            String status = statusNode == null ? "" : statusNode.asText("");
            if (!status.isBlank() && !"ACTIVE".equalsIgnoreCase(status.trim())) {
                log.warn("Blocked user account on admin route [{}] for userId [{}] at [{}]",
                        path, userId, LocalDateTime.now());
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }

            // Bat buoc claim role phai la chuoi
            JsonNode roleNode = payloadNode.get("role");
            if (roleNode == null || !roleNode.isTextual()) {
                log.warn("Missing or non-string role claim on admin route [{}]", path);
                return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            }
            String role = roleNode.asText();

            // So sanh role khong phu thuoc chu hoa/thuong
            if (!"ADMIN".equalsIgnoreCase(role.trim())) {
                // Ghi log tu choi quyen: userId, route, timestamp (khong bao gio log token)
                log.warn("Access denied on admin route [{}] for userId [{}]: role [{}] is not ADMIN at [{}]",
                        path, userId, role, LocalDateTime.now());
                return sendError(exchange, HttpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);
            }

            // Xac thuc thanh cong: truyen dinh danh tin cay va khoa noi bo xuong backend microservices
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .headers(headers -> {
                        headers.set(UntrustedHeaderStripGlobalFilter.HEADER_USER_ROLE, "ADMIN");
                        headers.set(HEADER_USER_ID, userId);
                        headers.set(HEADER_INTERNAL_API_KEY, internalApiKey);
                    })
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception ex) {
            log.warn("JWT parsing/verification exception on admin route [{}]: {}", path, ex.getMessage());
            return sendError(exchange, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
        }
    }

    /**
     * Chuan hoa duong dan truoc khi doi chieu: giai ma percent-encoding mot lan (reject double-encoded),
     * gop nhieu dau '/', loai bo dau '/' cuoi, giai quyet '.', '..', va ha chu thuong.
     * Bat ky dau hieu bat thuong nao cung duoc quy ve mot duong dan bao ve de khong the vuot qua.
     */
    private boolean isAdminPath(String path) {
        if (path == null) {
            return false;
        }
        String normalized = normalizePath(path);
        return normalized.equals(ADMIN_API_PREFIX) || normalized.startsWith(ADMIN_API_PREFIX + "/")
                || normalized.equals(ADMIN_CONTENT_PREFIX) || normalized.startsWith(ADMIN_CONTENT_PREFIX + "/")
                || normalized.equals(ADMIN_AUTH_PREFIX) || normalized.startsWith(ADMIN_AUTH_PREFIX + "/")
                || normalized.equals(ANALYTICS_SUMMARY_PATH)
                || normalized.contains("/admin/") || normalized.endsWith("/admin");
    }

    private String normalizePath(String path) {
        String candidate = path.replace('\\', '/');

        if (candidate.indexOf('%') >= 0) {
            String decoded = percentDecodeOnce(candidate);
            if (decoded == null || decoded.indexOf('%') >= 0) {
                // Khong giai ma duoc hoac con encoding lan hai -> coi nhu duong dan bao ve
                return PROTECTED_SENTINEL;
            }
            candidate = decoded;
        }

        Deque<String> segments = new ArrayDeque<>();
        for (String segment : candidate.split("/")) {
            if (segment.isEmpty() || ".".equals(segment)) {
                continue;
            }
            if ("..".equals(segment)) {
                if (!segments.isEmpty()) {
                    segments.removeLast();
                }
                continue;
            }
            segments.addLast(segment);
        }

        StringBuilder builder = new StringBuilder();
        for (String segment : segments) {
            builder.append('/').append(segment);
        }
        String normalized = builder.length() == 0 ? "/" : builder.toString();
        return normalized.toLowerCase(Locale.ROOT);
    }

    /** Giai ma percent-encoding dung mot lan; tra ve null neu chuoi khong hop le. */
    private String percentDecodeOnce(String value) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            for (int i = 0; i < value.length(); i++) {
                char c = value.charAt(i);
                if (c == '%') {
                    if (i + 2 >= value.length()) {
                        return null;
                    }
                    int high = Character.digit(value.charAt(i + 1), 16);
                    int low = Character.digit(value.charAt(i + 2), 16);
                    if (high < 0 || low < 0) {
                        return null;
                    }
                    out.write((high << 4) + low);
                    i += 2;
                } else {
                    out.write(c);
                }
            }
            return out.toString(StandardCharsets.UTF_8);
        } catch (Exception ex) {
            return null;
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

    private Mono<Void> sendError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", exchange.getRequest().getURI().getPath());

        try {
            byte[] jsonBytes = objectMapper.writeValueAsBytes(body);
            DataBuffer buffer = response.bufferFactory().wrap(jsonBytes);
            return response.writeWith(Mono.just(buffer));
        } catch (Exception e) {
            byte[] fallback = ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}")
                    .getBytes(StandardCharsets.UTF_8);
            DataBuffer buffer = response.bufferFactory().wrap(fallback);
            return response.writeWith(Mono.just(buffer));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
