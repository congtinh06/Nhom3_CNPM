package com.echora.auth.controller;

import com.echora.auth.dto.AuthResponse;
import com.echora.auth.dto.ChangePasswordRequest;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.EmailOnlyRequest;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.ResetPasswordRequest;
import com.echora.auth.dto.UserResponse;
import com.echora.auth.dto.VerifyEmailRequest;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @Value("${app.refresh.cookie-name:refresh_token}")
    private String refreshCookieName;

    @Value("${app.refresh.cookie-path:/api/auth}")
    private String refreshCookiePath;

    @Value("${app.refresh.cookie-secure:true}")
    private boolean refreshCookieSecure;

    @Value("${app.refresh.cookie-samesite:Strict}")
    private String refreshCookieSameSite;

    // ------------------------------------------------------------- REGISTER

    @PostMapping("/api/auth/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request,
                                                    HttpServletRequest httpRequest) {
        MessageResponse response = authService.register(request, clientIp(httpRequest), userAgent(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ---------------------------------------------------------------- LOGIN

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        CookieResult result = authService.login(request, clientIp(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result).toString())
                .body(result.getBody());
    }

    @PostMapping("/api/auth/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request,
                                                        HttpServletRequest httpRequest) {
        CookieResult result = authService.loginWithGoogle(request, clientIp(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result).toString())
                .body(result.getBody());
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest httpRequest) {
        String rawToken = readRefreshCookie(httpRequest);
        CookieResult result = authService.refresh(rawToken, clientIp(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result).toString())
                .body(result.getBody());
    }

    // --------------------------------------------------------------- LOGOUT

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        authService.logout(readRefreshCookie(httpRequest));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @PostMapping("/api/auth/logout-all")
    public ResponseEntity<Void> logoutAll() {
        authService.logoutAll(currentUserId());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    // --------------------------------------------------------- EMAIL VERIFY

    @PostMapping("/api/auth/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/api/auth/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody EmailOnlyRequest request,
                                                              HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.resendVerification(request.getEmail(), clientIp(httpRequest)));
    }

    // ----------------------------------------------------- FORGOT / RESET PW

    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody EmailOnlyRequest request,
                                                          HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail(), clientIp(httpRequest)));
    }

    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại."));
    }

    @PostMapping("/api/auth/change-password")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                          HttpServletRequest httpRequest) {
        authService.changePassword(currentUserId(), request, readRefreshCookie(httpRequest));
        return ResponseEntity.ok(new MessageResponse("Đổi mật khẩu thành công."));
    }

    // -------------------------------------------------------------- ME/ADMIN

    @GetMapping("/api/auth/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(authService.me(currentUserId()));
    }

    // -------------------------------------------------------------- INTERNAL

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return principal.id();
    }

    private String readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (refreshCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private org.springframework.http.ResponseCookie refreshCookie(CookieResult result) {
        return org.springframework.http.ResponseCookie.from(refreshCookieName, result.getRawRefreshToken())
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .maxAge(result.getRefreshTtl() == null ? Duration.ofDays(7) : result.getRefreshTtl())
                .sameSite(refreshCookieSameSite)
                .build();
    }

    private org.springframework.http.ResponseCookie clearRefreshCookie() {
        return org.springframework.http.ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .maxAge(Duration.ZERO)
                .sameSite(refreshCookieSameSite)
                .build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        return request.getRemoteAddr();
    }

    private String userAgent(HttpServletRequest request) {
        String value = request.getHeader("User-Agent");
        return value == null ? null : value.trim();
    }
}
