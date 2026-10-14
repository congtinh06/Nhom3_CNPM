-- ==============================================================================
-- SaigonVoice — Flyway V2: Đăng nhập bằng Google (Google Identity Services)
-- Bổ sung cột google_sub (định danh Google, unique nhưng cho phép NULL) và cho
-- phép password_hash NULL đối với tài khoản chỉ đăng nhập bằng Google.
-- Migration idempotent: an toàn khi chạy trên database đã có dữ liệu.
-- ==============================================================================

-- 1. Thêm cột google_sub nếu chưa tồn tại (các bản ghi cũ nhận NULL)
IF COL_LENGTH('dbo.users', 'google_sub') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD google_sub NVARCHAR(255) NULL;
END
GO

-- 2. Cho phép password_hash NULL (tài khoản Google-only không có mật khẩu)
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.users')
      AND name = 'password_hash'
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE dbo.users ALTER COLUMN password_hash NVARCHAR(100) NULL;
END
GO

-- 3. Unique index có lọc: nhiều NULL được phép, nhưng google_sub không trùng nhau
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_users_google_sub'
      AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    CREATE UNIQUE INDEX UQ_users_google_sub
        ON dbo.users (google_sub)
        WHERE google_sub IS NOT NULL;
END
GO
