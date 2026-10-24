package com.echora.content.config;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Bảo vệ endpoint nội bộ /api/content/internal/** (location-service gọi qua Feign).
 * FAIL-CLOSED: nếu internal.api-key rỗng thì endpoint nội bộ bị TẮT (503), không mở tự do.
 * Endpoint public và /actuator/health không bị ảnh hưởng.
 */
@Component
@Slf4j
public class InternalApiKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Internal-Api-Key";
    static final String INTERNAL_PREFIX = "/api/content/internal/";

    @Value("${internal.api-key:}")
    private String expectedApiKey;

    @PostConstruct
    void warnIfMissing() {
        if (isBlank(expectedApiKey)) {
            log.warn("internal.api-key (INTERNAL_API_KEY) is empty: {}** endpoints are DISABLED (HTTP 503)", INTERNAL_PREFIX);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(INTERNAL_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (isBlank(expectedApiKey)) {
            reject(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Internal API key is not configured");
            return;
        }
        String incoming = request.getHeader(HEADER);
        if (incoming == null || !MessageDigest.isEqual(
                incoming.getBytes(StandardCharsets.UTF_8), expectedApiKey.getBytes(StandardCharsets.UTF_8))) {
            reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid " + HEADER);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"" + message + "\"}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
