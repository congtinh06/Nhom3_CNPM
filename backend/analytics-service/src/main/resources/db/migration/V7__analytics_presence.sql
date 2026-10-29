-- ==============================================================================
-- Echora - Flyway V7: bảng hiện diện (presence) để dashboard admin biết ai đang
-- online trong 5 phút gần nhất.
--
-- Trước đây "đang online" chỉ dựa vào sự kiện VISIT/SCAN/AUDIO_PLAY, mà VISIT
-- chỉ được gửi 1 lần khi mở tab. Khách ngồi xem web quá 5 phút sẽ bị tính là
-- offline dù vẫn đang mở trang. Frontend sẽ gửi heartbeat mỗi phút vào bảng này.
--
-- Mỗi phiên (session_id) chỉ có đúng 1 dòng (MERGE upsert) nên bảng không phình
-- theo số lần ping.
-- ==============================================================================

IF OBJECT_ID('dbo.analytics_presence', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.analytics_presence (
        session_id NVARCHAR(64) NOT NULL PRIMARY KEY,
        last_seen_at DATETIME2 NOT NULL,
        language_code NVARCHAR(5) NULL,
        device_type NVARCHAR(20) NULL
    );
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name = 'idx_analytics_presence_last_seen'
      AND object_id = OBJECT_ID('dbo.analytics_presence')
)
BEGIN
    CREATE INDEX idx_analytics_presence_last_seen
        ON dbo.analytics_presence (last_seen_at);
END
GO
