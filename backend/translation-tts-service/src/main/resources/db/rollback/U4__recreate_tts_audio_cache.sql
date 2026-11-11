-- ==============================================================================
-- Rollback U4: Tái tạo bảng tts_audio_cache (nếu cần hoàn tác V4)
-- ==============================================================================

IF OBJECT_ID('dbo.tts_audio_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tts_audio_cache (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        content_hash NVARCHAR(64) NOT NULL UNIQUE,
        language_code NVARCHAR(10) NOT NULL,
        storage_type NVARCHAR(30) NOT NULL,
        file_path NVARCHAR(500) NOT NULL,
        public_url NVARCHAR(1000) NOT NULL,
        duration_seconds INT NOT NULL DEFAULT 0,
        voice_name NVARCHAR(100),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tts_hash' AND object_id = OBJECT_ID('dbo.tts_audio_cache'))
    CREATE INDEX idx_tts_hash ON dbo.tts_audio_cache (content_hash);
GO

