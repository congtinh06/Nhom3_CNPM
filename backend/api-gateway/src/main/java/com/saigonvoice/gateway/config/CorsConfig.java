package com.saigonvoice.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class CorsConfig {

    // Comma-separated list (env FRONTEND_URLS). When blank, falls back to frontendUrl (env FRONTEND_URL).
    @Value("${frontend.urls:}")
    private String frontendUrls;

    @Value("${frontend.url:}")
    private String frontendUrl;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        Set<String> allowedOrigins = new LinkedHashSet<>();
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://localhost:8088");
        allowedOrigins.add("http://127.0.0.1:8088");

        String configured = (frontendUrls != null && !frontendUrls.isBlank()) ? frontendUrls : frontendUrl;
        if (configured != null) {
            for (String origin : configured.split(",")) {
                String trimmed = origin.trim();
                // Never allow "*" together with allowCredentials=true
                if (!trimmed.isEmpty() && !trimmed.contains("*")) {
                    allowedOrigins.add(trimmed);
                }
            }
        }

        config.setAllowedOrigins(new ArrayList<>(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Content-Type",
                "Authorization",
                "Accept",
                "Origin",
                "X-Requested-With",
                "ngrok-skip-browser-warning"
        ));
        config.setExposedHeaders(List.of("Retry-After"));
        // BẮT BUỘC true để trình duyệt nhận được cookie refresh (HttpOnly) từ /api/auth/**.
        // Chỉ an toàn vì allowedOrigins là danh sách tường minh, không phải "*".
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
