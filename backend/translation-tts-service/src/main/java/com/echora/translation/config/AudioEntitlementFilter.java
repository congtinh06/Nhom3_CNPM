package com.echora.translation.config;

import com.echora.translation.exception.ProblemDetailWriter;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class AudioEntitlementFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_PLAN = "X-User-Plan";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";

    private static final String AUDIO_PREFIX = "/api/tts/audio/";
    // Narration chính: poi_101_en_<hash8>.mp3; chap: poi_101_c2_en_<hash8>.mp3
    private static final Pattern AUDIO_FILE =
            Pattern.compile("^poi_([0-9]+)(?:_c[0-9]+)?_([a-z]{2,3})_[0-9a-f]{8}\\.mp3$");
    private static final long POI_ENTITLEMENT_TTL_SECONDS = 60;

    private final RestClient restClient;
    private final String expectedApiKey;
    private final Map<String, CachedGrant> poiGrantCache = new ConcurrentHashMap<>();

    public AudioEntitlementFilter(@Value("${app.auth-service.url:http://localhost:8086}") String authBaseUrl,
                                  @Value("${internal.api-key:}") String expectedApiKey,
                                  @Value("${app.auth-service.connect-timeout-ms:2000}") int connectTimeoutMs,
                                  @Value("${app.auth-service.read-timeout-ms:3000}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeoutMs);
        requestFactory.setReadTimeout(readTimeoutMs);
        this.restClient = RestClient.builder()
                .baseUrl(authBaseUrl)
                .requestFactory(requestFactory)
                .build();
        this.expectedApiKey = expectedApiKey;
    }

    @PostConstruct
    void warnIfMissing() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: audio endpoints are DISABLED (HTTP 503).");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(AUDIO_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        String fileName = request.getRequestURI().substring(AUDIO_PREFIX.length());
        Matcher matcher = AUDIO_FILE.matcher(fileName);
        String language = matcher.matches() ? matcher.group(2) : "vi";
        if ("vi".equalsIgnoreCase(language)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isBlank(expectedApiKey)) {
            reject(request, response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                    "Dịch vụ âm thanh chưa được cấu hình.");
            return;
        }
        if (!constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)
                || isBlank(request.getHeader(HEADER_USER_ID))) {
            reject(request, response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            return;
        }

        boolean premium = "PREMIUM".equalsIgnoreCase(request.getHeader(HEADER_USER_PLAN));
        if (!premium) {
            // Không Premium: cho phép nếu POI này đã được mua lẻ (chap hoặc narration chính).
            Long poiId = matcher.matches() ? Long.valueOf(matcher.group(1)) : null;
            Long userId;
            try {
                userId = Long.valueOf(request.getHeader(HEADER_USER_ID).trim());
            } catch (NumberFormatException ex) {
                userId = null;
            }
            if (poiId == null || userId == null || !hasPurchasedPoi(userId, poiId)) {
                reject(request, response, HttpServletResponse.SC_FORBIDDEN,
                        "Ngôn ngữ này yêu cầu gói Premium đang hoạt động.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasPurchasedPoi(Long userId, Long poiId) {
        String cacheKey = userId + ":" + poiId;
        CachedGrant cached = poiGrantCache.get(cacheKey);
        Instant now = Instant.now();
        if (cached != null && now.isBefore(cached.expiresAt())) {
            return cached.active();
        }
        boolean active;
        try {
            EntitlementSnapshot snapshot = restClient.get()
                    .uri("/api/auth/internal/entitlements/{userId}/pois/{poiId}", userId, poiId)
                    .header(HEADER_INTERNAL_API_KEY, expectedApiKey)
                    .retrieve()
                    .body(EntitlementSnapshot.class);
            active = snapshot != null && snapshot.premiumActive;
        } catch (Exception ex) {
            log.warn("Không thể kiểm tra quyền mua lẻ POI (userId={}, poiId={}): {}", userId, poiId, ex.getMessage());
            active = false;
        }
        poiGrantCache.put(cacheKey, new CachedGrant(active, now.plusSeconds(POI_ENTITLEMENT_TTL_SECONDS)));
        return active;
    }

    private record CachedGrant(boolean active, Instant expiresAt) {
    }

    private static class EntitlementSnapshot {
        public Long userId;
        public String plan;
        public boolean premiumActive;
    }

    private static boolean constantTimeEquals(String incoming, String expected) {
        if (incoming == null) {
            return false;
        }
        return MessageDigest.isEqual(
                incoming.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8));
    }

    private static void reject(HttpServletRequest request, HttpServletResponse response,
                               int status, String message) throws IOException {
        ProblemDetailWriter.write(response, request, status, message);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
