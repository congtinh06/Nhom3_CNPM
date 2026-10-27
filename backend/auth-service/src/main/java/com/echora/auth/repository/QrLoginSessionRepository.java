package com.echora.auth.repository;

import com.echora.auth.entity.QrLoginSession;
import com.echora.auth.entity.QrLoginStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QrLoginSessionRepository
        extends JpaRepository<QrLoginSession, UUID>, JpaSpecificationExecutor<QrLoginSession> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<QrLoginSession> findByQrTokenHash(String qrTokenHash);

    Optional<QrLoginSession> findByIdAndExchangeTokenHash(UUID id, String exchangeTokenHash);

    @Modifying
    @Query("""
            update QrLoginSession s
               set s.status = :consumed,
                   s.consumedAt = :now,
                   s.updatedAt = :now
             where s.id = :id
               and s.status = :approved
               and s.expiresAt > :now
            """)
    int consumeApproved(@Param("id") UUID id,
                        @Param("approved") QrLoginStatus approved,
                        @Param("consumed") QrLoginStatus consumed,
                        @Param("now") LocalDateTime now);

    @Modifying
    @Query("update QrLoginSession s set s.status = :expired, s.updatedAt = :now where s.status in :statuses and s.expiresAt <= :now")
    int expireOverdue(@Param("statuses") java.util.Collection<QrLoginStatus> statuses,
                      @Param("expired") QrLoginStatus expired,
                      @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from QrLoginSession s where s.expiresAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);

    // ------------------------------------------------------------------
    // Thống kê admin. Các truy vấn dùng SQL Server vì cần DATEADD/CONVERT
    // theo múi giờ Việt Nam (+07:00) và DATEDIFF_BIG cho thời lượng phiên.
    // ------------------------------------------------------------------

    @Query(value = """
            SELECT COUNT(*) AS created,
                   COALESCE(SUM(CASE WHEN t.scanned_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS scanned,
                   COALESCE(SUM(CASE WHEN t.approved_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS approved,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'CONSUMED' THEN 1 ELSE 0 END), 0) AS consumed,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'DENIED' THEN 1 ELSE 0 END), 0) AS denied,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'EXPIRED' THEN 1 ELSE 0 END), 0) AS expired,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending,
                   COALESCE(SUM(CASE WHEN t.effective_status IN ('PENDING', 'SCANNED', 'APPROVED', 'GUEST_APPROVED') THEN 1 ELSE 0 END), 0) AS active,
                   COUNT(DISTINCT t.user_id) AS distinct_users,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'EXPIRED' AND t.scanned_at IS NULL THEN 1 ELSE 0 END), 0) AS expired_unscanned,
                   COALESCE(SUM(CASE WHEN t.effective_status = 'EXPIRED' AND t.scanned_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS expired_scanned
            FROM (
                SELECT CASE
                            WHEN s.status IN ('PENDING', 'SCANNED', 'APPROVED', 'GUEST_APPROVED') AND s.expires_at <= :now THEN 'EXPIRED'
                            ELSE s.status
                        END AS effective_status,
                        s.scanned_at,
                        s.approved_at,
                        s.user_id
                FROM qr_login_sessions s
                WHERE s.created_at >= :from AND s.created_at < :to
            ) t
            """, nativeQuery = true)
    List<Object[]> findTotals(@Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to,
                              @Param("now") LocalDateTime now);

    @Query(value = """
            SELECT t.effective_status, COUNT(*) AS total
            FROM (
                SELECT CASE
                            WHEN s.status IN ('PENDING', 'SCANNED', 'APPROVED', 'GUEST_APPROVED') AND s.expires_at <= :now THEN 'EXPIRED'
                            ELSE s.status
                        END AS effective_status
                FROM qr_login_sessions s
                WHERE s.created_at >= :from AND s.created_at < :to
            ) t
            GROUP BY t.effective_status
            """, nativeQuery = true)
    List<Object[]> findEffectiveStatusCounts(@Param("from") LocalDateTime from,
                                             @Param("to") LocalDateTime to,
                                             @Param("now") LocalDateTime now);

    @Query(value = """
            SELECT CONVERT(varchar(10), DATEADD(HOUR, 7, s.created_at), 120) AS bucket,
                   COUNT(*) AS created,
                   COALESCE(SUM(CASE WHEN s.scanned_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS scanned,
                   COALESCE(SUM(CASE WHEN s.approved_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS approved,
                   COALESCE(SUM(CASE WHEN s.status = 'CONSUMED' THEN 1 ELSE 0 END), 0) AS consumed
            FROM qr_login_sessions s
            WHERE s.created_at >= :from AND s.created_at < :to
            GROUP BY CONVERT(varchar(10), DATEADD(HOUR, 7, s.created_at), 120)
            ORDER BY bucket
            """, nativeQuery = true)
    List<Object[]> findDailySeries(@Param("from") LocalDateTime from,
                                   @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT CONVERT(varchar(13), DATEADD(HOUR, 7, s.created_at), 120) AS bucket,
                   COUNT(*) AS created,
                   COALESCE(SUM(CASE WHEN s.scanned_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS scanned,
                   COALESCE(SUM(CASE WHEN s.approved_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS approved,
                   COALESCE(SUM(CASE WHEN s.status = 'CONSUMED' THEN 1 ELSE 0 END), 0) AS consumed
            FROM qr_login_sessions s
            WHERE s.created_at >= :from AND s.created_at < :to
            GROUP BY CONVERT(varchar(13), DATEADD(HOUR, 7, s.created_at), 120)
            ORDER BY bucket
            """, nativeQuery = true)
    List<Object[]> findHourlySeries(@Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT AVG(CAST(DATEDIFF_BIG(SECOND, s.created_at, s.scanned_at) AS FLOAT)) AS avg_scan,
                   AVG(CAST(DATEDIFF_BIG(SECOND, s.scanned_at, s.approved_at) AS FLOAT)) AS avg_approve,
                   AVG(CAST(DATEDIFF_BIG(SECOND, s.created_at, s.consumed_at) AS FLOAT)) AS avg_login
            FROM qr_login_sessions s
            WHERE s.created_at >= :from AND s.created_at < :to
            """, nativeQuery = true)
    List<Object[]> findAverageDurations(@Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT s.created_user_agent, COUNT(*) AS total
            FROM qr_login_sessions s
            WHERE s.created_at >= :from AND s.created_at < :to
            GROUP BY s.created_user_agent
            """, nativeQuery = true)
    List<Object[]> findDeviceCounts(@Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    @Query(value = """
            SELECT TOP 5 s.user_id, u.full_name, u.email, COUNT(*) AS total
            FROM qr_login_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.created_at >= :from AND s.created_at < :to
              AND s.user_id IS NOT NULL
              AND s.status = 'CONSUMED'
            GROUP BY s.user_id, u.full_name, u.email
            ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<Object[]> findTopUsers(@Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);
}
