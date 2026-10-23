package com.saigonvoice.auth.service;

import com.saigonvoice.auth.dto.AuthResponse;
import com.saigonvoice.auth.dto.CookieResult;
import com.saigonvoice.auth.dto.QrScanResponse;
import com.saigonvoice.auth.dto.QrSessionResponse;
import com.saigonvoice.auth.dto.QrStatusResponse;
import com.saigonvoice.auth.dto.UserResponse;
import com.saigonvoice.auth.entity.QrLoginSession;
import com.saigonvoice.auth.entity.QrLoginStatus;
import com.saigonvoice.auth.entity.User;
import com.saigonvoice.auth.entity.UserStatus;
import com.saigonvoice.auth.exception.BadRequestException;
import com.saigonvoice.auth.exception.ConflictException;
import com.saigonvoice.auth.exception.ForbiddenException;
import com.saigonvoice.auth.exception.NotFoundException;
import com.saigonvoice.auth.exception.UnauthorizedException;
import com.saigonvoice.auth.repository.QrLoginSessionRepository;
import com.saigonvoice.auth.repository.UserRepository;
import com.saigonvoice.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Dang nhap bang QR theo mo hinh 2 thiet bi:
 * <ul>
 *   <li>Thiet bi A (chua dang nhap) tao phien, hien thi ma QR.</li>
 *   <li>Thiet bi B (da dang nhap) quet ma, xac nhan tren man hinh.</li>
 *   <li>Thiet bi A poll trang thai; khi APPROVED thi doi lay session that.</li>
 * </ul>
 *
 * <p>Chi tai khoan ACTIVE va da xac thuc email moi duoc quet/xac nhan.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QrLoginService {

    private static final Set<QrLoginStatus> LIVE_STATUSES =
            EnumSet.of(QrLoginStatus.PENDING, QrLoginStatus.SCANNED, QrLoginStatus.APPROVED);
    private static final int CREATE_PER_MINUTE = 12;
    private static final int ACTIONS_PER_MINUTE = 30;
    private static final int EXCHANGE_PER_MINUTE = 20;

    private final QrLoginSessionRepository qrLoginSessionRepository;
    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;

    @Value("${app.qr.ttl:PT1M}")
    private Duration qrTtl;

    @Value("${app.qr.poll-interval-ms:1500}")
    private long pollIntervalMs;

    @Value("${app.qr.retention:P30D}")
    private Duration qrRetention;

    // ------------------------------------------------------------------ CREATE

    @Transactional
    public QrSessionResponse create(String ipAddress, String userAgent) {
        rateLimitService.assertAllowed(
                "qr-create|" + normalizeIp(ipAddress), CREATE_PER_MINUTE, Duration.ofMinutes(1));

        String qrToken = tokenService.newToken();
        String exchangeToken = tokenService.newToken();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plus(qrTtl);

        QrLoginSession session = QrLoginSession.builder()
                .id(UUID.randomUUID())
                .qrTokenHash(tokenService.sha256Hex(qrToken))
                .exchangeTokenHash(tokenService.sha256Hex(exchangeToken))
                .status(QrLoginStatus.PENDING)
                .createdIp(truncate(ipAddress, 45))
                .createdUserAgent(truncate(userAgent, 300))
                .expiresAt(expiresAt)
                .createdAt(now)
                .updatedAt(now)
                .build();
        qrLoginSessionRepository.save(session);

        return QrSessionResponse.builder()
                .sessionId(session.getId())
                .qrToken(qrToken)
                .exchangeToken(exchangeToken)
                .status(QrLoginStatus.PENDING)
                .expiresAt(expiresAt)
                .expiresInSeconds(secondsUntil(expiresAt))
                .pollIntervalMs(pollIntervalMs)
                .build();
    }

    // ------------------------------------------------------------------ STATUS

    @Transactional(readOnly = true)
    public QrStatusResponse status(UUID sessionId, String exchangeToken) {
        QrLoginSession session = findByExchangeToken(sessionId, exchangeToken);
        QrLoginStatus status = effectiveStatus(session);
        return QrStatusResponse.builder()
                .sessionId(session.getId())
                .status(status)
                .expiresAt(session.getExpiresAt())
                .expiresInSeconds(secondsUntil(session.getExpiresAt()))
                .message(statusMessage(status))
                .build();
    }

    // -------------------------------------------------------------------- SCAN

    @Transactional
    public QrScanResponse scan(String rawQrToken, Long userId, String ipAddress, String userAgent) {
        rateLimitService.assertAllowed(
                "qr-scan|" + userId, ACTIONS_PER_MINUTE, Duration.ofMinutes(1));

        QrLoginSession session = findByQrToken(rawQrToken);
        requireNotExpired(session);

        User user = requireEligibleUser(userId);

        if (session.getStatus() == QrLoginStatus.PENDING) {
            LocalDateTime now = LocalDateTime.now();
            session.setUser(user);
            session.setStatus(QrLoginStatus.SCANNED);
            session.setScannedAt(now);
            session.setUpdatedAt(now);
            qrLoginSessionRepository.save(session);
            log.info("QR login scanned sessionId={} userId={}", session.getId(), userId);
        } else if (session.getStatus() == QrLoginStatus.SCANNED
                || session.getStatus() == QrLoginStatus.APPROVED) {
            if (session.getUser() == null || !userId.equals(session.getUser().getId())) {
                throw new ConflictException("Ma QR nay da duoc thiet bi khac quet.");
            }
            // Quet lai cung mot tai khoan: idempotent.
        } else {
            throw new ConflictException("Ma QR nay khong con hieu luc.");
        }

        return QrScanResponse.builder()
                .sessionId(session.getId())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .deviceLabel(describeDevice(session.getCreatedUserAgent()))
                .build();
    }

    // ----------------------------------------------------------------- APPROVE

    @Transactional
    public QrScanResponse approve(String rawQrToken, Long userId, String ipAddress, String userAgent) {
        rateLimitService.assertAllowed(
                "qr-approve|" + userId, ACTIONS_PER_MINUTE, Duration.ofMinutes(1));

        QrLoginSession session = findByQrToken(rawQrToken);
        requireNotExpired(session);
        requireEligibleUser(userId);

        if (session.getStatus() == QrLoginStatus.APPROVED
                && session.getUser() != null && userId.equals(session.getUser().getId())) {
            return scanResponse(session);
        }
        if (session.getStatus() != QrLoginStatus.SCANNED) {
            throw new ConflictException("Vui long quet ma QR truoc khi xac nhan.");
        }
        if (session.getUser() == null || !userId.equals(session.getUser().getId())) {
            throw new ConflictException("Ma QR nay thuoc ve thiet bi khac.");
        }

        LocalDateTime now = LocalDateTime.now();
        session.setStatus(QrLoginStatus.APPROVED);
        session.setApprovedAt(now);
        session.setApprovedIp(truncate(ipAddress, 45));
        session.setApprovedUserAgent(truncate(userAgent, 300));
        session.setUpdatedAt(now);
        qrLoginSessionRepository.save(session);
        log.info("QR login approved sessionId={} userId={}", session.getId(), userId);

        return scanResponse(session);
    }

    // -------------------------------------------------------------------- DENY

    @Transactional
    public QrScanResponse deny(String rawQrToken, Long userId) {
        rateLimitService.assertAllowed(
                "qr-deny|" + userId, ACTIONS_PER_MINUTE, Duration.ofMinutes(1));

        QrLoginSession session = findByQrToken(rawQrToken);
        if (session.getStatus() == QrLoginStatus.DENIED) {
            return scanResponse(session);
        }
        if (session.getStatus() != QrLoginStatus.SCANNED
                && session.getStatus() != QrLoginStatus.PENDING) {
            throw new ConflictException("Ma QR nay khong con hieu luc.");
        }
        if (session.getUser() != null && !userId.equals(session.getUser().getId())) {
            throw new ConflictException("Ma QR nay thuoc ve thiet bi khac.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (session.getUser() == null) {
            session.setUser(requireEligibleUser(userId));
        }
        session.setStatus(QrLoginStatus.DENIED);
        session.setUpdatedAt(now);
        qrLoginSessionRepository.save(session);
        log.info("QR login denied sessionId={} userId={}", session.getId(), userId);

        return scanResponse(session);
    }

    // ---------------------------------------------------------------- EXCHANGE

    @Transactional
    public CookieResult exchange(UUID sessionId, String exchangeToken,
                                 String ipAddress, String userAgent) {
        rateLimitService.assertAllowed(
                "qr-exchange|" + normalizeIp(ipAddress), EXCHANGE_PER_MINUTE, Duration.ofMinutes(1));

        QrLoginSession session = findByExchangeToken(sessionId, exchangeToken);
        requireNotExpired(session);

        if (session.getStatus() != QrLoginStatus.APPROVED) {
            throw new ConflictException(switch (session.getStatus()) {
                case PENDING, SCANNED -> "Phien dang nhap QR chua duoc xac nhan.";
                case DENIED -> "Phien dang nhap QR da bi tu choi.";
                case CONSUMED -> "Phien dang nhap QR da duoc su dung.";
                case CANCELLED -> "Phien dang nhap QR da bi huy.";
                default -> "Phien dang nhap QR khong hop le.";
            });
        }

        LocalDateTime now = LocalDateTime.now();
        int consumed = qrLoginSessionRepository.consumeApproved(
                session.getId(), QrLoginStatus.APPROVED, QrLoginStatus.CONSUMED, now);
        if (consumed != 1) {
            throw new ConflictException("Phien dang nhap QR da duoc su dung.");
        }

        User user = session.getUser() == null
                ? null
                : userRepository.findById(session.getUser().getId()).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE || !user.isEmailVerified()) {
            throw new ForbiddenException("Tai khoan khong duoc phep dang nhap.");
        }

        user.setLastLoginAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);

        RefreshTokenService.Issued issued =
                refreshTokenService.issue(user, false, ipAddress, userAgent);
        String accessToken = jwtService.generateAccessToken(user);
        log.info("QR login exchanged sessionId={} userId={}", session.getId(), user.getId());

        return CookieResult.builder()
                .rawRefreshToken(issued.rawToken())
                .refreshTtl(issued.ttl())
                .body(AuthResponse.builder()
                        .accessToken(accessToken)
                        .expiresIn(jwtService.getAccessTtlSeconds())
                        .tokenType("Bearer")
                        .user(UserResponse.from(user))
                        .build())
                .build();
    }

    // ------------------------------------------------------------------ CANCEL

    @Transactional
    public void cancel(UUID sessionId, String exchangeToken) {
        QrLoginSession session = findByExchangeToken(sessionId, exchangeToken);
        if (session.getStatus() != QrLoginStatus.PENDING
                && session.getStatus() != QrLoginStatus.SCANNED) {
            return;
        }
        session.setStatus(QrLoginStatus.CANCELLED);
        session.setUpdatedAt(LocalDateTime.now());
        qrLoginSessionRepository.save(session);
    }

    // ---------------------------------------------------------------- CLEANUP

    @Scheduled(fixedDelayString = "${app.qr.cleanup-interval-ms:300000}")
    @Transactional
    public void cleanup() {
        LocalDateTime now = LocalDateTime.now();
        int expired = qrLoginSessionRepository.expireOverdue(LIVE_STATUSES, QrLoginStatus.EXPIRED, now);
        int deleted = qrLoginSessionRepository.deleteOlderThan(now.minus(qrRetention));
        if (expired > 0 || deleted > 0) {
            log.info("QR login cleanup: expired={} deleted={}", expired, deleted);
        }
    }

    // --------------------------------------------------------------- INTERNALS

    private QrLoginSession findByQrToken(String rawQrToken) {
        if (rawQrToken == null || rawQrToken.isBlank()) {
            throw new BadRequestException("Ma QR khong hop le.");
        }
        return qrLoginSessionRepository.findByQrTokenHash(tokenService.sha256Hex(rawQrToken.trim()))
                .orElseThrow(() -> new NotFoundException("Ma QR khong ton tai hoac da het han."));
    }

    private QrLoginSession findByExchangeToken(UUID sessionId, String exchangeToken) {
        if (sessionId == null || exchangeToken == null || exchangeToken.isBlank()) {
            throw new NotFoundException("Phien dang nhap QR khong ton tai.");
        }
        return qrLoginSessionRepository
                .findByIdAndExchangeTokenHash(sessionId, tokenService.sha256Hex(exchangeToken.trim()))
                .orElseThrow(() -> new NotFoundException("Phien dang nhap QR khong ton tai."));
    }

    private User requireEligibleUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Phien dang nhap khong hop le."));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("Tai khoan khong duoc phep dang nhap.");
        }
        if (!user.isEmailVerified()) {
            throw new ForbiddenException("Tai khoan chua xac thuc email.");
        }
        return user;
    }

    private void requireNotExpired(QrLoginSession session) {
        if (session.isExpired()) {
            throw new BadRequestException("Ma QR da het han. Vui long tao ma moi.");
        }
    }

    private QrLoginStatus effectiveStatus(QrLoginSession session) {
        if (session.isExpired() && LIVE_STATUSES.contains(session.getStatus())) {
            return QrLoginStatus.EXPIRED;
        }
        return session.getStatus();
    }

    private QrScanResponse scanResponse(QrLoginSession session) {
        return QrScanResponse.builder()
                .sessionId(session.getId())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .deviceLabel(describeDevice(session.getCreatedUserAgent()))
                .build();
    }

    private static String statusMessage(QrLoginStatus status) {
        return switch (status) {
            case PENDING -> "Dang cho quet ma QR.";
            case SCANNED -> "Da quet. Vui long xac nhan tren thiet bi di dong.";
            case APPROVED -> "Da xac nhan. Dang tao phien dang nhap.";
            case DENIED -> "Thiet bi di dong da tu choi dang nhap.";
            case CONSUMED -> "Phien dang nhap da duoc su dung.";
            case EXPIRED -> "Ma QR da het han.";
            case CANCELLED -> "Phien dang nhap da bi huy.";
        };
    }

    static String describeDevice(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Thiet bi khong xac dinh";
        }
        String ua = userAgent.toLowerCase(Locale.ROOT);
        String os = ua.contains("iphone") || ua.contains("ipad") ? "iOS"
                : ua.contains("android") ? "Android"
                : ua.contains("windows") ? "Windows"
                : ua.contains("mac os") || ua.contains("macintosh") ? "macOS"
                : ua.contains("linux") ? "Linux"
                : "Thiet bi khac";
        String browser = ua.contains("edg/") ? "Edge"
                : ua.contains("chrome/") || ua.contains("crios/") ? "Chrome"
                : ua.contains("firefox/") || ua.contains("fxios/") ? "Firefox"
                : ua.contains("safari/") ? "Safari"
                : "Trinh duyet khac";
        return browser + " - " + os;
    }

    private static long secondsUntil(LocalDateTime expiresAt) {
        if (expiresAt == null) {
            return 0;
        }
        long millis = Duration.between(LocalDateTime.now(), expiresAt).toMillis();
        return millis <= 0 ? 0 : (millis + 999) / 1000;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }

    private static String normalizeIp(String ipAddress) {
        return ipAddress == null || ipAddress.isBlank() ? "unknown" : ipAddress.trim();
    }
}
