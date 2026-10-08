-- ==============================================================================
-- Flyway Migration: V4__add_product_filter_indexes.sql
-- Module: Content / Product Catalog Filtering & Hierarchy
-- ==============================================================================

-- 1. Hỗ trợ quan hệ phân cấp Cha - Con cho bảng danh mục (vd: "Đồ uống" -> "Cà phê")
IF COL_LENGTH('dbo.category', 'parent_id') IS NULL
BEGIN
    ALTER TABLE dbo.category
    ADD parent_id BIGINT NULL
        CONSTRAINT FK_category_parent FOREIGN KEY REFERENCES dbo.category(id);
END
GO

-- 2. Bổ sung category_id, rating và reviews_count vào bảng products
IF COL_LENGTH('dbo.products', 'category_id') IS NULL
BEGIN
    ALTER TABLE dbo.products
    ADD category_id BIGINT NULL
        CONSTRAINT FK_products_category FOREIGN KEY REFERENCES dbo.category(id);
END
GO

IF COL_LENGTH('dbo.products', 'rating') IS NULL
BEGIN
    ALTER TABLE dbo.products
    ADD rating DECIMAL(2, 1) NOT NULL
        CONSTRAINT DF_products_rating DEFAULT 5.0;
END
GO

IF COL_LENGTH('dbo.products', 'reviews_count') IS NULL
BEGIN
    ALTER TABLE dbo.products
    ADD reviews_count INT NOT NULL
        CONSTRAINT DF_products_reviews_count DEFAULT 0;
END
GO

-- 3. Tạo Indexes tối ưu hóa cho truy vấn tìm kiếm và lọc động (Product Filtering)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_name' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_name ON dbo.products (name);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_category_id' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_category_id ON dbo.products (category_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_price' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_price ON dbo.products (price);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_rating' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_rating ON dbo.products (rating);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_category_parent_id' AND object_id = OBJECT_ID('dbo.category'))
BEGIN
    CREATE INDEX idx_category_parent_id ON dbo.category (parent_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_filter_composite' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_filter_composite
    ON dbo.products (is_active, category_id, price, rating);
END
GO
