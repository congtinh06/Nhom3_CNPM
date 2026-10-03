-- ==============================================================================
-- Flyway V1: Initial schema for saigonvoice_analytics_db
-- Tables: scan_log
-- Collation kế thừa từ database (Vietnamese_100_CI_AS)
-- Toàn bộ cột văn bản đa ngôn ngữ dùng NVARCHAR
-- ==============================================================================

IF OBJECT_ID('dbo.scan_log', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.scan_log (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        zone_id BIGINT,
        scan_type NVARCHAR(30) NOT NULL,               -- 'QR_CODE' hoặc 'GPS_GEOFENCE'
        language_code NVARCHAR(10) NOT NULL DEFAULT 'vi',
        device_type NVARCHAR(50),                      -- 'MOBILE_IOS', 'MOBILE_ANDROID', 'DESKTOP'
        client_ip NVARCHAR(50),
        scanned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_scan_poi_time' AND object_id = OBJECT_ID('dbo.scan_log'))
    CREATE INDEX idx_scan_poi_time ON dbo.scan_log (poi_id, scanned_at DESC);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_scan_zone_time' AND object_id = OBJECT_ID('dbo.scan_log'))
    CREATE INDEX idx_scan_zone_time ON dbo.scan_log (zone_id, scanned_at DESC);
GO

-- Bảng chuyển tiếp hỗ trợ Entity Report cũ trước khi xóa ở Bước 1.6
IF OBJECT_ID('dbo.report', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.report (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        target_url NVARCHAR(MAX) NOT NULL,
        channel NVARCHAR(10) NOT NULL,
        reporter_contact NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        is_phishing BIT,
        risk_score NUMERIC(3, 2),
        status NVARCHAR(20) NOT NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
