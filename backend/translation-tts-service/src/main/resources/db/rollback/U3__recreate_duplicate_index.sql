-- Rollback U3: Recreate duplicate index on translation_cache.content_hash

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_trans_cache_hash' AND object_id = OBJECT_ID('dbo.translation_cache'))
BEGIN
    CREATE INDEX idx_trans_cache_hash ON dbo.translation_cache (content_hash);
END;

