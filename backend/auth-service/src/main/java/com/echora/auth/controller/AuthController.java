package com.echora.auth.controller;

import com.echora.auth.dto.AuthResponse;
import com.echora.auth.dto.ChangePasswordRequest;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.EmailOnlyRequest;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MeEntitlementResponse;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.ResetPasswordRequest;
import com.echora.auth.dto.UserResponse;
import com.echora.auth.dto.UpdateProfileRequest;
import com.echora.auth.dto.VerifyEmailRequest;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.AuthService;
import com.echora.auth.support.ClientIpResolver;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final ClientIpResolver clientIpResolver;

    private static final String HEADER_AUTH_SCOPE = "X-Auth-Scope";
    private static final String AUTH_SCOPE_ADMIN = "admin";

    @Value("${app.refresh.cookie-name:echora_user_token}")
    private String refreshCookieName;

    @Value("${app.refresh.admin-cookie-name:echora_admin_token}")
    private String adminRefreshCookieName;

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
        MessageResponse response = authService.register(request, clientIpResolver.resolve(httpRequest), userAgent(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ---------------------------------------------------------------- LOGIN

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        CookieResult result = authService.login(request, clientIpResolver.resolve(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result, httpRequest).toString())
                .body(result.getBody());
    }

    @PostMapping("/api/auth/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request,
                                                        HttpServletRequest httpRequest) {
        CookieResult result = authService.loginWithGoogle(request, clientIpResolver.resolve(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result, httpRequest).toString())
                .body(result.getBody());
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest httpRequest) {
        String rawToken = readRefreshCookie(httpRequest);
        CookieResult result = authService.refresh(rawToken, clientIpResolver.resolve(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result, httpRequest).toString())
                .body(result.getBody());
    }

    // --------------------------------------------------------------- LOGOUT

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        authService.logout(readRefreshCookie(httpRequest));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie(httpRequest).toString())
                .build();
    }

    @PostMapping("/api/auth/logout-all")
    public ResponseEntity<Void> logoutAll(HttpServletRequest httpRequest) {
        authService.logoutAll(currentUserId());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie(httpRequest).toString())
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
        return ResponseEntity.ok(authService.resendVerification(request.getEmail(), clientIpResolver.resolve(httpRequest)));
    }

    // ----------------------------------------------------- FORGOT / RESET PW

    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody EmailOnlyRequest request,
                                                          HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail(), clientIpResolver.resolve(httpRequest)));
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

    @PutMapping("/api/auth/me/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(currentUserId(), request));
    }

    // Gói Premium toàn tài khoản + các POI đã mua lẻ (dùng cho trang tài khoản & khóa chap).
    @GetMapping({"/api/auth/me/entitlements", "/me/entitlements", "/api/me/entitlements"})
    public ResponseEntity<MeEntitlementResponse> meEntitlements() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return ResponseEntity.ok(MeEntitlementResponse.builder()
                    .plan("FREE")
                    .premiumActive(false)
                    .premium(false)
                    .unlockedPoiIds(List.of())
                    .purchasedPois(List.of())
                    .hasAnyPurchase(false)
                    .build());
        }
        return ResponseEntity.ok(authService.meEntitlement(principal.id()));
    }

    // -------------------------------------------------------------- INTERNAL

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        return principal.id();
    }

    /**
     * Trình duyệt gửi kèm X-Auth-Scope khi gọi từ khu vực quản trị. Nhờ đó phiên
     * admin dùng cookie refresh riêng và không đăng nhập chéo sang trang du khách.
     */
    private String resolveRefreshCookieName(HttpServletRequest request) {
        String scope = request.getHeader(HEADER_AUTH_SCOPE);
        if (AUTH_SCOPE_ADMIN.equalsIgnoreCase(scope)) {
            return adminRefreshCookieName == null || adminRefreshCookieName.isBlank()
                    ? refreshCookieName
                    : adminRefreshCookieName;
        }
        return refreshCookieName;
    }

    private String readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        String cookieName = resolveRefreshCookieName(request);
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private org.springframework.http.ResponseCookie refreshCookie(CookieResult result,
                                                                 HttpServletRequest request) {
        return org.springframework.http.ResponseCookie.from(resolveRefreshCookieName(request),
                        result.getRawRefreshToken())
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .maxAge(result.getRefreshTtl() == null ? Duration.ofDays(7) : result.getRefreshTtl())
                .sameSite(refreshCookieSameSite)
                .build();
    }

    private org.springframework.http.ResponseCookie clearRefreshCookie(HttpServletRequest request) {
        return org.springframework.http.ResponseCookie.from(resolveRefreshCookieName(request), "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .path(refreshCookiePath)
                .maxAge(Duration.ZERO)
                .sameSite(refreshCookieSameSite)
                .build();
    }

    private String userAgent(HttpServletRequest request) {
        String value = request.getHeader("User-Agent");
        return value == null ? null : value.trim();
    }
}
