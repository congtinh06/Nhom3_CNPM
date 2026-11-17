-- Flyway V7: luu origin frontend (localhost / Vercel) cua tung lan thanh toan VNPAY
-- de redirect ket qua ve dung moi truong nguoi dung dang test.
IF COL_LENGTH('dbo.payments', 'frontend_origin') IS NULL
BEGIN
    ALTER TABLE dbo.payments
        ADD frontend_origin NVARCHAR(200) NULL;
END;
GO
