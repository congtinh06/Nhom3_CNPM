-- ==============================================================================
-- Echora - Flyway V5: sửa constraint trigger_type sai tên từ V4.
-- V4 đã tạo thêm chk_analytics_event_trigger (có DIRECT) nhưng constraint gốc
-- chk_analytics_trigger_type (từ V2) chưa có 'DIRECT' nên event VISIT/DIRECT
-- vẫn bị chặn khi INSERT. V5 gộp về một constraint chuẩn gồm cả 'DIRECT'.
-- ==============================================================================

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_trigger_type')
BEGIN
    ALTER TABLE dbo.analytics_event DROP CONSTRAINT chk_analytics_trigger_type;
END
GO

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_event_trigger')
BEGIN
    ALTER TABLE dbo.analytics_event DROP CONSTRAINT chk_analytics_event_trigger;
END
GO

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_analytics_trigger_type')
BEGIN
    ALTER TABLE dbo.analytics_event
        WITH CHECK ADD CONSTRAINT chk_analytics_trigger_type
        CHECK (trigger_type IS NULL OR trigger_type IN ('QR', 'GPS', 'MANUAL', 'DIRECT'));
END
GO
