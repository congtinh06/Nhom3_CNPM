-- ==============================================================================
-- SaigonVoice — Flyway V1 Migration: Schema cho saigonvoice_auth_db
-- Toàn bộ chuỗi Unicode đều có tiền tố N'...' để tránh mất dấu tiếng Việt.
-- Collation của database là Vietnamese_100_CI_AS -> UNIQUE trên email tự động
-- không phân biệt hoa/thường và dấu; service vẫn chuẩn hóa email về chữ thường.
-- ==============================================================================

-- 1. BẢNG NGƯỜI DÙNG
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(150) NOT NULL,
        email NVARCHAR(320) NOT NULL,
        password_hash NVARCHAR(100) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'USER',          -- USER, ADMIN
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',      -- PENDING, ACTIVE, BLOCKED
        email_verified_at DATETIME2 NULL,
        last_login_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_users_email UNIQUE (email),
        CONSTRAINT CK_users_role CHECK (role IN ('USER', 'ADMIN')),
        CONSTRAINT CK_users_status CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED'))
    );
END
GO

-- 2. BẢNG REFRESH TOKEN (lưu HASH, không lưu token gốc)
IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.refresh_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        revoked_at DATETIME2 NULL,
        revoked_reason NVARCHAR(30) NULL,   -- ROTATED, LOGOUT, LOGOUT_ALL, REUSE_DETECTED, PASSWORD_CHANGED
        replaced_by_id BIGINT NULL,
        ip_address NVARCHAR(45) NULL,
        user_agent NVARCHAR(300) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_refresh_tokens_hash UNIQUE (token_hash),
        CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END
GO

-- 3. BẢNG TOKEN XÁC THỰC EMAIL (hạn 24h, dùng 1 lần)
IF OBJECT_ID('dbo.email_verification_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.email_verification_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_email_verification_hash UNIQUE (token_hash),
        CONSTRAINT FK_email_verification_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END
GO

-- 4. BẢNG TOKEN ĐẶT LẠI MẬT KHẨU (hạn 20 phút, dùng 1 lần)
IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_password_reset_hash UNIQUE (token_hash),
        CONSTRAINT FK_password_reset_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE
    );
END
GO

-- 5. BẢNG CHỐNG BRUTE FORCE / RATE LIMIT
IF OBJECT_ID('dbo.auth_rate_limit', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_rate_limit (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        bucket_key NVARCHAR(320) NOT NULL,
        window_start DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        hit_count INT NOT NULL DEFAULT 1,
        locked_until DATETIME2 NULL,
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_auth_rate_limit_key UNIQUE (bucket_key)
    );
END
GO

-- 6. CHỈ MỤC TỐI ƯU TRUY VẤN
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_created_at' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX IX_users_created_at ON dbo.users (created_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_role' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX IX_users_role ON dbo.users (role);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_active' AND object_id = OBJECT_ID('dbo.refresh_tokens'))
    CREATE INDEX IX_refresh_tokens_user_active ON dbo.refresh_tokens (user_id, revoked_at, expires_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_expires_at' AND object_id = OBJECT_ID('dbo.refresh_tokens'))
    CREATE INDEX IX_refresh_tokens_expires_at ON dbo.refresh_tokens (expires_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_email_verification_user' AND object_id = OBJECT_ID('dbo.email_verification_tokens'))
    CREATE INDEX IX_email_verification_user ON dbo.email_verification_tokens (user_id, expires_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_password_reset_user' AND object_id = OBJECT_ID('dbo.password_reset_tokens'))
    CREATE INDEX IX_password_reset_user ON dbo.password_reset_tokens (user_id, expires_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_auth_rate_limit_window_start' AND object_id = OBJECT_ID('dbo.auth_rate_limit'))
    CREATE INDEX IX_auth_rate_limit_window_start ON dbo.auth_rate_limit (window_start);
GO
