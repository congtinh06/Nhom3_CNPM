-- ==============================================================================
-- Echora - Flyway V10: Bo sung order_id va paid_at cho user_poi_entitlements
-- Luu lai thong tin don hang va thoi diem thanh toan de doi chieu va tinh han 365 ngay.
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.user_poi_entitlements') AND name = 'order_id')
BEGIN
    ALTER TABLE dbo.user_poi_entitlements ADD order_id BIGINT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.user_poi_entitlements') AND name = 'paid_at')
BEGIN
    ALTER TABLE dbo.user_poi_entitlements ADD paid_at DATETIME2 NULL;
END
GO
