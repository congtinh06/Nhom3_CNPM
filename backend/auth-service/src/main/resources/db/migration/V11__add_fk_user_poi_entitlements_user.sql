-- Flyway V11: Add FK constraint on user_poi_entitlements.user_id referencing users(id)

-- 1. Xoa dong mo coi neu co truoc khi tao rang buoc khoa ngoai
DELETE FROM dbo.user_poi_entitlements
WHERE user_id NOT IN (SELECT id FROM dbo.users);

-- 2. Tao khoa ngoai voi ON DELETE NO ACTION
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_user_poi_entitlements_user' AND parent_object_id = OBJECT_ID('dbo.user_poi_entitlements'))
BEGIN
    ALTER TABLE dbo.user_poi_entitlements
    ADD CONSTRAINT FK_user_poi_entitlements_user
    FOREIGN KEY (user_id) REFERENCES dbo.users (id)
    ON DELETE NO ACTION;
END;

