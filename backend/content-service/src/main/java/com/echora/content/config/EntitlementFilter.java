package com.echora.content.config;

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
@Order(Ordered.HIGHEST_PRECEDENCE + 8)
@Slf4j
public class EntitlementFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_PLAN = "X-User-Plan";
    public static final String HEADER_INTERNAL_API_KEY = "X-Internal-Api-Key";
    public static final String ATTRIBUTE_PREMIUM = "premiumEntitlement";

    private static final String POIS_PREFIX = "/api/content/pois/";
    private static final String GUIDE_PATH = "/api/content/pois/guide";
    private static final String QR_PREFIX = "/api/content/pois/qr/";
    private static final String PREMIUM_REQUIRED_MESSAGE =
            "Ngôn ngữ này yêu cầu gói Premium đang hoạt động.";

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    @PostConstruct
    void warnIfMissing() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: premium entitlement cannot be verified.");
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        if (GUIDE_PATH.equals(path) || path.startsWith(QR_PREFIX)) {
            return false;
        }
        if (!path.startsWith(POIS_PREFIX)) {
            return true;
        }
        String id = path.substring(POIS_PREFIX.length());
        return id.isEmpty() || !id.chars().allMatch(Character::isDigit);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean hasTrustedIdentity = request.getHeader(HEADER_USER_ID) != null
                || request.getHeader(HEADER_USER_PLAN) != null;
        boolean premium = false;
        if (hasTrustedIdentity) {
            if (isBlank(expectedApiKey)
                    || !constantTimeEquals(request.getHeader(HEADER_INTERNAL_API_KEY), expectedApiKey)) {
                reject(response, HttpServletResponse.SC_FORBIDDEN,
                        "Không thể xác minh quyền truy cập nội dung.");
                return;
            }
            premium = "PREMIUM".equalsIgnoreCase(request.getHeader(HEADER_USER_PLAN));
        }

        String lang = request.getParameter("lang");
        String normalized = lang == null || lang.isBlank() ? "vi" : lang.trim().toLowerCase();
        if (!"vi".equals(normalized) && !premium) {
            reject(response, HttpServletResponse.SC_FORBIDDEN, PREMIUM_REQUIRED_MESSAGE);
            return;
        }

        request.setAttribute(ATTRIBUTE_PREMIUM, premium);
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
