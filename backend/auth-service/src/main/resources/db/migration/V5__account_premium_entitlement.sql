-- ==============================================================================
-- Echora - Flyway V5: Premium entitlement thuoc tai khoan
-- Trang thai Premium do backend quan ly, khong con luu theo thiet bi.
-- ==============================================================================

IF COL_LENGTH('dbo.users', 'plan') IS NULL
BEGIN
    ALTER TABLE dbo.users
        ADD [plan] NVARCHAR(20) NOT NULL
            CONSTRAINT DF_users_plan DEFAULT 'FREE' WITH VALUES;
END
GO

IF COL_LENGTH('dbo.users', 'premium_expires_at') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD premium_expires_at DATETIME2 NULL;
END
GO

IF COL_LENGTH('dbo.users', 'premium_source_order_code') IS NULL
BEGIN
    ALTER TABLE dbo.users ADD premium_source_order_code NVARCHAR(64) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_users_plan')
BEGIN
    ALTER TABLE dbo.users
        ADD CONSTRAINT CK_users_plan CHECK ([plan] IN ('FREE', 'PREMIUM'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_plan_expires' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX IX_users_plan_expires ON dbo.users ([plan], premium_expires_at);
GO
