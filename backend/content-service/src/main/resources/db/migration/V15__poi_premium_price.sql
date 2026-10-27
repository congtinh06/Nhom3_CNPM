-- ==============================================================================
-- Echora — Flyway V15 Migration: Giá mua lẻ Premium theo POI.
-- NULL = dùng giá mặc định cấu hình trong order-service (app.premium.poi-price).
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.poi') AND name = 'premium_price')
BEGIN
    ALTER TABLE dbo.poi
        ADD premium_price DECIMAL(12, 0) NULL;
END
GO
