USE echora_auth_db;
GO
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @i INT = 24;
WHILE @i <= 46
BEGIN
    DECLARE @email VARCHAR(100) = 'dukhach' + CAST(@i AS VARCHAR(10)) + '@echora.vn';
    DECLARE @name NVARCHAR(100) = N'Du Khách ' + CAST(@i AS NVARCHAR(10));
    
    IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = @email)
    BEGIN
        INSERT INTO dbo.users (full_name, email, password_hash, role, status, [plan], email_verified_at, created_at, updated_at)
        VALUES (@name, @email, '$2a$12$TsbXVWGfVwfFocbIkUJSfONNIu3UD71N.YRdzy3ijl9gohmcVGSWy', 'USER', 'ACTIVE', 'FREE', SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());
    END
    SET @i = @i + 1;
END

SELECT 'TONG SO NGUOI DUNG HIEN TAI: ' + CAST(COUNT(*) AS VARCHAR) + ' USER' AS [KetQua] FROM dbo.users;
