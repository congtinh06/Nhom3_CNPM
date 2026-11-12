-- ==============================================================================
-- Rollback U22: Khôi phục cột category_id (products), parent_id (category),
--               các FK và 3 index gốc; đồng thời xóa composite index mới.
-- ==============================================================================

-- 1. Xóa composite index mới (dựa trên cột enum category)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_filter_composite' AND object_id = OBJECT_ID('dbo.products'))
    DROP INDEX idx_products_filter_composite ON dbo.products;
GO

-- 2. Khôi phục cột parent_id + FK + index trên dbo.category
IF COL_LENGTH('dbo.category', 'parent_id') IS NULL
BEGIN
    ALTER TABLE dbo.category
    ADD parent_id BIGINT NULL
        CONSTRAINT FK_category_parent FOREIGN KEY REFERENCES dbo.category(id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_category_parent_id' AND object_id = OBJECT_ID('dbo.category'))
BEGIN
    CREATE INDEX idx_category_parent_id ON dbo.category (parent_id);
END
GO

-- 3. Khôi phục cột category_id + FK + 2 index gốc trên dbo.products
IF COL_LENGTH('dbo.products', 'category_id') IS NULL
BEGIN
    ALTER TABLE dbo.products
    ADD category_id BIGINT NULL
        CONSTRAINT FK_products_category FOREIGN KEY REFERENCES dbo.category(id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_category_id' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_category_id ON dbo.products (category_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_filter_composite' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_filter_composite
    ON dbo.products (is_active, category_id, price, rating);
END
GO

