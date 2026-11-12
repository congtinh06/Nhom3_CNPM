-- Flyway V5: Drop left-prefix redundant index on translation_job(poi_id, language_code)
-- covered by UQ_translation_job(poi_id, language_code, content_hash).

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_job_poi_lang'
      AND object_id = OBJECT_ID('dbo.translation_job')
)
BEGIN
    DROP INDEX idx_job_poi_lang ON dbo.translation_job;
END;
