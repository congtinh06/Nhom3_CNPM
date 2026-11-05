-- Ràng buộc trạng thái hiển thị của POI, khớp comment ở Poi#status.
-- Giá trị hợp lệ: ACTIVE (công khai), INACTIVE (ẩn), MAINTENANCE (tạm dừng).
-- Dữ liệu seed hiện tại chỉ dùng 'ACTIVE' nên thêm constraint an toàn.
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_poi_status' AND parent_object_id = OBJECT_ID('dbo.poi')
)
BEGIN
    ALTER TABLE dbo.poi WITH CHECK
        ADD CONSTRAINT CK_poi_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'));
END;
GO
