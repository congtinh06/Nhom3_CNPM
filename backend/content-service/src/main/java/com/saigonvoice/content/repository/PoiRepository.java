package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoiRepository extends JpaRepository<Poi, Long> {

    List<Poi> findByZoneIdAndStatus(Long zoneId, String status);

    List<Poi> findByStatus(String status);

    Optional<Poi> findByQrToken(String qrToken);

    Optional<Poi> findByCode(String code);

    boolean existsByRouteIdAndStopOrder(Long routeId, Integer stopOrder);

    long countByRouteId(Long routeId);

    @Query("SELECT p FROM Poi p JOIN FETCH p.zone JOIN FETCH p.category " +
           "WHERE p.route.id = :routeId ORDER BY p.stopOrder")
    List<Poi> findStopsOfRoute(@Param("routeId") Long routeId);

    // Gỡ toàn bộ điểm dừng khỏi tuyến trước khi gán lại thứ tự mới (tránh vi phạm ux_poi_route_stop khi đổi chỗ)
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Poi p SET p.route = NULL, p.stopOrder = NULL WHERE p.route.id = :routeId")
    int detachAllFromRoute(@Param("routeId") Long routeId);

    @Query("SELECT p FROM Poi p " +
           "JOIN FETCH p.zone z " +
           "JOIN FETCH p.category c " +
           "WHERE (:zoneId IS NULL OR p.zone.id = :zoneId) " +
           "AND p.latitude BETWEEN :minLat AND :maxLat " +
           "AND p.longitude BETWEEN :minLng AND :maxLng " +
           "AND p.status = 'ACTIVE'")
    List<Poi> findInBoundingBox(
            @Param("zoneId") Long zoneId,
            @Param("minLat") BigDecimal minLat,
            @Param("maxLat") BigDecimal maxLat,
            @Param("minLng") BigDecimal minLng,
            @Param("maxLng") BigDecimal maxLng
    );

    // POI chưa gửi được event và đã "nguội" (không đụng tới POI vừa tạo/cập nhật đang được AFTER_COMMIT xử lý)
    @Query("SELECT p.id FROM Poi p WHERE p.publishStatus = 'PENDING' " +
           "AND (p.updatedAt IS NULL OR p.updatedAt < :cutoff) " +
           "AND (p.lastPublishAttemptAt IS NULL OR p.lastPublishAttemptAt < :cutoff)")
    List<Long> findPendingPublishIds(@Param("cutoff") LocalDateTime cutoff);
}
