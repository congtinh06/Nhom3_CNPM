-- ==============================================================================
-- Echora — Flyway V14 Migration: Bảng phân đoạn bài thuyết minh theo POI (chapter)
-- 1 POI có nhiều chap (VD: "Lịch sử", "Kiến trúc", "Sự kiện"), mỗi chap có
-- title + narration_text + audio riêng cho từng ngôn ngữ (vi/en/ja/ko).
-- Tiếng Việt luôn miễn phí; ngoại ngữ bị khóa theo gói Premium hoặc mua lẻ POI.
-- ==============================================================================

-- 1. BẢNG CHAPTER CỦA POI
IF OBJECT_ID('dbo.poi_chapter', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_chapter (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        chapter_order INT NOT NULL,                     -- thứ tự chap trong POI (bắt đầu từ 1)
        is_active BIT NOT NULL DEFAULT 1,               -- tắt để ẩn chap khỏi du khách (nội dung đang soạn)
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_chapter_poi FOREIGN KEY (poi_id) REFERENCES dbo.poi(id) ON DELETE CASCADE
    );
END
GO

--Không cho 2 chap trùng thứ tự trong cùng 1 POI
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_poi_chapter_order' AND object_id = OBJECT_ID('dbo.poi_chapter'))
    CREATE UNIQUE INDEX UQ_poi_chapter_order ON dbo.poi_chapter (poi_id, chapter_order);
GO

-- 2. BẢNG BẢN DỊCH & AUDIO CỦA TỪNG CHAP
IF OBJECT_ID('dbo.poi_chapter_translation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_chapter_translation (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        chapter_id BIGINT NOT NULL,
        language_code NVARCHAR(10) NOT NULL,            -- 'vi', 'en', 'ja', 'ko'
        title NVARCHAR(255) NOT NULL,
        narration_text NVARCHAR(MAX) NOT NULL,          -- nội dung thuyết minh của chap
        audio_url NVARCHAR(1000),
        audio_duration_seconds INT DEFAULT 0,
        audio_status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, READY, FAILED_TTS
        content_hash NVARCHAR(64),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_chapter_language UNIQUE (chapter_id, language_code),
        CONSTRAINT FK_chapter_translation_chapter FOREIGN KEY (chapter_id) REFERENCES dbo.poi_chapter(id) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_chapter_translation_lang' AND object_id = OBJECT_ID('dbo.poi_chapter_translation'))
    CREATE INDEX idx_chapter_translation_lang ON dbo.poi_chapter_translation (chapter_id, language_code);
GO
