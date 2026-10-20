-- ==============================================================================
-- Echora — Flyway V1 Migration: Schema & Seed Data cho saigonvoice_content_db
-- Toàn bộ chuỗi Unicode đều có tiền tố N'...' để tránh mất dấu tiếng Việt/Nhật/Hàn.
-- Hoàn toàn không còn bảng phishing cũ (đã loại bỏ poi_cache).
-- ==============================================================================

-- 1. BẢNG KHU VỰC DU LỊCH (ZONE)
IF OBJECT_ID('dbo.zone', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zone (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
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

-- 2. BẢNG DANH MỤC ĐIỂM DỪNG (CATEGORY)
IF OBJECT_ID('dbo.category', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.category (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name_vi NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        icon_url NVARCHAR(500)
    );
END
GO

-- 3. BẢNG TUYẾN THAM QUAN (ROUTE) - tên/mô tả chỉ tiếng Việt
IF OBJECT_ID('dbo.route', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.route (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        zone_id BIGINT NOT NULL,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        display_order INT NOT NULL DEFAULT 0,          -- thứ tự hiển thị tuyến trong khu
        status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_route_zone FOREIGN KEY (zone_id) REFERENCES dbo.zone(id),
        CONSTRAINT UQ_route_zone_name UNIQUE (zone_id, name)
    );
END
GO

-- 4. BẢNG ĐIỂM DỪNG DU LỊCH (POI)
IF OBJECT_ID('dbo.poi', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        zone_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        route_id BIGINT NULL,                          -- POI có thể không thuộc tuyến nào
        stop_order INT NULL,                           -- thứ tự điểm dừng trong tuyến
        code NVARCHAR(50) NOT NULL UNIQUE,
        qr_token NVARCHAR(100) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        trigger_radius_meters INT NOT NULL DEFAULT 50,
        address NVARCHAR(500),
        thumbnail_url NVARCHAR(500),
        status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        -- Theo dõi việc gửi event poi.created sang RabbitMQ (PENDING, PUBLISHED, FAILED)
        publish_status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
        publish_attempts INT NOT NULL DEFAULT 0,
        last_publish_error NVARCHAR(1000) NULL,
        last_publish_attempt_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_poi_zone FOREIGN KEY (zone_id) REFERENCES dbo.zone(id),
        CONSTRAINT FK_poi_category FOREIGN KEY (category_id) REFERENCES dbo.category(id),
        CONSTRAINT FK_poi_route FOREIGN KEY (route_id) REFERENCES dbo.route(id),
        -- route_id và stop_order phải cùng có hoặc cùng NULL
        CONSTRAINT CK_poi_route_stop CHECK (
            (route_id IS NULL AND stop_order IS NULL) OR
            (route_id IS NOT NULL AND stop_order IS NOT NULL AND stop_order > 0)
        )
    );
END
GO

-- 5. BẢNG BẢN DỊCH & THÔNG TIN ÂM THANH (POI_TRANSLATION)
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
        audio_url NVARCHAR(1000),
        audio_duration_seconds INT DEFAULT 0,
        audio_status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, READY, FAILED_TTS
        content_hash NVARCHAR(64),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_poi_language UNIQUE (poi_id, language_code),
        CONSTRAINT FK_translation_poi FOREIGN KEY (poi_id) REFERENCES dbo.poi(id) ON DELETE CASCADE
    );
END
GO

-- 6. CHỈ MỤC TỐI ƯU TRUY VẤN
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_zone_lat_lng' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_zone_lat_lng ON dbo.poi (zone_id, latitude, longitude);
GO

-- Không cho 2 POI trùng thứ tự trong cùng 1 tuyến (filtered unique index, bỏ qua POI không thuộc tuyến)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ux_poi_route_stop' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE UNIQUE INDEX ux_poi_route_stop ON dbo.poi (route_id, stop_order) WHERE route_id IS NOT NULL;
GO

-- Job gửi lại event quét theo publish_status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_publish_status' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_publish_status ON dbo.poi (publish_status, last_publish_attempt_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_route_zone' AND object_id = OBJECT_ID('dbo.route'))
    CREATE INDEX idx_route_zone ON dbo.route (zone_id, display_order);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_qr_token' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_qr_token ON dbo.poi (qr_token);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_poi_lang' AND object_id = OBJECT_ID('dbo.poi_translation'))
    CREATE INDEX idx_translation_poi_lang ON dbo.poi_translation (poi_id, language_code);
GO
