package com.saigonvoice.order.config;

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

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class InternalAuthFilter extends OncePerRequestFilter {

    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String ATTRIBUTE_USER_ID = "userId";

    private static final String ORDERS_PREFIX = "/api/orders";
    private static final String ADMIN_ORDERS_PREFIX = "/api/admin/orders";
    private static final String VNPAY_RETURN_PATH = "/api/orders/vnpay/return";
    private static final String VNPAY_IPN_PATH = "/api/orders/vnpay/ipn";
    private static final String REQUIRED_ADMIN_ROLE = "ADMIN";
    private static final String UNAUTHORIZED_MESSAGE = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
    private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    @PostConstruct
    void warnIfMisconfigured() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: all order endpoints are DISABLED (HTTP 503).");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        boolean isOrderPath = path.equals(ORDERS_PREFIX) || path.startsWith(ORDERS_PREFIX + "/");
        boolean isAdminOrderPath = path.equals(ADMIN_ORDERS_PREFIX)
                || path.startsWith(ADMIN_ORDERS_PREFIX + "/");
        if (!isOrderPath && !isAdminOrderPath) {
            return true;
        }
        if (isAdminOrderPath) {
            return false;
        }
        return VNPAY_RETURN_PATH.equals(path) || VNPAY_IPN_PATH.equals(path);
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
            reject(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Dịch vụ đơn hàng chưa được cấu hình.");
            return;
        }

        if (!constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)) {
            log.warn("Denied direct access to {} - missing or invalid {}", request.getRequestURI(), HEADER_INTERNAL_API_KEY);
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            return;
        }

        String rawUserId = request.getHeader(HEADER_USER_ID);
        if (isBlank(rawUserId)) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            return;
        }

        long userId;
        try {
            userId = Long.parseLong(rawUserId.trim());
        } catch (NumberFormatException ex) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            return;
        }
        if (userId <= 0) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, UNAUTHORIZED_MESSAGE);
            return;
        }

        String path = request.getRequestURI();
        boolean isAdminOrderPath = path != null
                && (path.equals(ADMIN_ORDERS_PREFIX) || path.startsWith(ADMIN_ORDERS_PREFIX + "/"));
        if (isAdminOrderPath) {
            String role = request.getHeader(HEADER_USER_ROLE);
            if (role == null || !REQUIRED_ADMIN_ROLE.equalsIgnoreCase(role.trim())) {
                log.warn("Denied non-admin access to {} - role: {}", path, role);
                reject(response, HttpServletResponse.SC_FORBIDDEN, FORBIDDEN_MESSAGE);
                return;
            }
        }

        request.setAttribute(ATTRIBUTE_USER_ID, userId);
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
        return value == null || value.isBlank();
    }
}
