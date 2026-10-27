package com.echora.auth.controller;

import com.echora.auth.dto.AuthResponse;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.QrScanRequest;
import com.echora.auth.dto.QrScanResponse;
import com.echora.auth.dto.QrSessionResponse;
import com.echora.auth.dto.QrStatusResponse;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.security.UserPrincipal;
import com.echora.auth.service.QrLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class QrLoginController {

    public static final String EXCHANGE_TOKEN_HEADER = "X-QR-Exchange-Token";

    private final QrLoginService qrLoginService;

    @Value("${app.refresh.cookie-name:echora_user_token}")
    private String refreshCookieName;

    @Value("${app.refresh.cookie-path:/api/auth}")
    private String refreshCookiePath;

    @Value("${app.refresh.cookie-secure:true}")
    private boolean refreshCookieSecure;

    @Value("${app.refresh.cookie-samesite:Strict}")
    private String refreshCookieSameSite;

    @PostMapping("/api/auth/qr/sessions")
    public ResponseEntity<QrSessionResponse> create(HttpServletRequest request) {
        QrSessionResponse response = qrLoginService.create(clientIp(request), userAgent(request));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/auth/qr/sessions/{sessionId}")
    public ResponseEntity<QrStatusResponse> status(
            @PathVariable UUID sessionId,
            @RequestHeader(name = EXCHANGE_TOKEN_HEADER, required = false) String exchangeToken) {
        return ResponseEntity.ok(qrLoginService.status(sessionId, exchangeToken));
    }

    @PostMapping("/api/auth/qr/sessions/scan")
    public ResponseEntity<QrScanResponse> scan(@Valid @RequestBody QrScanRequest request,
                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(qrLoginService.scan(
                request.getQrToken(), currentUserId(), clientIp(httpRequest), userAgent(httpRequest)));
    }

    @PostMapping("/api/auth/qr/sessions/guest-scan")
    public ResponseEntity<QrScanResponse> guestScan(@Valid @RequestBody QrScanRequest request,
                                                    HttpServletRequest httpRequest) {
        return ResponseEntity.ok(qrLoginService.guestScan(
                request.getQrToken(), clientIp(httpRequest), userAgent(httpRequest)));
    }

    @PostMapping("/api/auth/qr/sessions/approve")
    public ResponseEntity<QrScanResponse> approve(@Valid @RequestBody QrScanRequest request,
                                                  HttpServletRequest httpRequest) {
        return ResponseEntity.ok(qrLoginService.approve(
                request.getQrToken(), currentUserId(), clientIp(httpRequest), userAgent(httpRequest)));
    }

    @PostMapping("/api/auth/qr/sessions/deny")
    public ResponseEntity<QrScanResponse> deny(@Valid @RequestBody QrScanRequest request) {
        return ResponseEntity.ok(qrLoginService.deny(request.getQrToken(), currentUserId()));
    }

    @PostMapping("/api/auth/qr/sessions/{sessionId}/exchange")
    public ResponseEntity<AuthResponse> exchange(
            @PathVariable UUID sessionId,
            @RequestHeader(name = EXCHANGE_TOKEN_HEADER, required = false) String exchangeToken,
            HttpServletRequest httpRequest) {
        CookieResult result = qrLoginService.exchange(
                sessionId, exchangeToken, clientIp(httpRequest), userAgent(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result).toString())
                .body(result.getBody());
    }

    @PostMapping("/api/auth/qr/sessions/{sessionId}/cancel")
    public ResponseEntity<Void> cancel(
            @PathVariable UUID sessionId,
            @RequestHeader(name = EXCHANGE_TOKEN_HEADER, required = false) String exchangeToken) {
        qrLoginService.cancel(sessionId, exchangeToken);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Phien dang nhap khong hop le hoac da het han.");
        }
        return principal.id();
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
