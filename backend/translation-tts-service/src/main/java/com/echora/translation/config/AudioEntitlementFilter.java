package com.echora.translation.config;

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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
    private static final Pattern AUDIO_FILE =
            Pattern.compile("^poi_[0-9]+_([a-z]{2,3})_[0-9a-f]{8}\\.mp3$");

    @Value("${internal.api-key:}")
    private String expectedApiKey;

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
        if (isBlank(expectedApiKey)) {
            reject(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                    "Dịch vụ âm thanh chưa được cấu hình.");
            return;
        }
        if (!constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)
                || isBlank(request.getHeader(HEADER_USER_ID))) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            return;
        }

        String fileName = request.getRequestURI().substring(AUDIO_PREFIX.length());
        Matcher matcher = AUDIO_FILE.matcher(fileName);
        String language = matcher.matches() ? matcher.group(1) : "vi";
        boolean premium = "PREMIUM".equalsIgnoreCase(request.getHeader(HEADER_USER_PLAN));
        if (!"vi".equals(language) && !premium) {
            reject(response, HttpServletResponse.SC_FORBIDDEN,
                    "Ngôn ngữ này yêu cầu gói Premium đang hoạt động.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean constantTimeEquals(String incoming, String expected) {
        if (incoming == null) {
            return false;
        }
        return MessageDigest.isEqual(
                incoming.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8));
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
