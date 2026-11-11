-- ==============================================================================
-- Rollback U21: Tái tạo bảng product_translations (nếu cần hoàn tác V21)
-- ==============================================================================

IF OBJECT_ID('dbo.product_translations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_translations (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        product_id BIGINT NOT NULL,
        lang NVARCHAR(10) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        source NVARCHAR(20) NOT NULL CONSTRAINT DF_product_translations_source DEFAULT 'MANUAL',
        CONSTRAINT FK_product_translations_product FOREIGN KEY (product_id) REFERENCES dbo.products(id) ON DELETE CASCADE,
        CONSTRAINT UQ_product_translations_product_lang UNIQUE (product_id, lang),
        CONSTRAINT CK_product_translations_source CHECK (source IN ('AUTO', 'MANUAL'))
    );
END
GO

