-- Flyway V3: Drop duplicate index on translation_cache.content_hash covered by UQ_translation_cache_hash

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_trans_cache_hash' AND object_id = OBJECT_ID('dbo.translation_cache'))
BEGIN
    DROP INDEX idx_trans_cache_hash ON dbo.translation_cache;
END;

