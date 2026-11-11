-- ==============================================================================
-- V4: Xóa bảng tts_audio_cache (không còn được sử dụng trong code)
-- Lý do: Entity TtsAudioCache không tồn tại, không có Repository hay Service nào
--        tham chiếu tới bảng này. Bảng là di tích từ thiết kế cũ.
-- Rollback: U4__recreate_tts_audio_cache.sql
-- ==============================================================================

IF OBJECT_ID('dbo.tts_audio_cache', 'U') IS NOT NULL
BEGIN
    -- Xóa index trước khi drop bảng
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tts_hash' AND object_id = OBJECT_ID('dbo.tts_audio_cache'))
        DROP INDEX idx_tts_hash ON dbo.tts_audio_cache;

    -- Xóa unique constraint (idx_trans_cache_hash từ V3 nếu tồn tại trên DB đang chạy)
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_trans_cache_hash' AND object_id = OBJECT_ID('dbo.tts_audio_cache'))
        DROP INDEX idx_trans_cache_hash ON dbo.tts_audio_cache;

    DROP TABLE dbo.tts_audio_cache;
END
GO

