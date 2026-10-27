package com.echora.order.repository;

import com.echora.order.entity.OrderEntitlementGrant;
import com.echora.order.entity.OrderEntitlementGrantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderEntitlementGrantRepository extends JpaRepository<OrderEntitlementGrant, Long> {

    Optional<OrderEntitlementGrant> findByOrderId(Long orderId);

    Optional<OrderEntitlementGrant> findByOrderCode(String orderCode);

    List<OrderEntitlementGrant> findTop20ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
            OrderEntitlementGrantStatus status,
            LocalDateTime now);

    @Modifying
    @Query(value = """
            INSERT INTO dbo.order_entitlement_grants
                (order_id, order_code, user_id, order_type, poi_id, status, attempts, next_attempt_at)
            SELECT :orderId, :orderCode, :userId, :orderType, :poiId, 'PENDING', 0, :nextAttemptAt
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.order_entitlement_grants WHERE order_id = :orderId
            )
            """, nativeQuery = true)
    int insertIfAbsent(@Param("orderId") Long orderId,
                       @Param("orderCode") String orderCode,
                       @Param("userId") Long userId,
                       @Param("orderType") String orderType,
                       @Param("poiId") Long poiId,
                       @Param("nextAttemptAt") LocalDateTime nextAttemptAt);
}
