-- Rollback U7: bo cot frontend_origin tren bang payments
IF COL_LENGTH('dbo.payments', 'frontend_origin') IS NOT NULL
BEGIN
    ALTER TABLE dbo.payments DROP COLUMN frontend_origin;
END;
GO
