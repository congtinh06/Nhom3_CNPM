-- ==============================================================================
-- SaigonVoice — Script khởi tạo 3 Databases & 3 Logins độc lập trên SQL Server 2022
-- Đảm bảo Idempotent (chạy lại không lỗi).
-- Collation: Vietnamese_100_CI_AS (chuẩn Unicode phân biệt dấu thanh tiếng Việt)
-- ==============================================================================

-- 1. TẠO 3 DATABASE ĐỘC LẬP
IF DB_ID('saigonvoice_content_db') IS NULL
BEGIN
    PRINT 'Creating database [saigonvoice_content_db]...';
    CREATE DATABASE saigonvoice_content_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('saigonvoice_translation_db') IS NULL
BEGIN
    PRINT 'Creating database [saigonvoice_translation_db]...';
    CREATE DATABASE saigonvoice_translation_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('saigonvoice_analytics_db') IS NULL
BEGIN
    PRINT 'Creating database [saigonvoice_analytics_db]...';
    CREATE DATABASE saigonvoice_analytics_db COLLATE Vietnamese_100_CI_AS;
END
GO

-- 2. TẠO SERVER LOGINS VỚI PASSWORD TRUYỀN QUA SQLCMD VARIABLES
-- content_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(CONTENT_DB_USER)')
BEGIN
    PRINT 'Creating login [$(CONTENT_DB_USER)]...';
    CREATE LOGIN [$(CONTENT_DB_USER)] WITH PASSWORD = '$(CONTENT_DB_PASSWORD)', DEFAULT_DATABASE = saigonvoice_content_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(CONTENT_DB_USER)]...';
    ALTER LOGIN [$(CONTENT_DB_USER)] WITH PASSWORD = '$(CONTENT_DB_PASSWORD)';
END
GO

-- translation_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(TRANSLATION_DB_USER)')
BEGIN
    PRINT 'Creating login [$(TRANSLATION_DB_USER)]...';
    CREATE LOGIN [$(TRANSLATION_DB_USER)] WITH PASSWORD = '$(TRANSLATION_DB_PASSWORD)', DEFAULT_DATABASE = saigonvoice_translation_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(TRANSLATION_DB_USER)]...';
    ALTER LOGIN [$(TRANSLATION_DB_USER)] WITH PASSWORD = '$(TRANSLATION_DB_PASSWORD)';
END
GO

-- analytics_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(ANALYTICS_DB_USER)')
BEGIN
    PRINT 'Creating login [$(ANALYTICS_DB_USER)]...';
    CREATE LOGIN [$(ANALYTICS_DB_USER)] WITH PASSWORD = '$(ANALYTICS_DB_PASSWORD)', DEFAULT_DATABASE = saigonvoice_analytics_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(ANALYTICS_DB_USER)]...';
    ALTER LOGIN [$(ANALYTICS_DB_USER)] WITH PASSWORD = '$(ANALYTICS_DB_PASSWORD)';
END
GO

-- 3. GÁN USER VÀ PHÂN QUYỀN CÔ LẬP TRÊN TỪNG DATABASE (KHÔNG TRUY CẬP CHÉO)
-- saigonvoice_content_db: Chỉ content_user có quyền
USE saigonvoice_content_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(CONTENT_DB_USER)')
BEGIN
    CREATE USER [$(CONTENT_DB_USER)] FOR LOGIN [$(CONTENT_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(CONTENT_DB_USER)];
GO

-- saigonvoice_translation_db: Chỉ translation_user có quyền
USE saigonvoice_translation_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(TRANSLATION_DB_USER)')
BEGIN
    CREATE USER [$(TRANSLATION_DB_USER)] FOR LOGIN [$(TRANSLATION_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(TRANSLATION_DB_USER)];
GO

-- saigonvoice_analytics_db: Chỉ analytics_user có quyền
USE saigonvoice_analytics_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(ANALYTICS_DB_USER)')
BEGIN
    CREATE USER [$(ANALYTICS_DB_USER)] FOR LOGIN [$(ANALYTICS_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(ANALYTICS_DB_USER)];
GO

PRINT 'All 3 databases, logins, and isolated permissions configured successfully!';
GO
