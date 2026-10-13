-- ==============================================================================
-- SaigonVoice — Flyway V5 Migration
-- 1. Thêm cột slug cho POI (định danh thân thiện URL, khớp nearbyPois.json của FE).
--    Cho phép NULL vì các POI cũ/nội bộ chưa có slug. Unique khi khác NULL.
-- 2. Thêm cột translation_source cho poi_translation: 'AUTO' (dịch máy) hoặc
--    'MANUAL' (văn bản do người viết). Pipeline chỉ dịch máy những ngôn ngữ AUTO;
--    ngôn ngữ MANUAL được dùng nguyên văn.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.poi', 'slug') IS NULL
    ALTER TABLE dbo.poi ADD slug NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_poi_slug' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE UNIQUE INDEX ux_poi_slug ON dbo.poi (slug) WHERE slug IS NOT NULL;
GO

IF COL_LENGTH('dbo.poi_translation', 'translation_source') IS NULL
    ALTER TABLE dbo.poi_translation
        ADD translation_source NVARCHAR(20) NOT NULL
            CONSTRAINT DF_poi_translation_source DEFAULT 'AUTO';
GO
