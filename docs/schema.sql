-- ==============================================================================
-- BankShield — Khởi tạo schema cho MICROSOFT SQL SERVER 2022
-- Chuyển đổi từ PostgreSQL (2026-09). Bản gốc PostgreSQL: docs/schema.sql.postgres.bak
--
-- CÁCH DÙNG:
--  * File này được mount vào container và TỰ ĐỘNG chạy bởi service "mssql-db-init"
--    trong docker-compose.yml (sau khi 3 database đã được tạo).
--  * Vẫn có thể chạy thủ công khi cần:
--      sqlcmd -S <host> -U sa -P <password> -d <db> -i docs/schema.sql
--  * Toàn bộ script là IDEMPOTENT (IF NOT EXISTS / IF OBJECT_ID) — chạy lại
--    nhiều lần không lỗi và không nhân đôi seed data.
--
-- LƯU Ý: SQL Server không hỗ trợ psql "\c" — script này KHÔNG chọn DB.
--    Service mssql-db-init sẽ tách file theo marker "-- SECTION-DB: <ten_db>"
--    và chạy từng phần với đúng database (sqlcmd -d <ten_db>).
-- ==============================================================================

-- SECTION-DB: link_verification_db
-- ==============================================================================
IF OBJECT_ID('dbo.verification_result', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.verification_result (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,                    -- thay BIGSERIAL
        url NVARCHAR(MAX) NOT NULL,                             -- thay TEXT
        domain NVARCHAR(255) NOT NULL,
        is_phishing BIT NOT NULL,                               -- thay BOOLEAN
        risk_score NUMERIC(3, 2) NOT NULL CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
        sources NVARCHAR(MAX),                                  -- thay TEXT
        checked_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_verification_checked_at DEFAULT SYSDATETIMEOFFSET()  -- thay TIMESTAMP WITH TIME ZONE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_verification_domain' AND object_id = OBJECT_ID('dbo.verification_result'))
    CREATE INDEX idx_verification_domain ON dbo.verification_result(domain);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_verification_checked_at' AND object_id = OBJECT_ID('dbo.verification_result'))
    CREATE INDEX idx_verification_checked_at ON dbo.verification_result(checked_at DESC);
GO

-- Bảng cache dữ liệu Overpass POI cho poi-service (TTL 24h)
IF OBJECT_ID('dbo.poi_cache', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_cache (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        cache_key NVARCHAR(255) NOT NULL UNIQUE,
        response_json NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        expires_at DATETIME2 NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_cache_key' AND object_id = OBJECT_ID('dbo.poi_cache'))
    CREATE INDEX idx_poi_cache_key ON dbo.poi_cache(cache_key);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_cache_expires_at' AND object_id = OBJECT_ID('dbo.poi_cache'))
    CREATE INDEX idx_poi_cache_expires_at ON dbo.poi_cache(expires_at);
GO

-- ==============================================================================
-- SECTION-DB: report_db
-- ==============================================================================
IF OBJECT_ID('dbo.report', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.report (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,                    -- thay BIGSERIAL
        target_url NVARCHAR(MAX) NOT NULL,                      -- thay TEXT
        channel VARCHAR(10) NOT NULL CHECK (channel IN ('WEB', 'SMS')),
        reporter_contact NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),                              -- thay TEXT
        is_phishing BIT,                                        -- thay BOOLEAN
        risk_score NUMERIC(3, 2) CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'NOTIFIED', 'FAILED')),
        created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_report_created_at DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_report_status' AND object_id = OBJECT_ID('dbo.report'))
    CREATE INDEX idx_report_status ON dbo.report(status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_report_created_at' AND object_id = OBJECT_ID('dbo.report'))
    CREATE INDEX idx_report_created_at ON dbo.report(created_at DESC);
GO

-- Dữ liệu khởi tạo mẫu để minh họa (Seed Data)
-- NOW() - INTERVAL '...' thay bằng DATEADD(hour/minute, -n, SYSUTCDATETIME())
-- Guard từng dòng để idempotent
IF NOT EXISTS (SELECT 1 FROM dbo.report WHERE target_url = 'https://portal.vietcombank.com.vn')
INSERT INTO dbo.report (target_url, channel, reporter_contact, description, is_phishing, risk_score, status, created_at)
VALUES ('https://portal.vietcombank.com.vn', 'WEB', N'chuyengia.anninh@gmail.com', N'Cổng thông tin ngân hàng chính thức', 0, 0.00, 'VERIFIED', DATEADD(hour, -2, SYSUTCDATETIME()));
GO
IF NOT EXISTS (SELECT 1 FROM dbo.report WHERE target_url = 'https://example-bank-fake.com/login')
INSERT INTO dbo.report (target_url, channel, reporter_contact, description, is_phishing, risk_score, status, created_at)
VALUES ('https://example-bank-fake.com/login', 'WEB', N'nan.nhan.01@gmail.com', N'Trang giả mạo nhận thưởng khuyến mãi', 1, 0.85, 'VERIFIED', DATEADD(hour, -1, SYSUTCDATETIME()));
GO
IF NOT EXISTS (SELECT 1 FROM dbo.report WHERE target_url = 'https://techcom-otp-fake.top/xac-thuc')
INSERT INTO dbo.report (target_url, channel, reporter_contact, description, is_phishing, risk_score, status, created_at)
VALUES ('https://techcom-otp-fake.top/xac-thuc', 'SMS', N'0912345678', N'Tin nhắn Brandname giả mạo báo khóa tài khoản', 1, 1.00, 'VERIFIED', DATEADD(minute, -30, SYSUTCDATETIME()));
GO

-- ==============================================================================
-- SECTION-DB: notification_db
-- ==============================================================================
IF OBJECT_ID('dbo.notification_log', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.notification_log (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,                    -- thay BIGSERIAL
        report_id BIGINT NOT NULL,
        channel VARCHAR(10) NOT NULL CHECK (channel IN ('EMAIL', 'SMS')),
        recipient NVARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED')),
        sent_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_notification_sent_at DEFAULT SYSDATETIMEOFFSET(),
        error_message NVARCHAR(MAX)                             -- thay TEXT
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_notification_report_id' AND object_id = OBJECT_ID('dbo.notification_log'))
    CREATE INDEX idx_notification_report_id ON dbo.notification_log(report_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_notification_status' AND object_id = OBJECT_ID('dbo.notification_log'))
    CREATE INDEX idx_notification_status ON dbo.notification_log(status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_notification_sent_at' AND object_id = OBJECT_ID('dbo.notification_log'))
    CREATE INDEX idx_notification_sent_at ON dbo.notification_log(sent_at DESC);
GO

-- Dữ liệu audit mẫu (guard theo report_id + recipient để idempotent)
IF NOT EXISTS (SELECT 1 FROM dbo.notification_log WHERE report_id = 2 AND recipient = N'admin@anti-phishing-bank.example.com')
INSERT INTO dbo.notification_log (report_id, channel, recipient, status, sent_at, error_message)
VALUES (2, 'EMAIL', N'admin@anti-phishing-bank.example.com', 'SENT', DATEADD(hour, -1, SYSUTCDATETIME()), NULL);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.notification_log WHERE report_id = 2 AND recipient = N'nan.nhan.01@gmail.com')
INSERT INTO dbo.notification_log (report_id, channel, recipient, status, sent_at, error_message)
VALUES (2, 'EMAIL', N'nan.nhan.01@gmail.com', 'SENT', DATEADD(hour, -1, SYSUTCDATETIME()), NULL);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.notification_log WHERE report_id = 3 AND recipient = N'admin@anti-phishing-bank.example.com')
INSERT INTO dbo.notification_log (report_id, channel, recipient, status, sent_at, error_message)
VALUES (3, 'EMAIL', N'admin@anti-phishing-bank.example.com', 'SENT', DATEADD(minute, -30, SYSUTCDATETIME()), NULL);
GO
