-- ====================================================================
-- CƠ SỞ DỮ LIỆU: link_verification_db (Port host: 5433)
-- ====================================================================
\c link_verification_db;

CREATE TABLE IF NOT EXISTS verification_result (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    risk_score NUMERIC(3, 2) NOT NULL CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
    sources TEXT,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_domain ON verification_result(domain);
CREATE INDEX IF NOT EXISTS idx_verification_checked_at ON verification_result(checked_at DESC);


-- ====================================================================
-- CƠ SỞ DỮ LIỆU: report_db (Port host: 5434)
-- ====================================================================
\c report_db;

CREATE TABLE IF NOT EXISTS report (
    id BIGSERIAL PRIMARY KEY,
    target_url TEXT NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('WEB', 'SMS')),
    reporter_contact VARCHAR(255) NOT NULL,
    description TEXT,
    is_phishing BOOLEAN,
    risk_score NUMERIC(3, 2) CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'NOTIFIED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_status ON report(status);
CREATE INDEX IF NOT EXISTS idx_report_created_at ON report(created_at DESC);

-- Dữ liệu khởi tạo mẫu để minh họa (Seed Data)
INSERT INTO report (target_url, channel, reporter_contact, description, is_phishing, risk_score, status, created_at)
VALUES 
('https://portal.vietcombank.com.vn', 'WEB', 'chuyengia.anninh@gmail.com', 'Cổng thông tin ngân hàng chính thức', false, 0.00, 'VERIFIED', NOW() - INTERVAL '2 hour'),
('https://example-bank-fake.com/login', 'WEB', 'nan.nhan.01@gmail.com', 'Trang giả mạo nhận thưởng khuyến mãi', true, 0.85, 'VERIFIED', NOW() - INTERVAL '1 hour'),
('https://techcom-otp-fake.top/xac-thuc', 'SMS', '0912345678', 'Tin nhắn Brandname giả mạo báo khóa tài khoản', true, 1.00, 'VERIFIED', NOW() - INTERVAL '30 minute');


-- ====================================================================
-- CƠ SỞ DỮ LIỆU: notification_db (Port host: 5435)
-- ====================================================================
\c notification_db;

CREATE TABLE IF NOT EXISTS notification_log (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('EMAIL', 'SMS')),
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED')),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_report_id ON notification_log(report_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_sent_at ON notification_log(sent_at DESC);

-- Dữ liệu audit mẫu
INSERT INTO notification_log (report_id, channel, recipient, status, sent_at, error_message)
VALUES 
(2, 'EMAIL', 'admin@anti-phishing-bank.example.com', 'SENT', NOW() - INTERVAL '1 hour', NULL),
(2, 'EMAIL', 'nan.nhan.01@gmail.com', 'SENT', NOW() - INTERVAL '1 hour', NULL),
(3, 'EMAIL', 'admin@anti-phishing-bank.example.com', 'SENT', NOW() - INTERVAL '30 minute', NULL);
