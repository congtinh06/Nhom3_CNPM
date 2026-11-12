-- Flyway V23: Add foreign key supporting index on poi.category_id (FK_poi_category)

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_poi_category_id'
      AND object_id = OBJECT_ID('dbo.poi')
)
BEGIN
    CREATE INDEX idx_poi_category_id ON dbo.poi (category_id);
END;
