USE echora_content_db;
GO
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @premiumId BIGINT = (SELECT id FROM echora_auth_db.dbo.users WHERE email = 'demo.premium@echora.test');
DECLARE @freeId BIGINT = (SELECT id FROM echora_auth_db.dbo.users WHERE email = 'user@echora.local');
DECLARE @premiumName NVARCHAR(100) = ISNULL((SELECT full_name FROM echora_auth_db.dbo.users WHERE email = 'demo.premium@echora.test'), N'Khách Demo Premium');
DECLARE @freeName NVARCHAR(100) = ISNULL((SELECT full_name FROM echora_auth_db.dbo.users WHERE email = 'user@echora.local'), N'Khách Demo');

IF NOT EXISTS (SELECT 1 FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0001')
BEGIN
    INSERT INTO dbo.feedback_threads (ticket, name, email, token_hash, status, created_at, updated_at, owner_user_id)
    VALUES ('demo-feedback-0001', @premiumName, 'demo.premium@echora.test',
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'demo-seed-0001'), 2),
            'REPLIED', DATEADD(DAY, -3, @now), DATEADD(DAY, -2, @now), @premiumId);
END

DECLARE @t1 BIGINT = (SELECT id FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0001');
IF NOT EXISTS (SELECT 1 FROM dbo.feedback_messages WHERE thread_id = @t1)
BEGIN
    INSERT INTO dbo.feedback_messages (thread_id, sender, content, created_at)
    VALUES (@t1, 'CUSTOMER', N'Xin chào, gói Premium có nghe được thuyết minh tiếng Nhật tại Bảo tàng Mỹ thuật không?', DATEADD(DAY, -3, @now)),
           (@t1, 'ADMIN', N'Chào bạn, gói Premium mở khóa toàn bộ thuyết minh tiếng Anh, Nhật và Hàn tại mọi điểm đến, bao gồm Bảo tàng Mỹ thuật. Bạn chỉ cần chọn ngôn ngữ trên trình phát là nghe được ngay nhé.', DATEADD(DAY, -2, @now));
END

IF NOT EXISTS (SELECT 1 FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0002')
BEGIN
    INSERT INTO dbo.feedback_threads (ticket, name, email, token_hash, status, created_at, updated_at, owner_user_id)
    VALUES ('demo-feedback-0002', @premiumName, 'demo.premium@echora.test',
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'demo-seed-0002'), 2),
            'OPEN', DATEADD(HOUR, -6, @now), DATEADD(HOUR, -6, @now), @premiumId);
END

DECLARE @t2 BIGINT = (SELECT id FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0002');
IF NOT EXISTS (SELECT 1 FROM dbo.feedback_messages WHERE thread_id = @t2)
BEGIN
    INSERT INTO dbo.feedback_messages (thread_id, sender, content, created_at)
    VALUES (@t2, 'CUSTOMER', N'Tôi đã quét mã QR ở điểm đến nhưng không thấy nút chuyển sang tiếng Hàn. Nhờ Echora kiểm tra giúp.', DATEADD(HOUR, -6, @now));
END

IF NOT EXISTS (SELECT 1 FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0003')
BEGIN
    INSERT INTO dbo.feedback_threads (ticket, name, email, token_hash, status, created_at, updated_at, owner_user_id)
    VALUES ('demo-feedback-0003', @freeName, 'user@echora.local',
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', 'demo-seed-0003'), 2),
            'OPEN', DATEADD(DAY, -1, @now), DATEADD(DAY, -1, @now), @freeId);
END

DECLARE @t3 BIGINT = (SELECT id FROM dbo.feedback_threads WHERE ticket = 'demo-feedback-0003');
IF NOT EXISTS (SELECT 1 FROM dbo.feedback_messages WHERE thread_id = @t3)
BEGIN
    INSERT INTO dbo.feedback_messages (thread_id, sender, content, created_at)
    VALUES (@t3, 'CUSTOMER', N'Đơn hàng SV-20261116 của tôi đang ở trạng thái Đang xử lý. Khoảng bao lâu thì nhận được quà lưu niệm?', DATEADD(DAY, -1, @now));
END

SELECT t.ticket, t.status, t.owner_user_id, COUNT(m.id) AS message_count
FROM dbo.feedback_threads t
LEFT JOIN dbo.feedback_messages m ON m.thread_id = t.id
WHERE t.ticket LIKE 'demo-feedback-%'
GROUP BY t.ticket, t.status, t.owner_user_id;
