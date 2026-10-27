-- ==============================================================================
-- Echora — Flyway V9 Migration: Quyền Premium mua lẻ theo POI.
-- Khi user mua gói ngoại ngữ cho một điểm thuyết minh, hệ thống ghi 1 dòng
-- entitlement (idempotent theo order_code). Gói Premium toàn tài khoản
-- (bảng users) vẫn mở mọi POI, bảng này chỉ lưu các POI mua riêng.
-- ==============================================================================

IF OBJECT_ID('dbo.user_poi_entitlements', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_poi_entitlements (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        poi_id BIGINT NOT NULL,
        source_order_code NVARCHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        granted_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_user_poi UNIQUE (user_id, poi_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_poi_user' AND object_id = OBJECT_ID('dbo.user_poi_entitlements'))
    CREATE INDEX idx_user_poi_user ON dbo.user_poi_entitlements (user_id, expires_at);
GO
