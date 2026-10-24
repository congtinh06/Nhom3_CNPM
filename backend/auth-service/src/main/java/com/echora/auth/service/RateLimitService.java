package com.echora.auth.service;

import com.echora.auth.entity.AuthRateLimit;
import com.echora.auth.exception.TooManyRequestsException;
import com.echora.auth.repository.AuthRateLimitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Chống brute force và rate limit dựa trên bảng {@code auth_rate_limit} (survive khi restart).
 *
 * <ul>
 *   <li>Đăng nhập sai 5 lần liên tiếp (email + IP) -> khóa 15 phút.</li>
 *   <li>Một IP sai quá nhiều lần trong cửa sổ -> chặn toàn cục theo IP.</li>
 *   <li>Đăng ký / quên mật khẩu: giới hạn theo IP theo giờ.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private final AuthRateLimitRepository repository;

    @Transactional
    public void assertNotLocked(String bucketKey) {
        LocalDateTime now = LocalDateTime.now();
        repository.findByBucketKey(bucketKey)
                .filter(row -> row.getLockedUntil() != null && row.getLockedUntil().isAfter(now))
                .ifPresent(row -> {
                    long seconds = Math.max(1, Duration.between(now, row.getLockedUntil()).getSeconds());
                    log.warn("Bucket '{}' đang bị khóa thêm {} giây", bucketKey, seconds);
                    throw new TooManyRequestsException(
                            "Quá nhiều lần thử. Vui lòng thử lại sau ít phút.", seconds);
                });
    }

    /**
     * Ghi một lần thất bại. Khi chạm ngưỡng {@code maxHits} trong {@code window}
     * thì khóa bucket trong {@code lockDuration}.
     *
     * @return số giây bị khóa (0 nếu không bị khóa).
     */
    @Transactional
    public long recordFailure(String bucketKey, int maxHits, Duration window, Duration lockDuration) {
        LocalDateTime now = LocalDateTime.now();
        AuthRateLimit row = repository.findByBucketKey(bucketKey).orElseGet(AuthRateLimit::new);

        boolean expired = row.getWindowStart() == null || row.getWindowStart().plus(window).isBefore(now);
        if (expired) {
            row.setWindowStart(now);
            row.setHitCount(1);
        } else {
            row.setHitCount(row.getHitCount() + 1);
        }
        row.setBucketKey(bucketKey);
        row.setLockedUntil(null);
        row.setUpdatedAt(now);

        long lockedSeconds = 0;
        if (row.getHitCount() >= maxHits) {
            row.setLockedUntil(now.plus(lockDuration));
            lockedSeconds = lockDuration.toSeconds();
            log.warn("Bucket '{}' chạm ngưỡng {} lần thất bại, khóa {} giây", bucketKey, maxHits, lockedSeconds);
        }
        repository.save(row);
        return lockedSeconds;
    }

    /** Bộ đếm theo cửa sổ cố định (dùng cho register / forgot-password / resend). */
    @Transactional
    public void assertAllowed(String bucketKey, int maxHits, Duration window) {
        LocalDateTime now = LocalDateTime.now();
        AuthRateLimit row = repository.findByBucketKey(bucketKey).orElseGet(AuthRateLimit::new);

        boolean expired = row.getWindowStart() == null || row.getWindowStart().plus(window).isBefore(now);
        if (expired) {
            row.setWindowStart(now);
            row.setHitCount(1);
            row.setBucketKey(bucketKey);
            row.setUpdatedAt(now);
            repository.save(row);
            return;
        }

        if (row.getHitCount() >= maxHits) {
            long seconds = Math.max(1, Duration.between(now, row.getWindowStart().plus(window)).getSeconds());
            throw new TooManyRequestsException("Bạn gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau.", seconds);
        }

        row.setHitCount(row.getHitCount() + 1);
        row.setBucketKey(bucketKey);
        row.setUpdatedAt(now);
        repository.save(row);
    }

    /** Xóa bộ đếm khi thao tác thành công (vd: đăng nhập đúng thì xóa bộ đếm sai). */
    @Transactional
    public void clear(String bucketKey) {
        repository.findByBucketKey(bucketKey).ifPresent(repository::delete);
    }
}
