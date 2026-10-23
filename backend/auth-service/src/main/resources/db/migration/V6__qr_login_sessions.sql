-- ==============================================================================
-- Echora - Flyway V6: Dang nhap bang ma QR (kieu Zalo Web)
-- Thiet bi A tao phien -> thiet bi B (da dang nhap) quet + xac nhan.
-- Chi luu SHA-256 cua 2 token; token goc chi ton tai o client.
-- ==============================================================================

IF OBJECT_ID('dbo.qr_login_sessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.qr_login_sessions (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        qr_token_hash VARCHAR(64) NOT NULL,
        exchange_token_hash VARCHAR(64) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        user_id BIGINT NULL,
        created_ip NVARCHAR(45) NULL,
        created_user_agent NVARCHAR(300) NULL,
        approved_ip NVARCHAR(45) NULL,
        approved_user_agent NVARCHAR(300) NULL,
        expires_at DATETIME2 NOT NULL,
        scanned_at DATETIME2 NULL,
        approved_at DATETIME2 NULL,
        consumed_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_qr_login_qr_hash UNIQUE (qr_token_hash),
        CONSTRAINT UQ_qr_login_exchange_hash UNIQUE (exchange_token_hash),
        CONSTRAINT FK_qr_login_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE SET NULL,
        CONSTRAINT CK_qr_login_status CHECK (status IN ('PENDING', 'SCANNED', 'APPROVED', 'DENIED', 'CONSUMED', 'EXPIRED', 'CANCELLED'))
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_qr_login_status_expires' AND object_id = OBJECT_ID('dbo.qr_login_sessions'))
    CREATE INDEX IX_qr_login_status_expires ON dbo.qr_login_sessions (status, expires_at);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_qr_login_expires' AND object_id = OBJECT_ID('dbo.qr_login_sessions'))
    CREATE INDEX IX_qr_login_expires ON dbo.qr_login_sessions (expires_at);
GO
