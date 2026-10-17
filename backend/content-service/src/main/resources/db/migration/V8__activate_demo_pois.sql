-- ==============================================================================
-- Echora - Flyway V8 Migration
-- Kích hoạt 2 POI demo (Chùa Bà Thiên Hậu, Cầu Ba Son) để du khách thấy đủ 7 điểm.
-- Trước đây R__seed_demo.sql đặt 2 POI này INACTIVE (chỉ để tham chiếu).
--
-- Nguyên tắc an toàn:
--   * Chỉ UPDATE, KHÔNG xóa dữ liệu.
--   * Idempotent: chạy lại nhiều lần không đổi kết quả.
--   * Slug chỉ điền khi còn NULL (không ghi đè slug admin đã đặt).
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

UPDATE dbo.poi
SET status = 'ACTIVE',
    updated_at = SYSUTCDATETIME()
WHERE code IN ('POI_THIEN_HAU_01', 'POI_CAU_BA_SON_01')
  AND status <> 'ACTIVE';
GO

UPDATE dbo.poi
SET slug = N'chua-ba-thien-hau',
    updated_at = SYSUTCDATETIME()
WHERE code = 'POI_THIEN_HAU_01'
  AND slug IS NULL;
GO

UPDATE dbo.poi
SET slug = N'cau-ba-son',
    updated_at = SYSUTCDATETIME()
WHERE code = 'POI_CAU_BA_SON_01'
  AND slug IS NULL;
GO
