-- Rollback U5: Recreate index idx_job_poi_lang on dbo.translation_job(poi_id, language_code)

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_job_poi_lang'
      AND object_id = OBJECT_ID('dbo.translation_job')
)
BEGIN
    CREATE INDEX idx_job_poi_lang ON dbo.translation_job (poi_id, language_code);
END;
