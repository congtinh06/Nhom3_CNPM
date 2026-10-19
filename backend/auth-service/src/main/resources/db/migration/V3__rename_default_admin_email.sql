-- ==============================================================================
-- SaigonVoice - Flyway V3: Doi email tai khoan ADMIN mac dinh sang ten mien moi
-- admin@saigonvoice.local -> admin@echora.local
-- Migration idempotent: khong lam gi neu email cu khong ton tai hoac email moi
-- da duoc dung.
-- ==============================================================================

IF EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@saigonvoice.local')
   AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'admin@echora.local')
BEGIN
    UPDATE dbo.users
    SET email = 'admin@echora.local',
        updated_at = SYSUTCDATETIME()
    WHERE email = 'admin@saigonvoice.local';
END
GO
