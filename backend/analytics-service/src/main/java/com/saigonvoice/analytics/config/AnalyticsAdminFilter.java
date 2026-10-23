package com.saigonvoice.analytics.config;

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

/**
 * Bảo vệ các endpoint quản trị /api/analytics/summary và /api/analytics/admin/**.
 * Gateway xác thực JWT và truyền X-User-Role = ADMIN cùng khóa nội bộ X-Internal-Api-Key.
 * Chỉ chấp nhận yêu cầu có đủ cả hai; thiếu khóa nội bộ trên service (rỗng) thì endpoint bị
 * TẮT (fail-closed, 403) để chặn truy cập trực tiếp và giả mạo header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class AnalyticsAdminFilter extends OncePerRequestFilter {

    public static final String HEADER_ROLE = "X-User-Role";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String REQUIRED_ROLE = "ADMIN";
    static final String ADMIN_SUMMARY_PATH = "/api/analytics/summary";
    static final String ADMIN_ANALYTICS_PREFIX = "/api/analytics/admin/";
    private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    @PostConstruct
    void warnIfMisconfigured() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: analytics admin endpoints are DISABLED (HTTP 403, fail-closed).");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !ADMIN_SUMMARY_PATH.equals(path) && !path.startsWith(ADMIN_ANALYTICS_PREFIX);
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
            log.warn("Access denied on {} - internal API key is not configured (fail-closed)",
                    request.getRequestURI());
            reject(response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
            return;
        }

        String role = request.getHeader(HEADER_ROLE);
        if (role == null || !REQUIRED_ROLE.equalsIgnoreCase(role.trim())) {
            log.warn("Access denied on {} - missing or invalid {}: {}",
                    request.getRequestURI(), HEADER_ROLE, role);
            reject(response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
            return;
        }

        if (!constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)) {
            log.warn("Access denied on {} - missing or invalid {}",
                    request.getRequestURI(), HEADER_INTERNAL_API_KEY);
            reject(response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
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
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"Forbidden\",\"message\":\"" + message + "\"}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
