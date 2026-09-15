package com.antiphishing.report.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        // Giới hạn: 5 requests / 1 phút
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))))
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String uri = req.getRequestURI();
        String method = req.getMethod();

        // Áp dụng chặt chẽ cho endpoint POST tạo báo cáo để chống spam
        if ("/api/v1/reports".equals(uri) && "POST".equalsIgnoreCase(method)) {
            String clientIp = getClientIp(req);
            Bucket bucket = buckets.computeIfAbsent(clientIp, k -> newBucket());

            if (!bucket.tryConsume(1)) {
                res.setStatus(429);
                res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"status\": 429, \"error\": \"Too Many Requests\", \"message\": \"Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút.\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
