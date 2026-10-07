package com.saigonvoice.auth.repository;

import com.saigonvoice.auth.entity.AuthRateLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AuthRateLimitRepository extends JpaRepository<AuthRateLimit, Long> {

    Optional<AuthRateLimit> findByBucketKey(String bucketKey);

    long countByUpdatedAtAfterAndLockedUntilAfter(LocalDateTime updatedAfter, LocalDateTime lockedUntilAfter);

    void deleteByUpdatedAtBefore(LocalDateTime updatedAt);
}
