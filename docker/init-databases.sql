-- ==============================================================================
-- Echora — Script khởi tạo 5 Databases & 5 Logins độc lập trên SQL Server 2022
-- Đảm bảo Idempotent (chạy lại không lỗi).
-- Collation: Vietnamese_100_CI_AS (chuẩn Unicode phân biệt dấu thanh tiếng Việt)
-- ==============================================================================

-- 1. TẠO 5 DATABASE ĐỘC LẬP
IF DB_ID('echora_content_db') IS NULL
BEGIN
    PRINT 'Creating database [echora_content_db]...';
    CREATE DATABASE echora_content_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('echora_translation_db') IS NULL
BEGIN
    PRINT 'Creating database [echora_translation_db]...';
    CREATE DATABASE echora_translation_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('echora_analytics_db') IS NULL
BEGIN
    PRINT 'Creating database [echora_analytics_db]...';
    CREATE DATABASE echora_analytics_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('echora_auth_db') IS NULL
BEGIN
    PRINT 'Creating database [echora_auth_db]...';
    CREATE DATABASE echora_auth_db COLLATE Vietnamese_100_CI_AS;
END
GO

IF DB_ID('echora_order_db') IS NULL
BEGIN
    PRINT 'Creating database [echora_order_db]...';
    CREATE DATABASE echora_order_db COLLATE Vietnamese_100_CI_AS;
END
GO

-- 2. TẠO SERVER LOGINS VỚI PASSWORD TRUYỀN QUA SQLCMD VARIABLES
-- content_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(CONTENT_DB_USER)')
BEGIN
    PRINT 'Creating login [$(CONTENT_DB_USER)]...';
    CREATE LOGIN [$(CONTENT_DB_USER)] WITH PASSWORD = '$(CONTENT_DB_PASSWORD)', DEFAULT_DATABASE = echora_content_db, CHECK_POLICY = OFF;
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
    CREATE LOGIN [$(TRANSLATION_DB_USER)] WITH PASSWORD = '$(TRANSLATION_DB_PASSWORD)', DEFAULT_DATABASE = echora_translation_db, CHECK_POLICY = OFF;
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
    CREATE LOGIN [$(ANALYTICS_DB_USER)] WITH PASSWORD = '$(ANALYTICS_DB_PASSWORD)', DEFAULT_DATABASE = echora_analytics_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(ANALYTICS_DB_USER)]...';
    ALTER LOGIN [$(ANALYTICS_DB_USER)] WITH PASSWORD = '$(ANALYTICS_DB_PASSWORD)';
END
GO

-- auth_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(AUTH_DB_USER)')
BEGIN
    PRINT 'Creating login [$(AUTH_DB_USER)]...';
    CREATE LOGIN [$(AUTH_DB_USER)] WITH PASSWORD = '$(AUTH_DB_PASSWORD)', DEFAULT_DATABASE = echora_auth_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(AUTH_DB_USER)]...';
    ALTER LOGIN [$(AUTH_DB_USER)] WITH PASSWORD = '$(AUTH_DB_PASSWORD)';
END
GO

-- order_user
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = '$(ORDER_DB_USER)')
BEGIN
    PRINT 'Creating login [$(ORDER_DB_USER)]...';
    CREATE LOGIN [$(ORDER_DB_USER)] WITH PASSWORD = '$(ORDER_DB_PASSWORD)', DEFAULT_DATABASE = echora_order_db, CHECK_POLICY = OFF;
END
ELSE
BEGIN
    PRINT 'Updating password for login [$(ORDER_DB_USER)]...';
    ALTER LOGIN [$(ORDER_DB_USER)] WITH PASSWORD = '$(ORDER_DB_PASSWORD)';
END
GO

-- 3. GÁN USER VÀ PHÂN QUYỀN CÔ LẬP TRÊN TỪNG DATABASE (KHÔNG TRUY CẬP CHÉO)
-- echora_content_db: Chỉ content_user có quyền
USE echora_content_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(CONTENT_DB_USER)')
BEGIN
    CREATE USER [$(CONTENT_DB_USER)] FOR LOGIN [$(CONTENT_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(CONTENT_DB_USER)];
GO

-- echora_translation_db: Chỉ translation_user có quyền
USE echora_translation_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(TRANSLATION_DB_USER)')
BEGIN
    CREATE USER [$(TRANSLATION_DB_USER)] FOR LOGIN [$(TRANSLATION_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(TRANSLATION_DB_USER)];
GO

-- echora_analytics_db: Chỉ analytics_user có quyền
USE echora_analytics_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(ANALYTICS_DB_USER)')
BEGIN
    CREATE USER [$(ANALYTICS_DB_USER)] FOR LOGIN [$(ANALYTICS_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(ANALYTICS_DB_USER)];
GO

-- echora_auth_db: Chỉ auth_user có quyền
USE echora_auth_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(AUTH_DB_USER)')
BEGIN
    CREATE USER [$(AUTH_DB_USER)] FOR LOGIN [$(AUTH_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(AUTH_DB_USER)];
GO

-- echora_order_db: Chỉ order_user có quyền
USE echora_order_db;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$(ORDER_DB_USER)')
BEGIN
    CREATE USER [$(ORDER_DB_USER)] FOR LOGIN [$(ORDER_DB_USER)];
END
GO
ALTER ROLE db_owner ADD MEMBER [$(ORDER_DB_USER)];
GO

PRINT 'All 5 databases, logins, and isolated permissions configured successfully!';
GO
