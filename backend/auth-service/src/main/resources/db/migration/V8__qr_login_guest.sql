-- ==============================================================================
-- Echora - Flyway V8: Dang nhap QR bo sung che do khach (dung thu khong tai khoan).
-- Thiet bi B chua co tai khoan quet ma -> phien chuyen sang GUEST_APPROVED
-- de thiet bi A tiep tuc o che do khach. Khong cap token cho cac phien nay.
-- ==============================================================================

IF OBJECT_ID('dbo.qr_login_sessions', 'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'CK_qr_login_status' AND parent_object_id = OBJECT_ID('dbo.qr_login_sessions')
    )
    BEGIN
        ALTER TABLE dbo.qr_login_sessions DROP CONSTRAINT CK_qr_login_status;
    END

    ALTER TABLE dbo.qr_login_sessions
        ADD CONSTRAINT CK_qr_login_status
        CHECK (status IN ('PENDING', 'SCANNED', 'APPROVED', 'GUEST_APPROVED', 'DENIED', 'CONSUMED', 'EXPIRED', 'CANCELLED'));
END
GO
