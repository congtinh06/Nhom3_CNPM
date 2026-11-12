-- ==============================================================================
-- V22: Xóa cột dư thừa category_id (products) và parent_id (category),
--      đồng thời tạo lại composite index lọc theo cột enum category.
-- Lý do:
--   - Bảng products lọc thực tế dựa trên cột enum category ('FOOD','DRINK','SOUVENIR'),
--     cột category_id không còn dùng để lọc ở giao diện và dữ liệu thực tế luôn NULL.
--   - Bảng category chỉ dùng phẳng 1 cấp, không có danh mục cha-con (parent_id NULL).
-- Rollback: U22__restore_category_id_and_parent_id.sql
-- ==============================================================================

-- Bước 1: Drop composite index cũ trên products (chứa category_id)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_filter_composite' AND object_id = OBJECT_ID('dbo.products'))
    DROP INDEX idx_products_filter_composite ON dbo.products;
GO

-- Bước 2: Drop index đơn trên products.category_id
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_category_id' AND object_id = OBJECT_ID('dbo.products'))
    DROP INDEX idx_products_category_id ON dbo.products;
GO

-- Bước 3: Drop FK constraint FK_products_category trên dbo.products
IF COL_LENGTH('dbo.products', 'category_id') IS NOT NULL
BEGIN
    DECLARE @fkProduct NVARCHAR(200);
    SELECT @fkProduct = fk.name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
    WHERE fk.parent_object_id = OBJECT_ID('dbo.products')
      AND c.name = 'category_id';

    IF @fkProduct IS NOT NULL
        EXEC('ALTER TABLE dbo.products DROP CONSTRAINT ' + @fkProduct);

    -- Dọn default constraint nếu có trước khi drop column
    DECLARE @dfProduct NVARCHAR(200);
    SELECT @dfProduct = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.products')
      AND c.name = 'category_id';

    IF @dfProduct IS NOT NULL
        EXEC('ALTER TABLE dbo.products DROP CONSTRAINT ' + @dfProduct);

    -- Bước 4: Drop cột category_id trên dbo.products
    ALTER TABLE dbo.products DROP COLUMN category_id;
END
GO

-- Bước 5: Drop index đơn trên category.parent_id
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_category_parent_id' AND object_id = OBJECT_ID('dbo.category'))
    DROP INDEX idx_category_parent_id ON dbo.category;
GO

-- Bước 6: Drop FK constraint FK_category_parent trên dbo.category
IF COL_LENGTH('dbo.category', 'parent_id') IS NOT NULL
BEGIN
    DECLARE @fkCategory NVARCHAR(200);
    SELECT @fkCategory = fk.name
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
    WHERE fk.parent_object_id = OBJECT_ID('dbo.category')
      AND c.name = 'parent_id';

    IF @fkCategory IS NOT NULL
        EXEC('ALTER TABLE dbo.category DROP CONSTRAINT ' + @fkCategory);

    -- Dọn default constraint nếu có trước khi drop column
    DECLARE @dfCategory NVARCHAR(200);
    SELECT @dfCategory = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.category')
      AND c.name = 'parent_id';

    IF @dfCategory IS NOT NULL
        EXEC('ALTER TABLE dbo.category DROP CONSTRAINT ' + @dfCategory);

    -- Bước 7: Drop cột parent_id trên dbo.category
    ALTER TABLE dbo.category DROP COLUMN parent_id;
END
GO

-- Bước 8: Tạo lại composite index phục vụ lọc sản phẩm theo cột enum category (NVARCHAR(20))
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_filter_composite' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_filter_composite
    ON dbo.products (is_active, category, price, rating);
END
GO

