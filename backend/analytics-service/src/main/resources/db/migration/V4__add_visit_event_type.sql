-- ==============================================================================
-- Echora - Flyway V4: mở rộng analytics_event cho event type VISIT (đếm lượt
-- truy cập website từ mã QR hoặc truy cập trực tiếp) phục vụ dashboard realtime.
-- ==============================================================================

-- 1. event_type nhận thêm 'VISIT'
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_event_type')
BEGIN
    ALTER TABLE dbo.analytics_event DROP CONSTRAINT chk_analytics_event_type;
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_event_type')
BEGIN
    ALTER TABLE dbo.analytics_event
        WITH CHECK ADD CONSTRAINT chk_analytics_event_type
        CHECK (event_type IN ('SCAN', 'AUDIO_PLAY', 'VISIT'));
END
GO

-- 2. trigger_type nhận thêm 'DIRECT' (vào web trực tiếp, không qua QR/GPS)
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_event_trigger')
BEGIN
    ALTER TABLE dbo.analytics_event DROP CONSTRAINT chk_analytics_event_trigger;
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_event_trigger')
BEGIN
    ALTER TABLE dbo.analytics_event
        WITH CHECK ADD CONSTRAINT chk_analytics_event_trigger
        CHECK (trigger_type IS NULL OR trigger_type IN ('QR', 'GPS', 'MANUAL', 'DIRECT'));
END
GO

-- 3. poi_id cho phép NULL: lượt truy cập VISIT không gắn với POI cụ thể
IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.analytics_event') AND name = 'poi_id' AND is_nullable = 0
)
BEGIN
    ALTER TABLE dbo.analytics_event ALTER COLUMN poi_id BIGINT NULL;
END
GO
