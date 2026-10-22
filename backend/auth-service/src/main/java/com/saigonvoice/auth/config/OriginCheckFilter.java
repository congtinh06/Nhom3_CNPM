package com.saigonvoice.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Chống CSRF cho các endpoint nhận cookie refresh token.
 *
 * <p>Nguyên tắc: request POST/PUT/PATCH/DELETE tới {@code /api/auth/**} mà mang header
 * {@code Origin} thì Origin phải nằm trong danh sách cho phép (FRONTEND_URL).
 * Request không có Origin (curl, Postman, server-to-server) được cho qua — trình duyệt
 * luôn gửi Origin cho mọi request cross-site nên Tin tặc không thể lợi dụng.</p>
 *
 * <p>Chống thêm lớp: refresh cookie đặt {@code SameSite=Strict} nên trình duyệt không
 * gửi cookie cho bất kỳ request cross-site nào.</p>
 */
@Component
public class OriginCheckFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(OriginCheckFilter.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String PROTECTED_PATH_PREFIX = "/api/auth";

    private final Set<String> allowedOrigins = new LinkedHashSet<>();

    public OriginCheckFilter(@Value("${app.security.frontend-url:}") String frontendUrl) {
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://localhost:8088");
        allowedOrigins.add("http://127.0.0.1:8088");
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            allowedOrigins.add(frontendUrl.trim());
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (isProtected(request) && isStateChanging(request.getMethod())) {
            String origin = request.getHeader("Origin");
            if (origin != null && !origin.isBlank() && !"null".equals(origin.trim())
                    && !allowedOrigins.contains(origin.trim())) {
                log.warn("Blocked cross-origin {} {} from origin '{}'", request.getMethod(), request.getRequestURI(), origin);
                writeForbidden(request, response);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private boolean isProtected(HttpServletRequest request) {
        return request.getRequestURI() != null && request.getRequestURI().startsWith(PROTECTED_PATH_PREFIX);
    }

    private boolean isStateChanging(String method) {
        return HttpMethod.POST.matches(method)
                || HttpMethod.PUT.matches(method)
                || HttpMethod.PATCH.matches(method)
                || HttpMethod.DELETE.matches(method);
    }

    private void writeForbidden(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpServletResponse.SC_FORBIDDEN);
        body.put("error", "Forbidden");
        body.put("message", "Origin không được phép.");
        body.put("path", request.getRequestURI());
        MAPPER.writeValue(response.getWriter(), body);
    }
}
