-- ==============================================================================
-- Flyway V2: Drop legacy BankShield tables and create analytics_event table
-- ==============================================================================

IF OBJECT_ID('dbo.report', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.report;
END
GO

IF OBJECT_ID('dbo.scan_log', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.scan_log;
END
GO

IF OBJECT_ID('dbo.analytics_event', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.analytics_event (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        event_id NVARCHAR(36) NOT NULL,
        event_type NVARCHAR(20) NOT NULL,
        poi_id BIGINT NOT NULL,
        language_code NVARCHAR(5) NOT NULL,
        trigger_type NVARCHAR(10) NULL,
        completed BIT NULL,
        session_id NVARCHAR(64) NULL,
        occurred_at DATETIME2 NOT NULL,
        CONSTRAINT uq_analytics_event_id UNIQUE (event_id),
        CONSTRAINT chk_analytics_event_type CHECK (event_type IN ('SCAN', 'AUDIO_PLAY')),
        CONSTRAINT chk_analytics_language_code CHECK (language_code IN ('vi', 'en', 'ja', 'ko')),
        CONSTRAINT chk_analytics_trigger_type CHECK (trigger_type IS NULL OR trigger_type IN ('QR', 'GPS', 'MANUAL'))
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_analytics_event_poi_id' AND object_id = OBJECT_ID('dbo.analytics_event'))
BEGIN
    CREATE INDEX idx_analytics_event_poi_id ON dbo.analytics_event (poi_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_analytics_event_type' AND object_id = OBJECT_ID('dbo.analytics_event'))
BEGIN
    CREATE INDEX idx_analytics_event_type ON dbo.analytics_event (event_type);
END
GO
