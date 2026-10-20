-- ==============================================================================
-- Echora - Flyway V4: Doi email tai khoan ADMIN mac dinh sang quantri@echora.test
-- Giu nguyen password_hash, role va status cua tai khoan hien co.
-- Migration idempotent: khong lam gi neu email cu khong ton tai hoac email moi
-- da duoc dung.
-- ==============================================================================

IF EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@echora.local')
   AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'quantri@echora.test')
BEGIN
    UPDATE dbo.users
    SET email = N'quantri@echora.test',
        updated_at = SYSUTCDATETIME()
    WHERE email = 'admin@echora.local';
END
GO
