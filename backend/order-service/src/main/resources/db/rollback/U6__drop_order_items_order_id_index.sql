-- Rollback U6: Drop foreign key supporting index on order_items.order_id
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_order_items_order_id' AND object_id = OBJECT_ID('dbo.order_items'))
BEGIN
    DROP INDEX IX_order_items_order_id ON dbo.order_items;
END;

