-- Rollback U23: Drop foreign key supporting index on poi.category_id

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_poi_category_id'
      AND object_id = OBJECT_ID('dbo.poi')
)
BEGIN
    DROP INDEX idx_poi_category_id ON dbo.poi;
END;
