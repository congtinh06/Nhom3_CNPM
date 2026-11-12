package com.echora.content.repository;

import com.echora.content.entity.Route;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

    @Query("SELECT r FROM Route r JOIN FETCH r.zone z " +
           "WHERE r.status = 'ACTIVE' AND (:zoneId IS NULL OR z.id = :zoneId) " +
           "ORDER BY z.id, r.displayOrder, r.id")
    List<Route> findActive(@Param("zoneId") Long zoneId);

    boolean existsByZoneIdAndName(Long zoneId, String name);

    long countByZoneId(Long zoneId);

    // Danh sách tuyến cho admin: lọc theo khu vực/trạng thái + tìm theo tên, phân trang phía server.
    @Query(value = "SELECT r FROM Route r JOIN FETCH r.zone z " +
           "WHERE (:zoneId IS NULL OR z.id = :zoneId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:searchPattern IS NULL OR r.name LIKE :searchPattern)",
           countQuery = "SELECT COUNT(r) FROM Route r " +
           "WHERE (:zoneId IS NULL OR r.zone.id = :zoneId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:searchPattern IS NULL OR r.name LIKE :searchPattern)")
    Page<Route> searchAdminRoutes(
            @Param("zoneId") Long zoneId,
            @Param("status") String status,
            @Param("searchPattern") String searchPattern,
            Pageable pageable);
}
