package com.echora.content.config;

import com.echora.content.exception.ProblemDetailWriter;
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
 * Kiểm tra role của request tới các endpoint quản trị /api/admin/** và /api/content/admin/**.
 * Chỉ chấp nhận yêu cầu xuất phát từ gateway: bắt buộc có X-User-Role = ADMIN và khóa nội bộ
 * X-Internal-Api-Key khớp cấu hình. Nếu thiếu khóa nội bộ trên service (rỗng) thì mọi
 * endpoint quản trị bị TẮT (fail-closed, 403). Điều này chặn client gọi trực tiếp service
 * và giả mạo header X-User-Role.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class AdminRoleFilter extends OncePerRequestFilter {

    public static final String HEADER_ROLE = "X-User-Role";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String REQUIRED_ROLE = "ADMIN";
    private static final String ADMIN_PREFIX = "/api/admin";
    private static final String CONTENT_ADMIN_PREFIX = "/api/content/admin";
    private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    @PostConstruct
    void warnIfMisconfigured() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: all admin endpoints are DISABLED (HTTP 403, fail-closed).");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        boolean isAdmin = path.equals(ADMIN_PREFIX) || path.startsWith(ADMIN_PREFIX + "/");
        boolean isContentAdmin = path.equals(CONTENT_ADMIN_PREFIX) || path.startsWith(CONTENT_ADMIN_PREFIX + "/");
        boolean hasAdminSegment = path.contains("/admin/") || path.endsWith("/admin");

        return !isAdmin && !isContentAdmin && !hasAdminSegment;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Fail-closed: không có khóa nội bộ thì không thể xác nhận request đến từ gateway
        if (isBlank(expectedApiKey)) {
            log.warn("Access denied on admin path {} - internal API key is not configured (fail-closed)",
                    request.getRequestURI());
            reject(request, response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
            return;
        }

        String role = request.getHeader(HEADER_ROLE);
        if (role == null || !REQUIRED_ROLE.equalsIgnoreCase(role.trim())) {
            log.warn("Access denied on admin path {} - missing or invalid {}: {}",
                    request.getRequestURI(), HEADER_ROLE, role);
            reject(request, response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
            return;
        }

        if (!constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)) {
            log.warn("Access denied on admin path {} - missing or invalid {}",
                    request.getRequestURI(), HEADER_INTERNAL_API_KEY);
            reject(request, response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
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

    private static void reject(HttpServletRequest request, HttpServletResponse response,
                               int status, String message) throws IOException {
        ProblemDetailWriter.write(response, request, status, message);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
