ALTER TABLE feedback_threads ADD owner_user_id BIGINT NULL;
CREATE INDEX IX_feedback_threads_owner_updated ON feedback_threads(owner_user_id, updated_at DESC);
