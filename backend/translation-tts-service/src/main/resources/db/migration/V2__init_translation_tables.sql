IF OBJECT_ID('dbo.notification_log', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.notification_log;
END
GO

IF OBJECT_ID('dbo.translation_job_log', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.translation_job_log;
END
GO

IF OBJECT_ID('dbo.translation_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_cache (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        content_hash NVARCHAR(64) NOT NULL UNIQUE,
        language_code NVARCHAR(10) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        summary NVARCHAR(1000) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        historical_significance NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_trans_cache_hash' AND object_id = OBJECT_ID('dbo.translation_cache'))
BEGIN
    CREATE INDEX idx_trans_cache_hash ON dbo.translation_cache (content_hash);
END
GO

IF OBJECT_ID('dbo.translation_job', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_job (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        language_code NVARCHAR(10) NOT NULL,
        content_hash NVARCHAR(64) NOT NULL,
        status NVARCHAR(30) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        error_message NVARCHAR(500),
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_translation_job_status CHECK (status IN ('RECEIVED', 'TRANSLATED', 'DONE', 'FAILED_TRANSLATION', 'FAILED_TTS')),
        CONSTRAINT UQ_translation_job UNIQUE (poi_id, language_code, content_hash)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_job_poi_lang' AND object_id = OBJECT_ID('dbo.translation_job'))
BEGIN
    CREATE INDEX idx_job_poi_lang ON dbo.translation_job (poi_id, language_code);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_job_hash' AND object_id = OBJECT_ID('dbo.translation_job'))
BEGIN
    CREATE INDEX idx_job_hash ON dbo.translation_job (content_hash);
END
GO
