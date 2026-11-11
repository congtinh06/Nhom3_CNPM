-- Rollback U8: Recreate redundant left-prefix index idx_analytics_event_type

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_analytics_event_type' AND object_id = OBJECT_ID('dbo.analytics_event'))
BEGIN
    CREATE INDEX idx_analytics_event_type ON dbo.analytics_event (event_type);
END;

