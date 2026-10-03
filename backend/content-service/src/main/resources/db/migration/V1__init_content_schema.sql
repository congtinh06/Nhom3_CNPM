-- ==============================================================================
-- SaigonVoice — Flyway V1 Migration: Schema & Seed Data cho saigonvoice_content_db
-- Toàn bộ chuỗi Unicode đều có tiền tố N'...' để tránh mất dấu tiếng Việt/Nhật/Hàn.
-- Hoàn toàn không còn bảng phishing cũ (đã loại bỏ poi_cache).
-- ==============================================================================

-- 1. BẢNG KHU VỰC DU LỊCH (ZONE)
IF OBJECT_ID('dbo.zone', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.zone (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        center_lat DECIMAL(10, 7) NOT NULL,
        center_lng DECIMAL(10, 7) NOT NULL,
        radius_meters INT NOT NULL DEFAULT 1000,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 2. BẢNG DANH MỤC ĐIỂM DỪNG (CATEGORY)
IF OBJECT_ID('dbo.category', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.category (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        name_vi NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        icon_url NVARCHAR(500)
    );
END
GO

-- 3. BẢNG ĐIỂM DỪNG DU LỊCH (POI)
IF OBJECT_ID('dbo.poi', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        zone_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        code NVARCHAR(50) NOT NULL UNIQUE,
        qr_token NVARCHAR(100) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        trigger_radius_meters INT NOT NULL DEFAULT 50,
        address NVARCHAR(500),
        thumbnail_url NVARCHAR(500),
        status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_poi_zone FOREIGN KEY (zone_id) REFERENCES dbo.zone(id),
        CONSTRAINT FK_poi_category FOREIGN KEY (category_id) REFERENCES dbo.category(id)
    );
END
GO

-- 4. BẢNG BẢN DỊCH & THÔNG TIN ÂM THANH (POI_TRANSLATION)
IF OBJECT_ID('dbo.poi_translation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.poi_translation (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        poi_id BIGINT NOT NULL,
        language_code NVARCHAR(10) NOT NULL,        -- 'vi', 'en', 'ja', 'ko'
        title NVARCHAR(255) NOT NULL,
        summary NVARCHAR(1000) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        historical_significance NVARCHAR(MAX),
        audio_url NVARCHAR(1000),
        audio_duration_seconds INT DEFAULT 0,
        audio_status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, READY, FAILED_TTS
        content_hash NVARCHAR(64),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_poi_language UNIQUE (poi_id, language_code),
        CONSTRAINT FK_translation_poi FOREIGN KEY (poi_id) REFERENCES dbo.poi(id) ON DELETE CASCADE
    );
END
GO

-- 5. CHỈ MỤC TỐI ƯU TRUY VẤN
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_zone_lat_lng' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_zone_lat_lng ON dbo.poi (zone_id, latitude, longitude);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_poi_qr_token' AND object_id = OBJECT_ID('dbo.poi'))
    CREATE INDEX idx_poi_qr_token ON dbo.poi (qr_token);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_poi_lang' AND object_id = OBJECT_ID('dbo.poi_translation'))
    CREATE INDEX idx_translation_poi_lang ON dbo.poi_translation (poi_id, language_code);
GO

-- ==============================================================================
-- 6. SEED DATA BAN ĐẦU (TIỀN TỐ N'...' CHO TOÀN BỘ CHUỖI TIẾNG VIỆT)
-- ==============================================================================

-- 4 Khu du lịch không chồng lấn
IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'D1_HISTORIC')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('D1_HISTORIC', N'Trung tâm Lịch sử Quận 1', N'Khu vực tập trung các công trình kiến trúc lịch sử và văn hóa tiêu biểu nhất của Sài Gòn.', 10.7769000, 106.7009000, 600);

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'CHO_LON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('CHO_LON', N'Khu Di sản Chợ Lớn', N'Khu phố cổ người Hoa lâu đời với nét văn hóa đặc sắc, chùa cổ, hội quán và ẩm thực truyền thống.', 10.7533000, 106.6575000, 700);

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'VINH_KHANH')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('VINH_KHANH', N'Phố Ẩm thực Vĩnh Khánh', N'Thiên đường ẩm thực đường phố sôi động về đêm, nổi tiếng với các món ốc và hải sản tươi ngon.', 10.7600000, 106.7025000, 400);

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'BA_SON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('BA_SON', N'Khu Đô thị Ven sông & Cảng Ba Son', N'Di tích xưởng đóng tàu Ba Son lịch sử hơn 200 năm tuổi kết hợp cùng không gian đô thị hiện đại bên sông Sài Gòn.', 10.7835000, 106.7085000, 450);
GO

-- Các danh mục du lịch
IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'HISTORIC')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('HISTORIC', N'Di tích Lịch sử', N'Historical Heritage', '/icons/historic.svg');

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'ARCHITECTURE')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('ARCHITECTURE', N'Kiến trúc & Nghệ thuật', N'Architecture & Art', '/icons/architecture.svg');

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'FOOD')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('FOOD', N'Ẩm thực & Chợ truyền thống', N'Food & Market', '/icons/food.svg');

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'RELIGION')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('RELIGION', N'Tín ngưỡng & Tôn giáo', N'Religion & Culture', '/icons/religion.svg');
GO

-- Điểm dừng du lịch mẫu kèm bản dịch tiếng Việt gốc
DECLARE @Zone1 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC');
DECLARE @Zone2 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'CHO_LON');
DECLARE @Zone3 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'VINH_KHANH');
DECLARE @Zone4 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'BA_SON');

DECLARE @CatHist BIGINT = (SELECT id FROM dbo.category WHERE code = 'HISTORIC');
DECLARE @CatArch BIGINT = (SELECT id FROM dbo.category WHERE code = 'ARCHITECTURE');
DECLARE @CatFood BIGINT = (SELECT id FROM dbo.category WHERE code = 'FOOD');
DECLARE @CatReli BIGINT = (SELECT id FROM dbo.category WHERE code = 'RELIGION');

-- POI 1: Bưu điện Trung tâm TP
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatArch, 'POI_BUU_DIEN_01', 'qr-buu-dien-01', N'Bưu điện Trung tâm Sài Gòn', 10.7799000, 106.7001000, 40, N'Số 2 Công xã Paris, Phường Bến Nghé, Quận 1', '/images/buudien.jpg');

    DECLARE @PoiId1 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId1, 'vi', N'Bưu điện Trung tâm Sài Gòn', 
            N'Công trình kiến trúc Pháp tiêu biểu xây dựng từ cuối thế kỷ 19, một biểu tượng không thể thiếu của thành phố.',
            N'Bưu điện Trung tâm Sài Gòn là một trong những công trình kiến trúc cổ kính và đẹp nhất tại Thành phố Hồ Chí Minh. Được người Pháp xây dựng từ năm 1886 đến năm 1891 theo đồ án thiết kế của kiến trúc sư Villedieu cùng phụ tá Foulhoux.',
            N'Nơi đây lưu giữ dấu ấn giao thương thông tin liên lạc đầu tiên của vùng đất Nam Bộ với thế giới từ thời Pháp thuộc.',
            'PENDING');
END

-- POI 2: Nhà thờ Đức Bà
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_DUC_BA_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatArch, 'POI_DUC_BA_01', 'qr-duc-ba-01', N'Nhà thờ Chính tòa Đức Bà Sài Gòn', 10.7798000, 106.6990000, 45, N'Số 1 Công xã Paris, Phường Bến Nghé, Quận 1', '/images/ducba.jpg');

    DECLARE @PoiId2 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId2, 'vi', N'Nhà thờ Chính tòa Đức Bà Sài Gòn', 
            N'Kiệt tác kiến trúc Gothic và Romanesque với toàn bộ gạch ngói xây dựng được vận chuyển trực tiếp từ Marseille (Pháp).',
            N'Nhà thờ Đức Bà là công trình tôn giáo nổi tiếng bậc nhất Sài Gòn, khánh thành vào năm 1880. Nhà thờ nổi bật với hai tháp chuông cao 57 mét và tượng Đức Mẹ Hòa Bình uy nghi phía trước khuôn viên.',
            N'Công trình là minh chứng lịch sử cho sự giao thoa văn hóa Đông - Tây tại Sài Gòn qua hơn 140 năm.',
            'PENDING');
END

-- POI 3: Chợ Bến Thành
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_BEN_THANH_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatFood, 'POI_BEN_THANH_01', 'qr-ben-thanh-01', N'Chợ Bến Thành', 10.7725000, 106.6980000, 50, N'Đường Lê Lợi, Phường Bến Thành, Quận 1', '/images/benthanh.jpg');

    DECLARE @PoiId3 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId3, 'vi', N'Chợ Bến Thành', 
            N'Ngôi chợ biểu tượng của TP.HCM với tháp đồng hồ 4 mặt nổi tiếng, trung tâm giao thương sầm uất hơn 100 năm.',
            N'Chợ Bến Thành khởi công từ năm 1912 và hoàn thành năm 1914. Chợ có diện tích hơn 13.000m2 với 4 cửa chính Đông - Tây - Nam - Bắc mở ra các trục đường lớn của trung tâm thành phố.',
            N'Nơi đây không chỉ là trung tâm buôn bán mà còn là chứng nhân lịch sử chứng kiến bao đổi thay của thành phố.',
            'PENDING');
END

-- POI 4: Chùa Bà Thiên Hậu (Chợ Lớn)
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone2, @CatReli, 'POI_THIEN_HAU_01', 'qr-thien-hau-01', N'Chùa Bà Thiên Hậu (Tuệ Thành Hội Quán)', 10.7538000, 106.6601000, 35, N'710 Đường Nguyễn Trãi, Phường 11, Quận 5', '/images/thienhau.jpg');

    DECLARE @PoiId4 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId4, 'vi', N'Chùa Bà Thiên Hậu', 
            N'Ngôi chùa cổ linh thiêng của cộng đồng người Hoa tại Chợ Lớn với kiến trúc tiền điện độc đáo và nghệ thuật phù điêu gốm tinh xảo.',
            N'Chùa Bà Thiên Hậu được xây dựng vào khoảng năm 1760 bởi nhóm người Hoa gốc Quảng Đông di cư sang Việt Nam. Chùa nổi tiếng với những vòng nhang treo khổng lồ và hệ thống phù điêu gốm nung tinh xảo.',
            N'Di tích kiến trúc nghệ thuật cấp quốc gia được công nhận từ năm 1993.',
            'PENDING');
END

-- POI 5: Cầu Ba Son (Bến Nghé)
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone4, @CatArch, 'POI_CAU_BA_SON_01', 'qr-ba-son-01', N'Cầu Ba Son (Thủ Thiêm 2)', 10.7818000, 106.7092000, 50, N'Đường Tôn Đức Thắng, Phường Bến Nghé, Quận 1', '/images/bason.jpg');

    DECLARE @PoiId5 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId5, 'vi', N'Cầu Ba Son', 
            N'Cây cầu dây văng biểu tượng mới bắc qua sông Sài Gòn, kết nối trung tâm lịch sử Quận 1 với bán đảo Thủ Thiêm.',
            N'Cầu Ba Son có chiều dài gần 1.5 km với trụ tháp chính hình vòm cao 113m nghiêng về phía Thủ Thiêm, tạo nên điểm nhấn kiến trúc hiện đại rực rỡ bên bờ sông Sài Gòn.',
            N'Cây cầu được đặt tên Ba Son để vinh danh khu xưởng đóng tàu lịch sử hình thành từ năm 1790 của Sài Gòn xưa.',
            'PENDING');
END
GO
