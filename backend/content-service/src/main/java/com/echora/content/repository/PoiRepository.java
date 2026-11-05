package com.echora.content.repository;

import com.echora.content.entity.Poi;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoiRepository extends JpaRepository<Poi, Long> {

    List<Poi> findByZoneIdAndStatus(Long zoneId, String status);

    List<Poi> findByStatus(String status);

    List<Poi> findByPublishStatus(String publishStatus);

    Optional<Poi> findByQrToken(String qrToken);

    Optional<Poi> findByCode(String code);

    boolean existsByRouteIdAndStopOrder(Long routeId, Integer stopOrder);

    long countByRouteId(Long routeId);

    long countByZoneId(Long zoneId);

    // Đếm số POI theo từng khu vực trong 1 truy vấn (tránh N+1 khi hiển thị danh sách).
    @Query("SELECT p.zone.id, COUNT(p) FROM Poi p WHERE p.zone.id IN :zoneIds GROUP BY p.zone.id")
    List<Object[]> countPoisByZoneIds(@Param("zoneIds") Collection<Long> zoneIds);

    // Đếm số điểm dừng theo từng tuyến trong 1 truy vấn (tránh N+1 khi hiển thị danh sách).
    @Query("SELECT p.route.id, COUNT(p) FROM Poi p WHERE p.route.id IN :routeIds GROUP BY p.route.id")
    List<Object[]> countStopsByRouteIds(@Param("routeIds") Collection<Long> routeIds);

    @Query("SELECT p FROM Poi p JOIN FETCH p.zone JOIN FETCH p.category " +
           "WHERE p.route.id = :routeId ORDER BY p.stopOrder")
    List<Poi> findStopsOfRoute(@Param("routeId") Long routeId);

    // "Có lý do cần chú ý" — phải khớp với PoiContentServiceImpl.buildAttentionReasons.
    // Dùng chung cho value query và count query nên tách thành hằng số.
    String ATTENTION_CONDITION =
            "p.status = 'MAINTENANCE' " +
            "OR p.publishStatus = 'FAILED' " +
            "OR NOT EXISTS (SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.languageCode = 'vi' " +
            "  AND t.title IS NOT NULL AND TRIM(t.title) <> '' " +
            "  AND t.description IS NOT NULL AND TRIM(t.description) <> '') " +
            "OR EXISTS (SELECT 1 FROM PoiTranslation t WHERE t.poi = p " +
            "  AND t.languageCode IN :supportedLanguages AND t.audioStatus LIKE 'FAILED%') " +
            "OR EXISTS (SELECT 1 FROM PoiTranslation t WHERE t.poi = p " +
            "  AND t.languageCode IN :supportedLanguages AND t.audioStatus IN ('PENDING', 'PROCESSING', 'GENERATING') " +
            "  AND COALESCE(t.audioLastAttemptAt, t.updatedAt) < :pendingCutoff)";

    // Danh sách POI cho admin: lọc + phân trang phía server. JOIN FETCH zone/category/route để tránh N+1.
    // overallStatus/languageStatus phải khớp 1-1 với PoiContentServiceImpl.resolveOverallStatus
    // và languageSummary của response:
    //   HIDDEN          = POI đã ẩn (status INACTIVE)
    //   NEEDS_ATTENTION = chưa ẩn nhưng có lý do cần chú ý (bảo trì, thiếu bản dịch vi,
    //                     phát hành lỗi, audio lỗi, chờ xử lý quá hạn)
    //   ERROR           = có ngôn ngữ audio bị lỗi
    //   PENDING         = có ngôn ngữ chờ xử lý HOẶC thiếu bản dịch (languageSummary.pending > 0)
    @Query(value = "SELECT p FROM Poi p " +
            "JOIN FETCH p.zone z " +
            "JOIN FETCH p.category c " +
            "LEFT JOIN FETCH p.route r " +
            "WHERE (:zoneId IS NULL OR z.id = :zoneId) " +
            "AND (:routeId IS NULL OR r.id = :routeId) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:searchPattern IS NULL OR LOWER(p.name) LIKE :searchPattern) " +
            "AND (:audioStatus IS NULL OR EXISTS (SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.audioStatus = :audioStatus)) " +
            "AND (" +
            "  :overallStatus IS NULL " +
            "  OR (:overallStatus = 'HIDDEN' AND p.status = 'INACTIVE') " +
            "  OR (:overallStatus = 'ACTIVE' AND p.status <> 'INACTIVE' AND NOT (" + ATTENTION_CONDITION + ")) " +
            "  OR (:overallStatus = 'NEEDS_ATTENTION' AND p.status <> 'INACTIVE' AND (" + ATTENTION_CONDITION + "))" +
            ") " +
            "AND (" +
            "  :languageStatus IS NULL " +
            "  OR (:languageStatus = 'ERROR' AND EXISTS (" +
            "    SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages " +
            "    AND t.audioStatus LIKE 'FAILED%')) " +
            "  OR (:languageStatus = 'PENDING' AND (" +
            "    EXISTS (" +
            "      SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages " +
            "      AND t.audioStatus <> 'READY' AND t.audioStatus NOT LIKE 'FAILED%') " +
            "    OR (SELECT COUNT(t) FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages) " +
            "       < :supportedLangCount))" +
            ")",
            countQuery = "SELECT COUNT(p) FROM Poi p " +
            "WHERE (:zoneId IS NULL OR p.zone.id = :zoneId) " +
            "AND (:routeId IS NULL OR p.route.id = :routeId) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:searchPattern IS NULL OR LOWER(p.name) LIKE :searchPattern) " +
            "AND (:audioStatus IS NULL OR EXISTS (SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.audioStatus = :audioStatus)) " +
            "AND (" +
            "  :overallStatus IS NULL " +
            "  OR (:overallStatus = 'HIDDEN' AND p.status = 'INACTIVE') " +
            "  OR (:overallStatus = 'ACTIVE' AND p.status <> 'INACTIVE' AND NOT (" + ATTENTION_CONDITION + ")) " +
            "  OR (:overallStatus = 'NEEDS_ATTENTION' AND p.status <> 'INACTIVE' AND (" + ATTENTION_CONDITION + "))" +
            ") " +
            "AND (" +
            "  :languageStatus IS NULL " +
            "  OR (:languageStatus = 'ERROR' AND EXISTS (" +
            "    SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages " +
            "    AND t.audioStatus LIKE 'FAILED%')) " +
            "  OR (:languageStatus = 'PENDING' AND (" +
            "    EXISTS (" +
            "      SELECT 1 FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages " +
            "      AND t.audioStatus <> 'READY' AND t.audioStatus NOT LIKE 'FAILED%') " +
            "    OR (SELECT COUNT(t) FROM PoiTranslation t WHERE t.poi = p AND t.languageCode IN :supportedLanguages) " +
            "       < :supportedLangCount))" +
            ")")
    Page<Poi> searchAdminPois(
            @Param("zoneId") Long zoneId,
            @Param("routeId") Long routeId,
            @Param("status") String status,
            @Param("searchPattern") String searchPattern,
            @Param("audioStatus") String audioStatus,
            @Param("overallStatus") String overallStatus,
            @Param("languageStatus") String languageStatus,
            @Param("supportedLanguages") Collection<String> supportedLanguages,
            @Param("supportedLangCount") int supportedLangCount,
            @Param("pendingCutoff") LocalDateTime pendingCutoff,
            Pageable pageable);

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
