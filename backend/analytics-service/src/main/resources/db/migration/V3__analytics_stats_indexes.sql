-- ==============================================================================
-- Echora - Flyway V3: index phục vụ báo cáo QR audio theo thời gian
-- ==============================================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_analytics_event_type_occurred' AND object_id = OBJECT_ID('dbo.analytics_event'))
    CREATE INDEX idx_analytics_event_type_occurred ON dbo.analytics_event (event_type, occurred_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_analytics_event_trigger_occurred' AND object_id = OBJECT_ID('dbo.analytics_event'))
    CREATE INDEX idx_analytics_event_trigger_occurred ON dbo.analytics_event (trigger_type, occurred_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_analytics_event_occurred' AND object_id = OBJECT_ID('dbo.analytics_event'))
    CREATE INDEX idx_analytics_event_occurred ON dbo.analytics_event (occurred_at);
GO
