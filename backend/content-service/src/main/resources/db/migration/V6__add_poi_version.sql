-- ==============================================================================
-- Echora — Flyway V6 Migration
-- Thêm cột version cho poi: khoá lạc hậu (optimistic lock) cho thao tác admin.
-- Client gửi kèm version khi PUT; nếu không khớp -> 409 để tránh ghi đè lẫn nhau.
-- Cột quản lý thủ công (không dùng @Version của JPA) để kiểm soát rõ ràng.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.poi', 'version') IS NULL
    ALTER TABLE dbo.poi
        ADD version BIGINT NOT NULL
            CONSTRAINT DF_poi_version DEFAULT 0;
GO
