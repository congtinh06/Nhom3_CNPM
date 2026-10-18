-- ==============================================================================
-- Echora - Flyway V9 Migration
-- Thêm thông tin theo dõi audio theo từng ngôn ngữ vào poi_translation:
--   * audio_error_reason    : lý do lỗi dịch/TTS gần nhất (nếu có)
--   * audio_last_attempt_at : thời điểm thử tổng hợp audio gần nhất
-- Dùng cho cột "Thuyết minh đa ngôn ngữ" ở trang quản trị.
--
-- Nguyên tắc an toàn:
--   * Chỉ THÊM cột, KHÔNG xóa/đổi dữ liệu hiện có.
--   * Idempotent: chạy lại nhiều lần không đổi kết quả.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.poi_translation', 'audio_error_reason') IS NULL
    ALTER TABLE dbo.poi_translation
        ADD audio_error_reason NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.poi_translation', 'audio_last_attempt_at') IS NULL
    ALTER TABLE dbo.poi_translation
        ADD audio_last_attempt_at DATETIME2 NULL;
GO

-- Backfill: lấy updated_at làm mốc thử gần nhất cho dữ liệu sẵn có.
UPDATE dbo.poi_translation
SET audio_last_attempt_at = updated_at
WHERE audio_last_attempt_at IS NULL;
GO
