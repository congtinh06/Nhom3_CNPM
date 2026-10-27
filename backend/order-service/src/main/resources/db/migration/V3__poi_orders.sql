-- ==============================================================================
-- Echora - Flyway V3: don hang mua le Premium theo POI (mo khoa thuyet minh
-- ngoai ngu cho rieng mot diem). Don POI khong giao hang, thanh toan VNPAY
-- hoac VietQR demo; khi thanh toan thanh cong thi cap quyen cho auth-service.
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.orders') AND name = 'poi_id')
BEGIN
    ALTER TABLE dbo.orders
        ADD poi_id BIGINT NULL;
END
GO
