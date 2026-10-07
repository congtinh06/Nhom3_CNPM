package com.saigonvoice.auth.security;

import com.saigonvoice.auth.entity.UserRole;
import com.saigonvoice.auth.entity.UserStatus;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Đọc header {@code Authorization: Bearer <token>}, xác thực và nạp SecurityContext.
 * Token không hợp lệ thì chỉ bỏ qua, không ném lỗi (để entry point trả 401 khi cần).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            String token = header.substring(BEARER_PREFIX.length()).trim();
            if (!token.isEmpty() && SecurityContextHolder.getContext().getAuthentication() == null) {
                toPrincipal(token).ifPresent(principal -> {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.authorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            }
        }
        filterChain.doFilter(request, response);
    }

    private Optional<UserPrincipal> toPrincipal(String token) {
        return jwtService.verify(token).map(claims -> {
            Long userId = parseUserId(claims);
            UserRole role = parseEnum(claims.get(JwtService.CLAIM_ROLE, String.class), UserRole.class, UserRole.USER);
            UserStatus status = parseEnum(claims.get(JwtService.CLAIM_STATUS, String.class), UserStatus.class, UserStatus.PENDING);
            if (userId == null || status != UserStatus.ACTIVE) {
                return null;
            }
            return new UserPrincipal(userId, claims.get(JwtService.CLAIM_EMAIL, String.class), role, status);
        }).filter(java.util.Objects::nonNull);
    }

    private Long parseUserId(Claims claims) {
        try {
            return Long.valueOf(claims.getSubject());
        } catch (NumberFormatException | NullPointerException ex) {
            return null;
        }
    }

    private <E extends Enum<E>> E parseEnum(String raw, Class<E> type, E fallback) {
        if (raw == null) {
            return fallback;
        }
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }
}
