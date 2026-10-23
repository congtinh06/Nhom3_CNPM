package com.saigonvoice.analytics.repository;

import com.saigonvoice.analytics.entity.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    boolean existsByEventId(String eventId);

    Optional<AnalyticsEvent> findByEventId(String eventId);

    long countByEventType(String eventType);

    long countByEventTypeAndCompletedTrue(String eventType);

    /**
     * Chỉ đếm lượt bắt đầu nghe. Sự kiện hoàn tất được ghi thêm với completed=true
     * để không làm tăng tổng lượt nghe.
     */
    @Query("""
            SELECT COUNT(e)
              FROM AnalyticsEvent e
             WHERE e.eventType = :eventType
               AND (e.completed IS NULL OR e.completed = false)
            """)
    long countStartedByEventType(@Param("eventType") String eventType);

    @Query("SELECT e.triggerType, COUNT(e) FROM AnalyticsEvent e WHERE e.eventType = 'SCAN' AND e.triggerType IS NOT NULL GROUP BY e.triggerType")
    List<Object[]> countScansByTriggerType();

    @Query("""
            SELECT e.languageCode, COUNT(e)
              FROM AnalyticsEvent e
             WHERE e.eventType = 'AUDIO_PLAY'
               AND (e.completed IS NULL OR e.completed = false)
             GROUP BY e.languageCode
            """)
    List<Object[]> countAudioPlaysByLanguage();

    @Query("SELECT e.poiId, " +
           "SUM(CASE WHEN e.eventType = 'SCAN' THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN e.eventType = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = false) THEN 1L ELSE 0L END) " +
           "FROM AnalyticsEvent e " +
           "GROUP BY e.poiId " +
           "ORDER BY COUNT(e) DESC, e.poiId ASC")
    List<Object[]> findTopPoisRaw(Pageable pageable);

    // ------------------------------------------------------------------
    // Thống kê QR audio cho admin (SQL Server, bucket theo giờ Việt Nam).
    // ------------------------------------------------------------------

    @Query(value = """
            SELECT COUNT(CASE WHEN e.event_type = 'SCAN' THEN 1 END) AS scans,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = 0) THEN 1 END) AS plays,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND e.completed = 1 THEN 1 END) AS completed,
                   COUNT(DISTINCT CASE WHEN e.event_type = 'SCAN' THEN e.session_id END) AS unique_sessions
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
            """, nativeQuery = true)
    List<Object[]> findQrAudioTotals(@Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT CONVERT(varchar(10), DATEADD(HOUR, 7, e.occurred_at), 120) AS bucket,
                   COUNT(CASE WHEN e.event_type = 'SCAN' THEN 1 END) AS scans,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = 0) THEN 1 END) AS plays,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND e.completed = 1 THEN 1 END) AS completed
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
            GROUP BY CONVERT(varchar(10), DATEADD(HOUR, 7, e.occurred_at), 120)
            ORDER BY bucket
            """, nativeQuery = true)
    List<Object[]> findQrAudioDailySeries(@Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT CONVERT(varchar(13), DATEADD(HOUR, 7, e.occurred_at), 120) AS bucket,
                   COUNT(CASE WHEN e.event_type = 'SCAN' THEN 1 END) AS scans,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = 0) THEN 1 END) AS plays,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND e.completed = 1 THEN 1 END) AS completed
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
            GROUP BY CONVERT(varchar(13), DATEADD(HOUR, 7, e.occurred_at), 120)
            ORDER BY bucket
            """, nativeQuery = true)
    List<Object[]> findQrAudioHourlySeries(@Param("from") LocalDateTime from,
                                           @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT e.trigger_type, COUNT(*) AS total
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
              AND e.event_type = 'SCAN'
            GROUP BY e.trigger_type
            """, nativeQuery = true)
    List<Object[]> findQrAudioTriggerCounts(@Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT e.language_code, COUNT(*) AS total
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
              AND e.event_type = 'AUDIO_PLAY'
              AND (e.completed IS NULL OR e.completed = 0)
            GROUP BY e.language_code
            """, nativeQuery = true)
    List<Object[]> findQrAudioLanguageCounts(@Param("from") LocalDateTime from,
                                             @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT TOP 10 e.poi_id,
                   COUNT(CASE WHEN e.event_type = 'SCAN' THEN 1 END) AS scans,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = 0) THEN 1 END) AS plays,
                   COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND e.completed = 1 THEN 1 END) AS completed
            FROM analytics_event e
            WHERE e.occurred_at >= :from AND e.occurred_at < :to
            GROUP BY e.poi_id
            ORDER BY COUNT(CASE WHEN e.event_type = 'SCAN' THEN 1 END) DESC,
                     COUNT(CASE WHEN e.event_type = 'AUDIO_PLAY' AND (e.completed IS NULL OR e.completed = 0) THEN 1 END) DESC
            """, nativeQuery = true)
    List<Object[]> findQrAudioTopPois(@Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);
}
