-- Rollback U20: Recreate indexes dropped in V20

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_poi_qr_token' AND object_id = OBJECT_ID('dbo.poi'))
BEGIN
    CREATE INDEX idx_poi_qr_token ON dbo.poi (qr_token);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_translation_poi_lang' AND object_id = OBJECT_ID('dbo.poi_translation'))
BEGIN
    CREATE INDEX idx_translation_poi_lang ON dbo.poi_translation (poi_id, language_code);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_chapter_translation_lang' AND object_id = OBJECT_ID('dbo.poi_chapter_translation'))
BEGIN
    CREATE INDEX idx_chapter_translation_lang ON dbo.poi_chapter_translation (chapter_id, language_code);
END;

