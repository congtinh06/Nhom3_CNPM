package com.echora.auth.repository;

import com.echora.auth.entity.UserPoiEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserPoiEntitlementRepository extends JpaRepository<UserPoiEntitlement, Long> {
    Optional<UserPoiEntitlement> findByUserIdAndPoiId(Long userId, Long poiId);

    boolean existsByUserIdAndPoiIdAndExpiresAtAfter(Long userId, Long poiId, LocalDateTime now);

    boolean existsByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);

    List<UserPoiEntitlement> findByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);
}
