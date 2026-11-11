-- Flyway V8: Drop redundant left-prefix index idx_analytics_event_type covered by idx_analytics_event_type_occurred

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_analytics_event_type' AND object_id = OBJECT_ID('dbo.analytics_event'))
BEGIN
    DROP INDEX idx_analytics_event_type ON dbo.analytics_event;
END;

