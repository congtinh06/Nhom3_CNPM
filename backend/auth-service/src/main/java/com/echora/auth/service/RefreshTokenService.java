package com.echora.auth.service;

import com.echora.auth.entity.RefreshToken;
import com.echora.auth.entity.User;
import com.echora.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Vòng đời refresh token: phát hành, luân chuyển (rotation), thu hồi.
 *
 * <p>Database chỉ lưu SHA-256 của token. Token bị mang tới khi đã bị thu hồi được coi là
 * dấu hiệu token bị đánh cắp -> thu hồi TOÀN BỘ phiên của người dùng.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final TokenService tokenService;

    @Value("${app.refresh.ttl-days:7}")
    private long ttlDays;

    @Value("${app.refresh.remember-ttl-days:30}")
    private long rememberTtlDays;

    public record Issued(String rawToken, RefreshToken entity, Duration ttl) {
    }

    public Duration ttlFor(boolean rememberMe) {
        return Duration.ofDays(rememberMe ? rememberTtlDays : ttlDays);
    }

    @Transactional
    public Issued issue(User user, boolean rememberMe, String ipAddress, String userAgent) {
        String rawToken = tokenService.newToken();
        LocalDateTime now = LocalDateTime.now();
        Duration ttl = ttlFor(rememberMe);

        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenService.sha256Hex(rawToken))
                .expiresAt(now.plus(ttl))
                .ipAddress(truncate(ipAddress, 45))
                .userAgent(truncate(userAgent, 300))
                .createdAt(now)
                .build();
        repository.save(entity);
        return new Issued(rawToken, entity, ttl);
    }

    @Transactional
    public Optional<RefreshToken> findByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        return repository.findByTokenHash(tokenService.sha256Hex(rawToken.trim()));
    }

    /** "Ghi nhớ đăng nhập" được suy ra từ TTL còn lại so với TTL mặc định. */
    public boolean isRememberMe(RefreshToken token) {
        return token.getExpiresAt() != null
                && token.getCreatedAt() != null
                && token.getExpiresAt().isAfter(token.getCreatedAt().plus(ttlFor(false)));
    }

    @Transactional
    public void revoke(RefreshToken token, String reason) {
        if (token.isRevoked()) {
            return;
        }
        token.setRevokedAt(LocalDateTime.now());
        token.setRevokedReason(reason);
        repository.save(token);
    }

    @Transactional
    public int revokeAllForUser(Long userId, String reason) {
        int count = repository.revokeAllForUser(userId, LocalDateTime.now(), reason);
        if (count > 0) {
            log.info("Đã thu hồi {} phiên của userId={} (reason={})", count, userId, reason);
        }
        return count;
    }

    /**
     * Thu hồi mọi phiên ngoại trừ đúng phiên đang thao tác (xác định bằng token gốc
     * trong cookie). Không có cookie thì thu hồi tất cả.
     */
    @Transactional
    public int revokeAllExceptCurrent(Long userId, String currentRawToken, String reason) {
        List<RefreshToken> active = repository.findByUserIdAndRevokedAtIsNull(userId);
        if (currentRawToken == null || currentRawToken.isBlank()) {
            return revokeAllForUser(userId, reason);
        }
        String currentHash = tokenService.sha256Hex(currentRawToken.trim());
        LocalDateTime now = LocalDateTime.now();
        int revoked = 0;
        for (RefreshToken token : active) {
            if (!currentHash.equals(token.getTokenHash())) {
                token.setRevokedAt(now);
                token.setRevokedReason(reason);
                revoked++;
            }
        }
        if (revoked > 0) {
            repository.saveAll(active);
            log.info("Đã thu hồi {} phiên khác của userId={} (reason={})", revoked, userId, reason);
        }
        return revoked;
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
