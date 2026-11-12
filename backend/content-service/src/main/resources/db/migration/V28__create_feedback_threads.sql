CREATE TABLE feedback_threads (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ticket VARCHAR(36) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE TABLE feedback_messages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    thread_id BIGINT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL,
    CONSTRAINT FK_feedback_messages_thread FOREIGN KEY (thread_id) REFERENCES feedback_threads(id) ON DELETE CASCADE
);

CREATE INDEX IX_feedback_messages_thread_created ON feedback_messages(thread_id, created_at);
CREATE INDEX IX_feedback_threads_updated ON feedback_threads(updated_at DESC);
