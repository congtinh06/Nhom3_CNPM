package com.saigonvoice.auth.service;

import com.saigonvoice.auth.entity.AuthRateLimit;
import com.saigonvoice.auth.exception.TooManyRequestsException;
import com.saigonvoice.auth.repository.AuthRateLimitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RateLimitServiceTest {

    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Duration LOCK = Duration.ofMinutes(15);

    private final Map<String, AuthRateLimit> store = new HashMap<>();
    private final AuthRateLimitRepository repository = mock(AuthRateLimitRepository.class);
    private final RateLimitService service = new RateLimitService(repository);

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        store.clear();
        when(repository.findByBucketKey(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(store.get((String) inv.getArgument(0))));
        when(repository.save(any(AuthRateLimit.class))).thenAnswer(inv -> {
            AuthRateLimit row = inv.getArgument(0);
            store.put(row.getBucketKey(), row);
            return row;
        });
        doAnswer(inv -> {
            AuthRateLimit row = inv.getArgument(0);
            store.remove(row.getBucketKey());
            return null;
        }).when(repository).delete(any(AuthRateLimit.class));
    }

    @Test
    @DisplayName("Đăng nhập sai 5 lần liên tiếp thì bị khóa 15 phút")
    void locksAfterFiveFailures() {
        String bucket = "login-fail|a@b.com|1.2.3.4";

        for (int i = 1; i < 5; i++) {
            service.recordFailure(bucket, 5, WINDOW, LOCK);
            service.assertNotLocked(bucket);
        }

        long lockedSeconds = service.recordFailure(bucket, 5, WINDOW, LOCK);
        assertThat(lockedSeconds).isBetween(1L, LOCK.toSeconds());

        long finalLocked = service.recordFailure(bucket, 5, WINDOW, LOCK);
        assertThat(finalLocked).isGreaterThan(0);

        assertThatThrownBy(() -> service.assertNotLocked(bucket))
                .isInstanceOf(TooManyRequestsException.class)
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getRetryAfterSeconds()).isPositive());
    }

    @Test
    @DisplayName("Hết cửa sổ 15 phút thì bộ đếm được reset")
    void resetsAfterWindowExpires() {
        String bucket = "login-fail|a@b.com|1.2.3.4";
        for (int i = 0; i < 4; i++) {
            service.recordFailure(bucket, 5, WINDOW, LOCK);
        }

        AuthRateLimit row = store.get(bucket);
        row.setWindowStart(LocalDateTime.now().minusMinutes(20));
        service.recordFailure(bucket, 5, WINDOW, LOCK);

        assertThat(store.get(bucket).getHitCount()).isEqualTo(1);
        assertThat(store.get(bucket).getLockedUntil()).isNull();
        service.assertNotLocked(bucket);
    }

    @Test
    @DisplayName("clear() xóa bộ đếm sau khi đăng nhập đúng")
    void clearRemovesBucket() {
        String bucket = "login-fail|a@b.com|1.2.3.4";
        service.recordFailure(bucket, 5, WINDOW, LOCK);
        assertThat(store).containsKey(bucket);

        service.clear(bucket);

        assertThat(store).doesNotContainKey(bucket);
        service.assertNotLocked(bucket);
    }

    @Test
    @DisplayName("assertAllowed cho phép đúng số lần rồi chặn và báo Retry-After")
    void fixedWindowAllowsUpToLimit() {
        String bucket = "forgot-ip|1.2.3.4";
        for (int i = 0; i < 3; i++) {
            service.assertAllowed(bucket, 3, Duration.ofHours(1));
        }

        assertThatThrownBy(() -> service.assertAllowed(bucket, 3, Duration.ofHours(1)))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    @DisplayName("Bucket chưa từng thấy không bị chặn")
    void newBucketIsAllowed() {
        service.assertNotLocked("brand-new-bucket");
        service.assertAllowed("brand-new-bucket", 5, Duration.ofHours(1));
        assertThat(store.get("brand-new-bucket").getHitCount()).isEqualTo(1);
    }
}
