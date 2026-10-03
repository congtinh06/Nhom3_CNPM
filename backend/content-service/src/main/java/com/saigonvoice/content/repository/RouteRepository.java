package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.Route;
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
}
