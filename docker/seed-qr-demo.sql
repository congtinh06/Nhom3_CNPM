-- ==============================================================================
-- Echora - Seed demo for QR login stats and QR audio analytics
--
-- Run as SA (needs cross-database reads to auth/content databases):
--   docker cp docker/seed-qr-demo.sql mssql:/tmp/seed-qr-demo.sql
--   docker exec mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -i /tmp/seed-qr-demo.sql
--
-- The script is idempotent. It deletes and recreates only rows it owns:
--   auth_db.qr_login_sessions  ids in 00000000-0000-4000-8000-XXXXXXXXXXXX
--   analytics_db.analytics_event ids starting with seed-qr-
-- ==============================================================================

USE saigonvoice_auth_db;
GO

SET NOCOUNT ON;

DELETE FROM dbo.qr_login_sessions
WHERE CAST(id AS VARCHAR(36)) LIKE '00000000-0000-4000-8000-%';
GO

DROP TABLE IF EXISTS #SeedUsers;
SELECT ROW_NUMBER() OVER (ORDER BY id) AS rn, id
INTO #SeedUsers
FROM saigonvoice_auth_db.dbo.users
WHERE status = 'ACTIVE';

DECLARE @userCount INT = (SELECT COUNT(*) FROM #SeedUsers);
DECLARE @i INT = 1;

WHILE @i <= 24
BEGIN
    DECLARE @status NVARCHAR(20) = CASE
        WHEN @i <= 15 THEN 'CONSUMED'
        WHEN @i <= 18 THEN 'EXPIRED'
        WHEN @i = 19 THEN 'DENIED'
        WHEN @i = 20 THEN 'CANCELLED'
        WHEN @i = 21 THEN 'APPROVED'
        WHEN @i = 22 THEN 'SCANNED'
        ELSE 'PENDING'
    END;

    DECLARE @createdAt DATETIME2 = DATEADD(MINUTE, -(@i * 330), SYSUTCDATETIME());
    DECLARE @scannedAt DATETIME2 = CASE
        WHEN @status IN ('SCANNED', 'APPROVED', 'CONSUMED', 'DENIED') THEN DATEADD(SECOND, 25 + @i, @createdAt)
        WHEN @status = 'EXPIRED' AND @i % 2 = 0 THEN DATEADD(SECOND, 35, @createdAt)
        ELSE NULL
    END;
    DECLARE @approvedAt DATETIME2 = CASE
        WHEN @status IN ('APPROVED', 'CONSUMED') THEN DATEADD(SECOND, 30, @scannedAt)
        ELSE NULL
    END;
    DECLARE @consumedAt DATETIME2 = CASE
        WHEN @status = 'CONSUMED' THEN DATEADD(SECOND, 20, @approvedAt)
        ELSE NULL
    END;
    DECLARE @expiresAt DATETIME2 = CASE
        WHEN @status IN ('PENDING', 'SCANNED', 'APPROVED') THEN DATEADD(MINUTE, 5, SYSUTCDATETIME())
        ELSE DATEADD(MINUTE, 5, @createdAt)
    END;
    DECLARE @userId BIGINT = CASE
        WHEN @status IN ('APPROVED', 'CONSUMED', 'DENIED') AND @userCount > 0
            THEN (SELECT id FROM #SeedUsers WHERE rn = ((@i - 1) % @userCount) + 1)
        ELSE NULL
    END;
    DECLARE @device NVARCHAR(300) = CASE @i % 3
        WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
        WHEN 1 THEN 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36'
        ELSE 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'
    END;
    DECLARE @createdIp NVARCHAR(45) = CONCAT('203.113.', 20 + (@i % 40), '.', 10 + (@i % 200));
    DECLARE @approvedIp NVARCHAR(45) = CASE
        WHEN @approvedAt IS NULL THEN NULL
        ELSE CONCAT('203.113.', 20 + (@i % 40), '.', 50 + (@i % 150))
    END;

    INSERT INTO dbo.qr_login_sessions (
        id, qr_token_hash, exchange_token_hash, status, user_id,
        created_ip, created_user_agent, approved_ip, approved_user_agent,
        expires_at, scanned_at, approved_at, consumed_at, created_at, updated_at
    )
    VALUES (
        CAST('00000000-0000-4000-8000-' + RIGHT('000000000000' + CAST(@i AS VARCHAR(12)), 12) AS UNIQUEIDENTIFIER),
        CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CONCAT('echora-seed-qr-', @i)), 2),
        CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CONCAT('echora-seed-exchange-', @i)), 2),
        @status,
        @userId,
        @createdIp,
        @device,
        @approvedIp,
        CASE WHEN @approvedIp IS NULL THEN NULL ELSE @device END,
        @expiresAt,
        @scannedAt,
        @approvedAt,
        @consumedAt,
        @createdAt,
        COALESCE(@consumedAt, @approvedAt, @scannedAt, @createdAt)
    );

    SET @i = @i + 1;
END
GO

DROP TABLE IF EXISTS #SeedUsers;
GO

USE saigonvoice_analytics_db;
GO

SET NOCOUNT ON;

DELETE FROM dbo.analytics_event
WHERE event_id LIKE 'seed-qr-%';
GO

DROP TABLE IF EXISTS #SeedPoi;
SELECT ROW_NUMBER() OVER (ORDER BY id) AS rn, id
INTO #SeedPoi
FROM saigonvoice_content_db.dbo.poi
WHERE code IN (
    'POI_DINH_DOC_LAP_01',
    'POI_DUC_BA_01',
    'POI_BUU_DIEN_01',
    'POI_BEN_THANH_01',
    'POI_BAO_TANG_CHUNG_TICH_01'
);

IF NOT EXISTS (SELECT 1 FROM #SeedPoi)
BEGIN
    INSERT INTO #SeedPoi (rn, id)
    VALUES (1, 1), (2, 2), (3, 3), (4, 4), (5, 5);
END

DECLARE @poiCount INT = (SELECT COUNT(*) FROM #SeedPoi);
DECLARE @i INT = 1;

-- SCAN events: 80 scans spread across the last 7 days.
WHILE @i <= 80
BEGIN
    INSERT INTO dbo.analytics_event (
        event_id, event_type, poi_id, language_code, trigger_type,
        completed, session_id, occurred_at
    )
    VALUES (
        'seed-qr-scan-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        'SCAN',
        (SELECT id FROM #SeedPoi WHERE rn = ((@i - 1) % @poiCount) + 1),
        CASE @i % 4 WHEN 0 THEN 'en' WHEN 1 THEN 'vi' WHEN 2 THEN 'ja' ELSE 'ko' END,
        CASE WHEN @i % 10 < 7 THEN 'QR' WHEN @i % 10 < 9 THEN 'GPS' ELSE 'MANUAL' END,
        NULL,
        'seed-qr-session-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        DATEADD(MINUTE, -(@i * 120), SYSUTCDATETIME())
    );

    SET @i = @i + 1;
END

-- AUDIO_PLAY start events: 50 starts.
SET @i = 1;
WHILE @i <= 50
BEGIN
    INSERT INTO dbo.analytics_event (
        event_id, event_type, poi_id, language_code, trigger_type,
        completed, session_id, occurred_at
    )
    VALUES (
        'seed-qr-play-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        'AUDIO_PLAY',
        (SELECT id FROM #SeedPoi WHERE rn = ((@i - 1) % @poiCount) + 1),
        CASE @i % 4 WHEN 0 THEN 'en' WHEN 1 THEN 'vi' WHEN 2 THEN 'ja' ELSE 'ko' END,
        CASE WHEN @i % 10 < 8 THEN 'QR' WHEN @i % 10 < 9 THEN 'GPS' ELSE 'MANUAL' END,
        NULL,
        'seed-qr-session-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        DATEADD(MINUTE, -(@i * 180), SYSUTCDATETIME())
    );

    SET @i = @i + 1;
END

-- AUDIO_PLAY completion events: 18 completed listens out of 50 starts (36%).
SET @i = 1;
WHILE @i <= 18
BEGIN
    INSERT INTO dbo.analytics_event (
        event_id, event_type, poi_id, language_code, trigger_type,
        completed, session_id, occurred_at
    )
    VALUES (
        'seed-qr-done-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        'AUDIO_PLAY',
        (SELECT id FROM #SeedPoi WHERE rn = ((@i - 1) % @poiCount) + 1),
        CASE @i % 4 WHEN 0 THEN 'en' WHEN 1 THEN 'vi' WHEN 2 THEN 'ja' ELSE 'ko' END,
        CASE WHEN @i % 10 < 8 THEN 'QR' WHEN @i % 10 < 9 THEN 'GPS' ELSE 'MANUAL' END,
        1,
        'seed-qr-session-' + RIGHT('0000000000' + CAST(@i AS VARCHAR(10)), 10),
        DATEADD(MINUTE, -(@i * 180) + 2, SYSUTCDATETIME())
    );

    SET @i = @i + 1;
END

DROP TABLE IF EXISTS #SeedPoi;
GO

SELECT 'QR demo seed complete' AS result,
       (SELECT COUNT(*) FROM saigonvoice_auth_db.dbo.qr_login_sessions) AS qr_sessions,
       (SELECT COUNT(*) FROM saigonvoice_analytics_db.dbo.analytics_event WHERE event_id LIKE 'seed-qr-%') AS qr_events;
GO
