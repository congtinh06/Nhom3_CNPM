package com.saigonvoice.auth.config;

import com.saigonvoice.auth.security.JwtAuthenticationFilter;
import com.saigonvoice.auth.security.RestAccessDeniedHandler;
import com.saigonvoice.auth.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cấu hình bảo mật cho auth-service:
 * - Stateless (không session của Spring Security, toàn bộ phiên nằm ở JWT + refresh token cookie).
 * - CSRF tắt vì access token gửi qua header Bearer; cookie refresh được bảo vệ bởi
 *   SameSite=Strict + {@link OriginCheckFilter} (xem {@code app.refresh.cookie-samesite}).
 * - Các endpoint công khai liệt kê tường minh, phần còn lại của /api/auth bắt buộc đăng nhập.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final InternalApiKeyFilter internalApiKeyFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    /** Cost 12: an toàn hơn mặc định 10 mà vẫn chấp nhận được trên CPU hiện đại. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        // Công khai: không cần access token
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/google",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/verify-email",
                                "/api/auth/resend-verification",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/qr/sessions",
                                "/api/auth/qr/sessions/*/exchange",
                                "/api/auth/qr/sessions/*/cancel").permitAll()
                        // Thiet bi A (chua dang nhap) poll trang thai phien QR.
                        .requestMatchers(HttpMethod.GET, "/api/auth/qr/sessions/*").permitAll()
                        .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auth/internal/**").permitAll()
                        .requestMatchers("/api/auth/**").authenticated()
                        // Không có controller nào khác; để mở cho /error dispatch
                        .anyRequest().permitAll())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(internalApiKeyFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
