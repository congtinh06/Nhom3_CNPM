package com.saigonvoice.content.repository;

import com.saigonvoice.content.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoiRepository extends JpaRepository<Poi, Long> {

    List<Poi> findByZoneIdAndStatus(Long zoneId, String status);

    Optional<Poi> findByQrToken(String qrToken);

    Optional<Poi> findByCode(String code);

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
}
