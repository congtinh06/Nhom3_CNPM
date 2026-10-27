-- ==============================================================================
-- Echora - Flyway V5: luu so tien giam gia Premium cho don hang san pham.
-- Gia tri mac dinh 0 de tuong thich voi cac don cu va don Premium/POI.
-- ==============================================================================

IF COL_LENGTH('dbo.orders', 'discount_amount') IS NULL
BEGIN
    ALTER TABLE dbo.orders
        ADD discount_amount DECIMAL(12, 0) NOT NULL
            CONSTRAINT DF_orders_discount_amount DEFAULT 0;
END
GO
