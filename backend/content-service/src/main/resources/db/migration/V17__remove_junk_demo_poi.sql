-- ==============================================================================
-- Echora - Flyway V17
-- Xoa POI rac id=40003 (code 'bb', ten 'bbbbb', toa do 25,25) tung lot vao
-- danh sach public. Chi xoa khi CA BA dieu kien id + code + ten cung khop, nen
-- migration an toan va idempotent: chay lai khi khong con dong nao thi khong lam gi.
--
-- Luu y: translation_job nam o database echora_translation_db, khong xoa o day.
-- Cac job cu cua POI nay chi con la lich su, khong anh huong danh sach public.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.poi
    WHERE id = 40003
      AND code = N'bb'
      AND name = N'bbbbb'
      AND latitude = 25.0000000
      AND longitude = 25.0000000
)
BEGIN
    -- poi_translation co FK ON DELETE CASCADE, nhung xoa tuong minh de ro rang
    -- va de chay duoc tren moi bien the schema.
    DELETE FROM dbo.poi_translation
    WHERE poi_id = 40003;

    DELETE FROM dbo.poi
    WHERE id = 40003
      AND code = N'bb'
      AND name = N'bbbbb'
      AND latitude = 25.0000000
      AND longitude = 25.0000000;
END
GO
