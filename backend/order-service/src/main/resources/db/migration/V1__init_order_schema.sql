-- ==============================================================================
-- Echora - Flyway V1: schema cho saigonvoice_order_db
-- Don hang duoc gan voi user_id (lay tu access token qua API Gateway).
-- ==============================================================================

IF OBJECT_ID('dbo.orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.orders (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_code VARCHAR(40) NOT NULL,
        user_id BIGINT NOT NULL,
        idempotency_key VARCHAR(80) NULL,
        subtotal DECIMAL(12, 0) NOT NULL,
        shipping_fee DECIMAL(12, 0) NOT NULL,
        total_amount DECIMAL(12, 0) NOT NULL,
        status NVARCHAR(30) NOT NULL,
        payment_method NVARCHAR(20) NOT NULL,
        payment_status NVARCHAR(20) NOT NULL,
        receiver_name NVARCHAR(150) NOT NULL,
        phone NVARCHAR(20) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        note NVARCHAR(1000) NULL,
        expires_at DATETIME2 NULL,
        paid_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_orders_order_code UNIQUE (order_code),
        CONSTRAINT CK_orders_status CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT CK_orders_payment_method CHECK (payment_method IN ('COD', 'VIETQR', 'VNPAY')),
        CONSTRAINT CK_orders_payment_status CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_orders_user_created' AND object_id = OBJECT_ID('dbo.orders'))
BEGIN
    CREATE INDEX IX_orders_user_created ON dbo.orders (user_id, created_at DESC);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_orders_user_idempotency' AND object_id = OBJECT_ID('dbo.orders'))
BEGIN
    CREATE UNIQUE INDEX UX_orders_user_idempotency ON dbo.orders (user_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
END
GO

IF OBJECT_ID('dbo.order_items', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        product_name NVARCHAR(255) NOT NULL,
        unit_price DECIMAL(12, 0) NOT NULL,
        quantity INT NOT NULL,
        CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders (id) ON DELETE CASCADE,
        CONSTRAINT CK_order_items_quantity CHECK (quantity > 0)
    );
END
GO

IF OBJECT_ID('dbo.payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.payments (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        provider NVARCHAR(20) NOT NULL,
        txn_ref VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 0) NOT NULL,
        status NVARCHAR(20) NOT NULL,
        response_code NVARCHAR(10) NULL,
        transaction_no NVARCHAR(50) NULL,
        bank_code NVARCHAR(50) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        paid_at DATETIME2 NULL,
        CONSTRAINT UQ_payments_txn_ref UNIQUE (txn_ref),
        CONSTRAINT FK_payments_order FOREIGN KEY (order_id) REFERENCES dbo.orders (id),
        CONSTRAINT CK_payments_provider CHECK (provider IN ('VNPAY', 'DEMO_TRANSFER')),
        CONSTRAINT CK_payments_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_order' AND object_id = OBJECT_ID('dbo.payments'))
BEGIN
    CREATE INDEX IX_payments_order ON dbo.payments (order_id);
END
GO
