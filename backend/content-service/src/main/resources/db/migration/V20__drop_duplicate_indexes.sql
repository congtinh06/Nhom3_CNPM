-- Flyway V20: Drop duplicate indexes covered by existing UNIQUE constraints

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_poi_qr_token' AND object_id = OBJECT_ID('dbo.poi'))
BEGIN
    DROP INDEX idx_poi_qr_token ON dbo.poi;
END;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_translation_poi_lang' AND object_id = OBJECT_ID('dbo.poi_translation'))
BEGIN
    DROP INDEX idx_translation_poi_lang ON dbo.poi_translation;
END;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_chapter_translation_lang' AND object_id = OBJECT_ID('dbo.poi_chapter_translation'))
BEGIN
    DROP INDEX idx_chapter_translation_lang ON dbo.poi_chapter_translation;
END;

