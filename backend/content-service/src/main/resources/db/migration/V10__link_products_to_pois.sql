-- V10: Liên kết sản phẩm lưu niệm với điểm du lịch.
-- Mỗi sản phẩm thuộc tối đa một điểm (poi_id NULL được). Không xoá dữ liệu hiện có.
-- Đồng thời nới ràng buộc CK_products_category để chấp nhận loại SOUVENIR.

-- 1. Thêm cột poi_id (NULL được) tham chiếu dbo.poi(id)
IF COL_LENGTH('dbo.products', 'poi_id') IS NULL
BEGIN
    ALTER TABLE dbo.products
        ADD poi_id BIGINT NULL
            CONSTRAINT FK_products_poi FOREIGN KEY REFERENCES dbo.poi(id);
END
GO

-- 2. Chỉ mục tra cứu sản phẩm theo điểm du lịch
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_products_poi_id' AND object_id = OBJECT_ID('dbo.products'))
BEGIN
    CREATE INDEX idx_products_poi_id ON dbo.products (poi_id);
END
GO

-- 3. Bỏ ràng buộc loại sản phẩm cũ (FOOD, DRINK) để thay bằng bộ giá trị mới có SOUVENIR
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_products_category' AND parent_object_id = OBJECT_ID('dbo.products'))
BEGIN
    ALTER TABLE dbo.products DROP CONSTRAINT CK_products_category;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_products_category' AND parent_object_id = OBJECT_ID('dbo.products'))
BEGIN
    ALTER TABLE dbo.products
        ADD CONSTRAINT CK_products_category CHECK (category IN ('FOOD', 'DRINK', 'SOUVENIR'));
END
GO
