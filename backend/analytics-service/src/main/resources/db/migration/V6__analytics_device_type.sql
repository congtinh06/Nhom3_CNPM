-- ==============================================================================
-- Echora - Flyway V6: luu loai thiet bi cho su kien analytics.
-- Frontend gui kem deviceType (mobile/desktop/tablet/unknown) khi ghi nhan
-- SCAN/AUDIO_PLAY de admin xem phan bo thiet bi tren trang QR audio.
-- ==============================================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.analytics_event') AND name = 'device_type'
)
BEGIN
    ALTER TABLE dbo.analytics_event ADD device_type NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.check_constraints
    WHERE name = 'chk_analytics_device_type'
      AND parent_object_id = OBJECT_ID('dbo.analytics_event')
)
BEGIN
    ALTER TABLE dbo.analytics_event
        WITH CHECK ADD CONSTRAINT chk_analytics_device_type
        CHECK (device_type IS NULL OR device_type IN ('mobile', 'desktop', 'tablet', 'unknown'));
END
GO
