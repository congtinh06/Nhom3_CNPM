-- ==============================================================================
-- Flyway V1: Initial schema for saigonvoice_translation_db
-- Tables: tts_audio_cache, translation_job_log
-- Collation kế thừa từ database (Vietnamese_100_CI_AS)
-- Toàn bộ cột văn bản đa ngôn ngữ dùng NVARCHAR
-- ==============================================================================

IF OBJECT_ID('dbo.tts_audio_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tts_audio_cache (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        content_hash NVARCHAR(64) NOT NULL UNIQUE,     -- SHA-256(lang + '_' + text)
        language_code NVARCHAR(10) NOT NULL,
        storage_type NVARCHAR(30) NOT NULL,            -- 'LOCAL' hoặc 'SUPABASE'
        file_path NVARCHAR(500) NOT NULL,              -- Đường dẫn file trên đĩa / bucket
        public_url NVARCHAR(1000) NOT NULL,            -- URL truy cập âm thanh
        duration_seconds INT NOT NULL DEFAULT 0,
        voice_name NVARCHAR(100),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF OBJECT_ID('dbo.translation_job_log', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_job_log (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        language_code NVARCHAR(10) NOT NULL,
        status NVARCHAR(30) NOT NULL,                  -- 'STARTED', 'TRANSLATED', 'SYNTHESIZED', 'STORED', 'FAILED'
        error_message NVARCHAR(MAX),
        retry_count INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tts_hash' AND object_id = OBJECT_ID('dbo.tts_audio_cache'))
    CREATE INDEX idx_tts_hash ON dbo.tts_audio_cache (content_hash);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_job_poi_lang' AND object_id = OBJECT_ID('dbo.translation_job_log'))
    CREATE INDEX idx_job_poi_lang ON dbo.translation_job_log (poi_id, language_code);
GO

-- Bảng chuyển tiếp hỗ trợ Entity NotificationLog cũ trước khi xóa ở Bước 1.5
IF OBJECT_ID('dbo.notification_log', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.notification_log (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        report_id BIGINT NOT NULL,
        channel NVARCHAR(10) NOT NULL,
        recipient NVARCHAR(255) NOT NULL,
        status NVARCHAR(20) NOT NULL,
        sent_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        error_message NVARCHAR(MAX)
    );
END
GO
