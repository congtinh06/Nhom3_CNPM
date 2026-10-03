package com.saigonvoice.location.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    @Value("${verification.internal-api-key:}")
    private String expectedApiKey;

    // Whitelist health endpoint: Docker/K8s healthcheck không cần API key
    // (chỉ mở /actuator/health*, các endpoint actuator khác vẫn bắt xác thực)
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/actuator/health") || path.startsWith("/actuator/health/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Chỉ áp dụng xác thực nếu biến INTERNAL_API_KEY được cấu hình giá trị cụ thể
        if (expectedApiKey != null && !expectedApiKey.trim().isEmpty()) {
            String incomingKey = request.getHeader("X-Internal-Api-Key");
            if (incomingKey == null || !expectedApiKey.equals(incomingKey)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Unauthorized: Thiếu hoặc sai header X-Internal-Api-Key\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
