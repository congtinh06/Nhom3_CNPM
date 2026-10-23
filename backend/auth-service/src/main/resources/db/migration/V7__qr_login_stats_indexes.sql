-- ==============================================================================
-- Echora - Flyway V7: index phục vụ thống kê QR đăng nhập
-- Bảng qr_login_sessions được giữ lại 30 ngày (app.qr.retention) để admin xem
-- biểu đồ 7/30 ngày. Index này tối ưu truy vấn theo khoảng created_at + status.
-- ==============================================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_qr_login_created_status' AND object_id = OBJECT_ID('dbo.qr_login_sessions'))
    CREATE INDEX IX_qr_login_created_status ON dbo.qr_login_sessions (created_at, status);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_qr_login_user_created' AND object_id = OBJECT_ID('dbo.qr_login_sessions'))
    CREATE INDEX IX_qr_login_user_created ON dbo.qr_login_sessions (user_id, created_at);
GO
