-- ==============================================================================
-- Echora - Flyway V4: outbox cap quyen Premium/POI sau khi thanh toan.
-- Tach viec goi auth-service khoi transaction thanh toan de tranh rollback don
-- khi auth-service tam thoi khong san sang.
-- ==============================================================================

IF OBJECT_ID('dbo.order_entitlement_grants', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_entitlement_grants (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        order_code VARCHAR(40) NOT NULL,
        user_id BIGINT NOT NULL,
        order_type NVARCHAR(20) NOT NULL,
        poi_id BIGINT NULL,
        status NVARCHAR(20) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        last_error NVARCHAR(500) NULL,
        next_attempt_at DATETIME2 NULL,
        granted_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_order_entitlement_grants_order UNIQUE (order_id),
        CONSTRAINT FK_order_entitlement_grants_order FOREIGN KEY (order_id)
            REFERENCES dbo.orders (id) ON DELETE CASCADE,
        CONSTRAINT CK_order_entitlement_grants_status
            CHECK (status IN ('PENDING', 'GRANTED', 'FAILED'))
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_order_entitlement_grants_due'
      AND object_id = OBJECT_ID('dbo.order_entitlement_grants')
)
BEGIN
    CREATE INDEX IX_order_entitlement_grants_due
        ON dbo.order_entitlement_grants (status, next_attempt_at, created_at);
END
GO

-- Backfill cac don Premium/POI da thanh toan nhung chua duoc cap quyen truoc khi
-- co outbox. Scheduler se xu ly cac ban ghi PENDING nay sau khi service khoi dong.
INSERT INTO dbo.order_entitlement_grants
    (order_id, order_code, user_id, order_type, poi_id, status, attempts, next_attempt_at)
SELECT o.id, o.order_code, o.user_id, o.order_type, o.poi_id, 'PENDING', 0, SYSUTCDATETIME()
FROM dbo.orders o
WHERE o.payment_status = 'SUCCESS'
  AND o.order_type IN ('PREMIUM', 'POI')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.order_entitlement_grants g WHERE g.order_id = o.id
  );
GO
