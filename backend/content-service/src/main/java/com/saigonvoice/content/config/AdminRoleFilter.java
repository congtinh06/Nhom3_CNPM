package com.saigonvoice.content.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Kiểm tra role của request tới các endpoint quản trị /api/admin/**.
 * Gateway xác thực và truyền role qua header X-User-Role.
 * Nếu không có role hoặc role != ADMIN -> từ chối 403 Forbidden.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class AdminRoleFilter extends OncePerRequestFilter {

    public static final String HEADER_ROLE = "X-User-Role";
    public static final String REQUIRED_ROLE = "ADMIN";
    private static final String ADMIN_PREFIX = "/api/admin/";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith(ADMIN_PREFIX) && !path.equals("/api/admin");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String role = request.getHeader(HEADER_ROLE);
        if (role == null || !REQUIRED_ROLE.equalsIgnoreCase(role.trim())) {
            log.warn("Access denied on admin path {} - missing or invalid {}: {}", 
                    request.getRequestURI(), HEADER_ROLE, role);
            reject(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden: ADMIN role required");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"Forbidden\",\"message\":\"" + message + "\"}");
    }
}
