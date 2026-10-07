IF OBJECT_ID('dbo.products', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        slug NVARCHAR(150) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        category NVARCHAR(20) NOT NULL,
        short_description NVARCHAR(500) NULL,
        description NVARCHAR(MAX) NULL,
        price DECIMAL(12,0) NOT NULL,
        image_path NVARCHAR(500) NULL,
        is_active BIT NOT NULL CONSTRAINT DF_products_is_active DEFAULT 1,
        sort_order INT NOT NULL CONSTRAINT DF_products_sort_order DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_products_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_products_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_products_slug UNIQUE (slug),
        CONSTRAINT CK_products_category CHECK (category IN ('FOOD', 'DRINK')),
        CONSTRAINT CK_products_price CHECK (price >= 0)
    );
END
GO

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

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_category_active_sort' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_category_active_sort ON dbo.products (category, is_active, sort_order);
END
GO
