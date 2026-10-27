package com.echora.auth.service;

import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.QrScanResponse;
import com.echora.auth.entity.QrLoginSession;
import com.echora.auth.entity.QrLoginStatus;
import com.echora.auth.entity.User;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.exception.BadRequestException;
import com.echora.auth.exception.ConflictException;
import com.echora.auth.exception.ForbiddenException;
import com.echora.auth.exception.NotFoundException;
import com.echora.auth.repository.QrLoginSessionRepository;
import com.echora.auth.repository.UserRepository;
import com.echora.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QrLoginServiceTest {

    private static final String RAW_QR_TOKEN = "raw-qr-token";
    private static final String RAW_EXCHANGE_TOKEN = "raw-exchange-token";
    private static final String IP = "1.2.3.4";
    private static final String USER_AGENT = "Mozilla/5.0 (iPhone)";

    private final QrLoginSessionRepository qrLoginSessionRepository = mock(QrLoginSessionRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final TokenService tokenService = new TokenService();
    private final RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final RateLimitService rateLimitService = mock(RateLimitService.class);

    private QrLoginService service;

    @BeforeEach
    void setUp() {
        service = new QrLoginService(
                qrLoginSessionRepository,
                userRepository,
                tokenService,
                refreshTokenService,
                jwtService,
                rateLimitService);
        ReflectionTestUtils.setField(service, "qrTtl", Duration.ofMinutes(1));
        ReflectionTestUtils.setField(service, "pollIntervalMs", 1500L);
        ReflectionTestUtils.setField(service, "qrRetention", Duration.ofDays(30));
    }

    private QrLoginSession liveSession(QrLoginStatus status) {
        return QrLoginSession.builder()
                .id(UUID.randomUUID())
                .qrTokenHash(tokenService.sha256Hex(RAW_QR_TOKEN))
                .exchangeTokenHash(tokenService.sha256Hex(RAW_EXCHANGE_TOKEN))
                .status(status)
                .expiresAt(LocalDateTime.now().plusMinutes(1))
                .createdAt(LocalDateTime.now().minusSeconds(5))
                .updatedAt(LocalDateTime.now().minusSeconds(5))
                .build();
    }

    private User eligibleUser() {
        return User.builder()
                .id(42L)
                .fullName("Khach That")
                .email("khach@echora.local")
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    private void stubFindSession(QrLoginSession session) {
        when(qrLoginSessionRepository.findByQrTokenHash(tokenService.sha256Hex(RAW_QR_TOKEN)))
                .thenReturn(Optional.of(session));
    }

    // ---------------------------------------------------------------- GUEST SCAN

    @Test
    @DisplayName("guestScan chuyển phiên PENDING sang GUEST_APPROVED và không gán user")
    void guestScanPendingBecomesGuestApproved() {
        QrLoginSession session = liveSession(QrLoginStatus.PENDING);
        stubFindSession(session);

        QrScanResponse response = service.guestScan(RAW_QR_TOKEN, IP, USER_AGENT);

        assertThat(response.getStatus()).isEqualTo(QrLoginStatus.GUEST_APPROVED);
        assertThat(session.getStatus()).isEqualTo(QrLoginStatus.GUEST_APPROVED);
        assertThat(session.getUser()).isNull();
        assertThat(session.getScannedAt()).isNotNull();
        assertThat(session.getApprovedIp()).isEqualTo(IP);
        verify(qrLoginSessionRepository).save(session);
    }

    @Test
    @DisplayName("guestScan idempotent khi phiên đã ở GUEST_APPROVED")
    void guestScanIdempotent() {
        QrLoginSession session = liveSession(QrLoginStatus.GUEST_APPROVED);
        stubFindSession(session);

        QrScanResponse response = service.guestScan(RAW_QR_TOKEN, IP, USER_AGENT);

        assertThat(response.getStatus()).isEqualTo(QrLoginStatus.GUEST_APPROVED);
        assertThat(session.getStatus()).isEqualTo(QrLoginStatus.GUEST_APPROVED);
        verify(qrLoginSessionRepository, never()).save(any(QrLoginSession.class));
    }

    @Test
    @DisplayName("guestScan từ chối phiên đã bị chiếm bởi luồng tài khoản thật")
    void guestScanRejectsNonLiveSession() {
        for (QrLoginStatus status : new QrLoginStatus[] {
                QrLoginStatus.APPROVED, QrLoginStatus.DENIED, QrLoginStatus.CONSUMED, QrLoginStatus.CANCELLED }) {
            QrLoginSession session = liveSession(status);
            stubFindSession(session);
            assertThatThrownBy(() -> service.guestScan(RAW_QR_TOKEN, IP, USER_AGENT))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("khong con hieu luc");
        }
    }

    @Test
    @DisplayName("guestScan báo lỗi khi phiên hết hạn và khi không tìm thấy token")
    void guestScanRejectsExpiredOrUnknownToken() {
        QrLoginSession expired = liveSession(QrLoginStatus.PENDING);
        expired.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        stubFindSession(expired);
        assertThatThrownBy(() -> service.guestScan(RAW_QR_TOKEN, IP, USER_AGENT))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("het han");

        assertThatThrownBy(() -> service.guestScan("  ", IP, USER_AGENT))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.guestScan("token-no-anywhere", IP, USER_AGENT))
                .isInstanceOf(NotFoundException.class);
    }

    // -------------------------------------------------- LUỒNG TÀI KHOẢN THẬT

    @Test
    @DisplayName("scan từ chối tài khoản chưa xác thực email (bắt buộc tài khoản thật phải verify)")
    void scanRejectsUnverifiedUser() {
        User unverified = eligibleUser();
        unverified.setEmailVerifiedAt(null);
        QrLoginSession session = liveSession(QrLoginStatus.PENDING);
        stubFindSession(session);
        when(userRepository.findById(42L)).thenReturn(Optional.of(unverified));

        assertThatThrownBy(() -> service.scan(RAW_QR_TOKEN, 42L, IP, USER_AGENT))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("xac thuc email");
    }

    @Test
    @DisplayName("approve từ chối phiên GUEST_APPROVED (phiên khách không thể nâng cấp thành tài khoản thật)")
    void approveRejectsGuestSession() {
        QrLoginSession session = liveSession(QrLoginStatus.GUEST_APPROVED);
        stubFindSession(session);
        when(userRepository.findById(42L)).thenReturn(Optional.of(eligibleUser()));

        assertThatThrownBy(() -> service.approve(RAW_QR_TOKEN, 42L, IP, USER_AGENT))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("quet ma QR truoc khi xac nhan");
    }

    @Test
    @DisplayName("deny từ chối phiên GUEST_APPROVED")
    void denyRejectsGuestSession() {
        QrLoginSession session = liveSession(QrLoginStatus.GUEST_APPROVED);
        session.setUser(null);
        stubFindSession(session);
        when(userRepository.findById(42L)).thenReturn(Optional.of(eligibleUser()));

        assertThatThrownBy(() -> service.deny(RAW_QR_TOKEN, 42L))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("exchange từ chối phiên GUEST_APPROVED vì không phải APPROVED")
    void exchangeRejectsGuestSession() {
        QrLoginSession session = liveSession(QrLoginStatus.GUEST_APPROVED);
        when(qrLoginSessionRepository.findByIdAndExchangeTokenHash(session.getId(),
                tokenService.sha256Hex(RAW_EXCHANGE_TOKEN))).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> service.exchange(session.getId(), RAW_EXCHANGE_TOKEN, IP, USER_AGENT))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("che do khach");
    }

    @Test
    @DisplayName("Luồng tài khoản thật: scan -> approve -> exchange cấp session thật và consumeApproved")
    void realAccountHappyPath() {
        User user = eligibleUser();
        QrLoginSession session = liveSession(QrLoginStatus.PENDING);
        stubFindSession(session);
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        QrScanResponse scanned = service.scan(RAW_QR_TOKEN, 42L, IP, USER_AGENT);
        assertThat(scanned.getStatus()).isEqualTo(QrLoginStatus.SCANNED);
        assertThat(session.getUser()).isEqualTo(user);

        QrScanResponse approved = service.approve(RAW_QR_TOKEN, 42L, IP, USER_AGENT);
        assertThat(approved.getStatus()).isEqualTo(QrLoginStatus.APPROVED);
        verify(jwtService, never()).generateAccessToken(any(User.class));

        when(refreshTokenService.issue(eq(user), eq(false), eq(IP), eq(USER_AGENT)))
                .thenReturn(new RefreshTokenService.Issued("raw-refresh", null, Duration.ofDays(7)));
        when(jwtService.generateAccessToken(user)).thenReturn("access-jwt");
        when(jwtService.getAccessTtlSeconds()).thenReturn(900L);
        when(qrLoginSessionRepository.findByIdAndExchangeTokenHash(
                eq(session.getId()), eq(tokenService.sha256Hex(RAW_EXCHANGE_TOKEN))))
                .thenReturn(Optional.of(session));
        when(qrLoginSessionRepository.consumeApproved(
                eq(session.getId()), eq(QrLoginStatus.APPROVED), eq(QrLoginStatus.CONSUMED), any(LocalDateTime.class)))
                .thenReturn(1);

        CookieResult result = service.exchange(session.getId(), RAW_EXCHANGE_TOKEN, IP, USER_AGENT);

        assertThat(result.getRawRefreshToken()).isEqualTo("raw-refresh");
        assertThat(result.getBody().getAccessToken()).isEqualTo("access-jwt");
        assertThat(user.getLastLoginAt()).isNotNull();
        verify(jwtService).generateAccessToken(user);
    }

    // ------------------------------------------------------------------ CLEANUP

    @Test
    @DisplayName("cleanup đưa cả GUEST_APPROVED vào tập phiên sống để tự hết hạn")
    void cleanupCoversGuestApproved() {
        service.cleanup();

        ArgumentCaptor<EnumSet<QrLoginStatus>> captor = ArgumentCaptor.forClass(EnumSet.class);
        verify(qrLoginSessionRepository).expireOverdue(captor.capture(),
                eq(QrLoginStatus.EXPIRED), any(LocalDateTime.class));
        assertThat(captor.getValue()).contains(QrLoginStatus.GUEST_APPROVED);
        verify(qrLoginSessionRepository).deleteOlderThan(any(LocalDateTime.class));
    }
}
