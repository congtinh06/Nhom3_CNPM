-- ==============================================================================
-- Echora — Flyway V7 Migration
-- Thêm cột version cho zone và route (optimistic lock cho thao tác admin)
-- ==============================================================================
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.zone', 'version') IS NULL
    ALTER TABLE dbo.zone
        ADD version BIGINT NOT NULL
            CONSTRAINT DF_zone_version DEFAULT 0;
GO

IF COL_LENGTH('dbo.route', 'version') IS NULL
    ALTER TABLE dbo.route
        ADD version BIGINT NOT NULL
            CONSTRAINT DF_route_version DEFAULT 0;
GO
