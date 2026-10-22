-- ==============================================================================
-- Echora - Flyway V2: phan loai don hang Premium (goi 3 ngon ngu)
-- Don Premium khong giao hang, chi dung de thanh toan qua VNPAY.
-- ==============================================================================

IF COL_LENGTH('dbo.orders', 'order_type') IS NULL
BEGIN
    ALTER TABLE dbo.orders
        ADD order_type NVARCHAR(20) NOT NULL
            CONSTRAINT DF_orders_order_type DEFAULT N'PRODUCT';
END
GO

IF COL_LENGTH('dbo.orders', 'premium_package') IS NULL
BEGIN
    ALTER TABLE dbo.orders
        ADD premium_package NVARCHAR(40) NULL;
END
GO
