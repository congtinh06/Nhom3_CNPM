-- Rollback U11: Drop FK constraint on user_poi_entitlements.user_id
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_user_poi_entitlements_user' AND parent_object_id = OBJECT_ID('dbo.user_poi_entitlements'))
BEGIN
    ALTER TABLE dbo.user_poi_entitlements
    DROP CONSTRAINT FK_user_poi_entitlements_user;
END;

