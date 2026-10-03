-- ==============================================================================
-- Flyway V1: Initial schema for saigonvoice_content_db
-- Tables: zone, category, poi, poi_translation
-- Collation kế thừa từ database (Vietnamese_100_CI_AS)
-- Toàn bộ cột văn bản đa ngôn ngữ dùng NVARCHAR
-- ==============================================================================

IF OBJECT_ID('dbo.zone', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zone (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,          -- vd: 'D1_HISTORIC', 'CHO_LON', 'VINH_KHANH', 'BA_SON'
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        center_lat DECIMAL(10, 7) NOT NULL,
        center_lng DECIMAL(10, 7) NOT NULL,
        radius_meters INT NOT NULL DEFAULT 1000,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID('dbo.category', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.category (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,          -- vd: 'HISTORIC', 'FOOD', 'ARCHITECTURE', 'RELIGION'
        name_vi NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        icon_url NVARCHAR(500)
    );
END
GO

IF OBJECT_ID('dbo.poi', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        zone_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        code NVARCHAR(50) NOT NULL UNIQUE,          -- vd: 'POI_BEN_THANH_01'
        qr_token NVARCHAR(100) NOT NULL UNIQUE,     -- Mã định danh quét QR
        name NVARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        trigger_radius_meters INT NOT NULL DEFAULT 50, -- Bán kính kích hoạt Geofence (mét)
        address NVARCHAR(500),
        thumbnail_url NVARCHAR(500),
        status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_poi_zone FOREIGN KEY (zone_id) REFERENCES dbo.zone(id),
        CONSTRAINT FK_poi_category FOREIGN KEY (category_id) REFERENCES dbo.category(id)
    );
END
GO

IF OBJECT_ID('dbo.poi_translation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_translation (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        language_code NVARCHAR(10) NOT NULL,        -- 'vi', 'en', 'ja', 'ko'
        title NVARCHAR(255) NOT NULL,
        summary NVARCHAR(1000) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        historical_significance NVARCHAR(MAX),
        audio_url NVARCHAR(1000),                   -- URL file MP3 (Local hoặc Supabase)
        audio_duration_seconds INT DEFAULT 0,
        audio_status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, READY, FAILED_TTS
        content_hash NVARCHAR(64),                  -- SHA-256 hash của text
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_poi_language UNIQUE (poi_id, language_code),
        CONSTRAINT FK_translation_poi FOREIGN KEY (poi_id) REFERENCES dbo.poi(id) ON DELETE CASCADE
    );
END
GO

-- Composite Index phục vụ Bounding Box query từ location-service
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_zone_lat_lng' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_zone_lat_lng ON dbo.poi (zone_id, latitude, longitude);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_qr_token' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_qr_token ON dbo.poi (qr_token);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_poi_lang' AND object_id = OBJECT_ID('dbo.poi_translation'))
    CREATE INDEX idx_translation_poi_lang ON dbo.poi_translation (poi_id, language_code);
GO

-- Bảng chuyển tiếp hỗ trợ Entity PoiCache cũ trước khi xóa ở Bước 1.3
IF OBJECT_ID('dbo.poi_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_cache (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cache_key NVARCHAR(255) NOT NULL UNIQUE,
        response_json NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        expires_at DATETIME2 NOT NULL
    );
END
GO
