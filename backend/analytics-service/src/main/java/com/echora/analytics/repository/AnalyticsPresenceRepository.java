package com.echora.analytics.repository;

import com.echora.analytics.entity.AnalyticsPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
public interface AnalyticsPresenceRepository extends JpaRepository<AnalyticsPresence, String> {

    /**
     * Upsert nguyên tử theo session_id: SQL Server MERGE để hai request heartbeat
     * đồng thời của cùng một tab không tạo dòng trùng / lỗi khóa chính.
     */
    @Modifying
    @Transactional
    @Query(value = """
            MERGE dbo.analytics_presence WITH (HOLDLOCK) AS target
            USING (SELECT :sessionId AS session_id) AS source
            ON target.session_id = source.session_id
            WHEN MATCHED THEN
                UPDATE SET target.last_seen_at = :lastSeenAt,
                           target.language_code = COALESCE(:languageCode, target.language_code),
                           target.device_type = COALESCE(:deviceType, target.device_type)
            WHEN NOT MATCHED THEN
                INSERT (session_id, last_seen_at, language_code, device_type)
                VALUES (:sessionId, :lastSeenAt, :languageCode, :deviceType);
            """, nativeQuery = true)
    void upsertPresence(@Param("sessionId") String sessionId,
                        @Param("lastSeenAt") LocalDateTime lastSeenAt,
                        @Param("languageCode") String languageCode,
                        @Param("deviceType") String deviceType);
}
