-- ==============================================================================
-- V21: Xóa bảng product_translations (không còn được sử dụng trong business logic)
-- Lý do: ProductTranslationRepository chỉ định nghĩa 2 phương thức finder không có
--        caller nào trong toàn bộ service layer. Sản phẩm đã dùng trường name/description
--        tiếng Việt trực tiếp trên bảng products. Cascade xóa dữ liệu con trước.
-- Rollback: U21__recreate_product_translations.sql
-- ==============================================================================

IF OBJECT_ID('dbo.product_translations', 'U') IS NOT NULL
BEGIN
    -- Xóa FK constraint trước (trường hợp ON DELETE CASCADE không tự xóa constraint)
    DECLARE @fk NVARCHAR(200);
    SELECT @fk = name FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.product_translations')
      AND referenced_object_id = OBJECT_ID('dbo.products');
    IF @fk IS NOT NULL
        EXEC('ALTER TABLE dbo.product_translations DROP CONSTRAINT ' + @fk);

    DROP TABLE dbo.product_translations;
END
GO

