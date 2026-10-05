package com.saigonvoice.analytics.repository;

import com.saigonvoice.analytics.entity.AnalyticsEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    boolean existsByEventId(String eventId);

    Optional<AnalyticsEvent> findByEventId(String eventId);

    long countByEventType(String eventType);

    long countByEventTypeAndCompletedTrue(String eventType);

    @Query("SELECT e.triggerType, COUNT(e) FROM AnalyticsEvent e WHERE e.eventType = 'SCAN' AND e.triggerType IS NOT NULL GROUP BY e.triggerType")
    List<Object[]> countScansByTriggerType();

    @Query("SELECT e.languageCode, COUNT(e) FROM AnalyticsEvent e WHERE e.eventType = 'AUDIO_PLAY' GROUP BY e.languageCode")
    List<Object[]> countAudioPlaysByLanguage();

    @Query("SELECT e.poiId, " +
           "SUM(CASE WHEN e.eventType = 'SCAN' THEN 1L ELSE 0L END), " +
           "SUM(CASE WHEN e.eventType = 'AUDIO_PLAY' THEN 1L ELSE 0L END) " +
           "FROM AnalyticsEvent e " +
           "GROUP BY e.poiId " +
           "ORDER BY COUNT(e) DESC, e.poiId ASC")
    List<Object[]> findTopPoisRaw(Pageable pageable);
}
