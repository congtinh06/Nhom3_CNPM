-- ==============================================================================
-- SaigonVoice — Flyway Repeatable Migration: Seed Data mẫu cho saigonvoice_content_db
-- File này là Repeatable migration (R__...), chạy tự động sau các versioned migrations.
-- Khi nội dung file thay đổi, Flyway tự nạp lại mà không làm lệch checksum của V1.
--
-- QUY ƯỚC DỮ LIỆU:
-- 1. Toàn bộ chuỗi Unicode tiếng Việt đều có tiền tố N'...' để bảo đảm dấu tiếng Việt.
-- 2. Tọa độ (center_lat, center_lng) và bán kính (radius_meters) của 4 khu vực (zone)
--    là thông số GIẢ ĐỊNH phục vụ thử nghiệm/demo. Đã kiểm tra theo công thức Haversine:
--    không có bất kỳ cặp zone nào có khoảng cách tâm nhỏ hơn tổng bán kính.
-- 3. Mọi mốc năm, địa chỉ và xếp hạng di tích đều đã được đối chiếu từ nguồn chính thống.
--    Không nêu tên kiến trúc sư khi chưa xác minh chắc chắn; địa chỉ chỉ giữ số nhà và tên đường.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. SEED 4 KHU DU LỊCH (ZONE) - Không chồng lấn
IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'D1_HISTORIC')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('D1_HISTORIC', N'Trung tâm Lịch sử', N'Khu vực tập trung các công trình kiến trúc lịch sử và văn hóa tiêu biểu của thành phố.', 10.7769000, 106.7009000, 600);
ELSE
    UPDATE dbo.zone SET name = N'Trung tâm Lịch sử', description = N'Khu vực tập trung các công trình kiến trúc lịch sử và văn hóa tiêu biểu của thành phố.', center_lat = 10.7769000, center_lng = 106.7009000, radius_meters = 600 WHERE code = 'D1_HISTORIC';

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'CHO_LON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('CHO_LON', N'Khu Di sản Chợ Lớn', N'Khu phố cổ người Hoa lâu đời với nét văn hóa đặc sắc, chùa cổ, hội quán và ẩm thực truyền thống.', 10.7533000, 106.6575000, 700);
ELSE
    UPDATE dbo.zone SET name = N'Khu Di sản Chợ Lớn', description = N'Khu phố cổ người Hoa lâu đời với nét văn hóa đặc sắc, chùa cổ, hội quán và ẩm thực truyền thống.', center_lat = 10.7533000, center_lng = 106.6575000, radius_meters = 700 WHERE code = 'CHO_LON';

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'VINH_KHANH')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('VINH_KHANH', N'Phố Ẩm thực Vĩnh Khánh', N'Khu phố ẩm thực đường phố sôi động về đêm, nổi tiếng với các món ốc và hải sản tươi ngon.', 10.7600000, 106.7025000, 400);
ELSE
    UPDATE dbo.zone SET name = N'Phố Ẩm thực Vĩnh Khánh', description = N'Khu phố ẩm thực đường phố sôi động về đêm, nổi tiếng với các món ốc và hải sản tươi ngon.', center_lat = 10.7600000, center_lng = 106.7025000, radius_meters = 400 WHERE code = 'VINH_KHANH';

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'BA_SON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('BA_SON', N'Khu Đô thị Ven sông & Cảng Ba Son', N'Khu vực gắn liền với di tích xưởng đóng tàu Ba Son lịch sử kết hợp cùng không gian đô thị hiện đại ven sông Sài Gòn.', 10.7835000, 106.7085000, 450);
ELSE
    UPDATE dbo.zone SET name = N'Khu Đô thị Ven sông & Cảng Ba Son', description = N'Khu vực gắn liền với di tích xưởng đóng tàu Ba Son lịch sử kết hợp cùng không gian đô thị hiện đại ven sông Sài Gòn.', center_lat = 10.7835000, center_lng = 106.7085000, radius_meters = 450 WHERE code = 'BA_SON';
GO

-- 2. SEED CÁC DANH MỤC DU LỊCH (CATEGORY)
IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'HISTORIC')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('HISTORIC', N'Di tích Lịch sử', N'Historical Heritage', '/icons/historic.svg');
ELSE
    UPDATE dbo.category SET name_vi = N'Di tích Lịch sử', name_en = N'Historical Heritage', icon_url = '/icons/historic.svg' WHERE code = 'HISTORIC';

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'ARCHITECTURE')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('ARCHITECTURE', N'Kiến trúc & Nghệ thuật', N'Architecture & Art', '/icons/architecture.svg');
ELSE
    UPDATE dbo.category SET name_vi = N'Kiến trúc & Nghệ thuật', name_en = N'Architecture & Art', icon_url = '/icons/architecture.svg' WHERE code = 'ARCHITECTURE';

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'FOOD')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('FOOD', N'Ẩm thực & Chợ truyền thống', N'Food & Market', '/icons/food.svg');
ELSE
    UPDATE dbo.category SET name_vi = N'Ẩm thực & Chợ truyền thống', name_en = N'Food & Market', icon_url = '/icons/food.svg' WHERE code = 'FOOD';

IF NOT EXISTS (SELECT 1 FROM dbo.category WHERE code = 'RELIGION')
    INSERT INTO dbo.category (code, name_vi, name_en, icon_url)
    VALUES ('RELIGION', N'Tín ngưỡng & Tôn giáo', N'Religion & Culture', '/icons/religion.svg');
ELSE
    UPDATE dbo.category SET name_vi = N'Tín ngưỡng & Tôn giáo', name_en = N'Religion & Culture', icon_url = '/icons/religion.svg' WHERE code = 'RELIGION';
GO

-- 3. SEED 5 ĐIỂM DỪNG (POI) & BẢN DỊCH TIẾNG VIỆT
DECLARE @Zone1 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC');
DECLARE @Zone2 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'CHO_LON');
DECLARE @Zone3 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'VINH_KHANH');
DECLARE @Zone4 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'BA_SON');

DECLARE @CatHist BIGINT = (SELECT id FROM dbo.category WHERE code = 'HISTORIC');
DECLARE @CatArch BIGINT = (SELECT id FROM dbo.category WHERE code = 'ARCHITECTURE');
DECLARE @CatFood BIGINT = (SELECT id FROM dbo.category WHERE code = 'FOOD');
DECLARE @CatReli BIGINT = (SELECT id FROM dbo.category WHERE code = 'RELIGION');

-- POI 1: Bưu điện Trung tâm Sài Gòn
-- Xóa "vẽ thủ công"; giữ "hai bản đồ lịch sử (1892 và 1936) trong sảnh"; không nêu tên kiến trúc sư; "xây khoảng 1886–1891".
-- Địa chỉ chỉ giữ số nhà và tên đường: Số 2 Công trường Công xã Paris
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatArch, 'POI_BUU_DIEN_01', 'qr-buu-dien-01', N'Bưu điện Trung tâm Sài Gòn', 10.7799000, 106.7001000, 40, N'Số 2 Công trường Công xã Paris', '/images/buudien.jpg');

    DECLARE @PoiId1 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId1, 'vi', N'Bưu điện Trung tâm Sài Gòn', 
            N'Công trình kiến trúc bưu chính tiêu biểu xây khoảng 1886–1891, một biểu tượng văn hóa nổi tiếng của thành phố.',
            N'Bưu điện Trung tâm Sài Gòn được xây khoảng 1886–1891, mang phong cách kiến trúc phương Tây kết hợp hài hòa với các đường nét trang trí phương Đông. Tòa nhà nổi bật với hệ thống cửa vòm cuốn lớn, trần nhà cao thoáng đãng cùng hai bản đồ lịch sử (1892 và 1936) trong sảnh.',
            N'Là công trình bưu chính tiêu biểu tại Việt Nam, điểm giao lưu văn hóa và du lịch của TP.HCM.',
            'PENDING');
END
ELSE
BEGIN
    UPDATE dbo.poi SET zone_id = @Zone1, category_id = @CatArch, name = N'Bưu điện Trung tâm Sài Gòn',
                       latitude = 10.7799000, longitude = 106.7001000, trigger_radius_meters = 40,
                       address = N'Số 2 Công trường Công xã Paris', thumbnail_url = '/images/buudien.jpg'
    WHERE code = 'POI_BUU_DIEN_01';

    DECLARE @ExistingPoiId1 BIGINT = (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01');
    UPDATE dbo.poi_translation 
    SET title = N'Bưu điện Trung tâm Sài Gòn',
        summary = N'Công trình kiến trúc bưu chính tiêu biểu xây khoảng 1886–1891, một biểu tượng văn hóa nổi tiếng của thành phố.',
        description = N'Bưu điện Trung tâm Sài Gòn được xây khoảng 1886–1891, mang phong cách kiến trúc phương Tây kết hợp hài hòa với các đường nét trang trí phương Đông. Tòa nhà nổi bật với hệ thống cửa vòm cuốn lớn, trần nhà cao thoáng đãng cùng hai bản đồ lịch sử (1892 và 1936) trong sảnh.',
        historical_significance = N'Là công trình bưu chính tiêu biểu tại Việt Nam, điểm giao lưu văn hóa và du lịch của TP.HCM.'
    WHERE poi_id = @ExistingPoiId1 AND language_code = 'vi';
END

-- POI 2: Nhà thờ Chính tòa Đức Bà Sài Gòn
-- "Roman cải biên pha Gothic", "hầu hết vật liệu chở từ Pháp sang", không nêu tên kiến trúc sư; tượng Đức Mẹ Hòa Bình đặt năm 1959, chế tác tại Roma.
-- Địa chỉ chỉ giữ số nhà và tên đường: Số 1 Công trường Công xã Paris
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_DUC_BA_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatArch, 'POI_DUC_BA_01', 'qr-duc-ba-01', N'Nhà thờ Chính tòa Đức Bà Sài Gòn', 10.7798000, 106.6990000, 45, N'Số 1 Công trường Công xã Paris', '/images/ducba.jpg');

    DECLARE @PoiId2 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId2, 'vi', N'Nhà thờ Chính tòa Đức Bà Sài Gòn', 
            N'Kiệt tác kiến trúc tôn giáo tiêu biểu với hầu hết vật liệu chở từ Pháp sang, biểu tượng kiến trúc lịch sử của thành phố.',
            N'Nhà thờ Chính tòa Đức Bà Sài Gòn (Vương cung thánh đường Chính tòa Đức Mẹ Vô nhiễm Nguyên tội) mang phong cách kiến trúc Roman cải biên pha Gothic, hầu hết vật liệu chở từ Pháp sang. Công trình nổi bật với hai tháp chuông vươn cao đặc trưng; phía trước khuôn viên là tượng Đức Mẹ Hòa Bình đặt năm 1959, chế tác tại Roma.',
            N'Công trình tôn giáo và di sản kiến trúc lịch sử tiêu biểu của thành phố qua nhiều thế hệ.',
            'PENDING');
END
ELSE
BEGIN
    UPDATE dbo.poi SET zone_id = @Zone1, category_id = @CatArch, name = N'Nhà thờ Chính tòa Đức Bà Sài Gòn',
                       latitude = 10.7798000, longitude = 106.6990000, trigger_radius_meters = 45,
                       address = N'Số 1 Công trường Công xã Paris', thumbnail_url = '/images/ducba.jpg'
    WHERE code = 'POI_DUC_BA_01';

    DECLARE @ExistingPoiId2 BIGINT = (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01');
    UPDATE dbo.poi_translation 
    SET title = N'Nhà thờ Chính tòa Đức Bà Sài Gòn',
        summary = N'Kiệt tác kiến trúc tôn giáo tiêu biểu với hầu hết vật liệu chở từ Pháp sang, biểu tượng kiến trúc lịch sử của thành phố.',
        description = N'Nhà thờ Chính tòa Đức Bà Sài Gòn (Vương cung thánh đường Chính tòa Đức Mẹ Vô nhiễm Nguyên tội) mang phong cách kiến trúc Roman cải biên pha Gothic, hầu hết vật liệu chở từ Pháp sang. Công trình nổi bật với hai tháp chuông vươn cao đặc trưng; phía trước khuôn viên là tượng Đức Mẹ Hòa Bình đặt năm 1959, chế tác tại Roma.',
        historical_significance = N'Công trình tôn giáo và di sản kiến trúc lịch sử tiêu biểu của thành phố qua nhiều thế hệ.'
    WHERE poi_id = @ExistingPoiId2 AND language_code = 'vi';
END

-- POI 3: Chợ Bến Thành
-- Bến Thành giữ "di tích kiến trúc nghệ thuật cấp thành phố, quyết định ngày 20/11/2024".
-- Địa chỉ chỉ giữ số nhà và tên đường: Đường Lê Lợi
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_BEN_THANH_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone1, @CatFood, 'POI_BEN_THANH_01', 'qr-ben-thanh-01', N'Chợ Bến Thành', 10.7725000, 106.6980000, 50, N'Đường Lê Lợi', '/images/benthanh.jpg');

    DECLARE @PoiId3 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId3, 'vi', N'Chợ Bến Thành', 
            N'Khu chợ biểu tượng của thành phố với tháp đồng hồ bốn mặt đặc trưng, trung tâm thương mại và ẩm thực sầm uất.',
            N'Chợ Bến Thành nổi bật với tháp đồng hồ bốn mặt nhìn ra quảng trường phía Nam. Khu chợ có bốn cửa chính mở ra các trục đường trung tâm, quy tụ hàng trăm gian hàng thương mại truyền thống, đồ thủ công mỹ nghệ và ẩm thực đa dạng.',
            N'Di tích kiến trúc nghệ thuật cấp thành phố, quyết định ngày 20/11/2024; là trung tâm giao thương truyền thống và điểm tham quan tiêu biểu của TP.HCM.',
            'PENDING');
END
ELSE
BEGIN
    UPDATE dbo.poi SET zone_id = @Zone1, category_id = @CatFood, name = N'Chợ Bến Thành',
                       latitude = 10.7725000, longitude = 106.6980000, trigger_radius_meters = 50,
                       address = N'Đường Lê Lợi', thumbnail_url = '/images/benthanh.jpg'
    WHERE code = 'POI_BEN_THANH_01';

    DECLARE @ExistingPoiId3 BIGINT = (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01');
    UPDATE dbo.poi_translation 
    SET title = N'Chợ Bến Thành',
        summary = N'Khu chợ biểu tượng của thành phố với tháp đồng hồ bốn mặt đặc trưng, trung tâm thương mại và ẩm thực sầm uất.',
        description = N'Chợ Bến Thành nổi bật với tháp đồng hồ bốn mặt nhìn ra quảng trường phía Nam. Khu chợ có bốn cửa chính mở ra các trục đường trung tâm, quy tụ hàng trăm gian hàng thương mại truyền thống, đồ thủ công mỹ nghệ và ẩm thực đa dạng.',
        historical_significance = N'Di tích kiến trúc nghệ thuật cấp thành phố, quyết định ngày 20/11/2024; là trung tâm giao thương truyền thống và điểm tham quan tiêu biểu của TP.HCM.'
    WHERE poi_id = @ExistingPoiId3 AND language_code = 'vi';
END

-- POI 4: Chùa Bà Thiên Hậu (Hội quán Tuệ Thành)
-- Xóa số quyết định "43/VH-QĐ", chỉ giữ "công nhận ngày 7/1/1993" cho Chùa Bà; năm xây viết "khoảng năm 1760".
-- Địa chỉ chỉ giữ số nhà và tên đường: Số 710 Đường Nguyễn Trãi
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone2, @CatReli, 'POI_THIEN_HAU_01', 'qr-thien-hau-01', N'Chùa Bà Thiên Hậu (Hội quán Tuệ Thành)', 10.7538000, 106.6601000, 35, N'Số 710 Đường Nguyễn Trãi', '/images/thienhau.jpg');

    DECLARE @PoiId4 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId4, 'vi', N'Chùa Bà Thiên Hậu', 
            N'Cơ sở tín ngưỡng cổ kính của cộng đồng người Hoa tại Chợ Lớn xây khoảng năm 1760, nổi tiếng với nghệ thuật phù điêu gốm độc đáo.',
            N'Hội quán Tuệ Thành (Chùa Bà Thiên Hậu) do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 tại Chợ Lớn. Ngôi chùa nổi bật với kiến trúc tiền điện độc đáo và hệ thống phù điêu gốm nung tinh xảo trên mái.',
            N'Công trình được công nhận ngày 7/1/1993 là di tích kiến trúc nghệ thuật cấp quốc gia.',
            'PENDING');
END
ELSE
BEGIN
    UPDATE dbo.poi SET zone_id = @Zone2, category_id = @CatReli, name = N'Chùa Bà Thiên Hậu (Hội quán Tuệ Thành)',
                       latitude = 10.7538000, longitude = 106.6601000, trigger_radius_meters = 35,
                       address = N'Số 710 Đường Nguyễn Trãi', thumbnail_url = '/images/thienhau.jpg'
    WHERE code = 'POI_THIEN_HAU_01';

    DECLARE @ExistingPoiId4 BIGINT = (SELECT id FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01');
    UPDATE dbo.poi_translation 
    SET title = N'Chùa Bà Thiên Hậu',
        summary = N'Cơ sở tín ngưỡng cổ kính của cộng đồng người Hoa tại Chợ Lớn xây khoảng năm 1760, nổi tiếng với nghệ thuật phù điêu gốm độc đáo.',
        description = N'Hội quán Tuệ Thành (Chùa Bà Thiên Hậu) do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 tại Chợ Lớn. Ngôi chùa nổi bật với kiến trúc tiền điện độc đáo và hệ thống phù điêu gốm nung tinh xảo trên mái.',
        historical_significance = N'Công trình được công nhận ngày 7/1/1993 là di tích kiến trúc nghệ thuật cấp quốc gia.'
    WHERE poi_id = @ExistingPoiId4 AND language_code = 'vi';
END

-- POI 5: Cầu Ba Son
-- Địa chỉ chỉ giữ số nhà và tên đường: Đường Tôn Đức Thắng
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone4, @CatArch, 'POI_CAU_BA_SON_01', 'qr-ba-son-01', N'Cầu Ba Son', 10.7818000, 106.7092000, 50, N'Đường Tôn Đức Thắng', '/images/bason.jpg');

    DECLARE @PoiId5 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status)
    VALUES (@PoiId5, 'vi', N'Cầu Ba Son', 
            N'Cây cầu dây văng hiện đại bắc qua sông Sài Gòn, kết nối trung tâm thành phố với Khu đô thị mới Thủ Thiêm.',
            N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, thông xe ngày 28/4/2022, với trụ tháp hình vòm cao 113 m nghiêng về phía Thủ Thiêm.',
            N'Cầu từng mang tên Thủ Thiêm 2. Ngày 9/12/2022, HĐND TP.HCM thông qua việc đặt tên Ba Son, theo tên xưởng đóng tàu Ba Son lịch sử.',
            'PENDING');
END
ELSE
BEGIN
    UPDATE dbo.poi SET zone_id = @Zone4, category_id = @CatArch, name = N'Cầu Ba Son',
                       latitude = 10.7818000, longitude = 106.7092000, trigger_radius_meters = 50,
                       address = N'Đường Tôn Đức Thắng', thumbnail_url = '/images/bason.jpg'
    WHERE code = 'POI_CAU_BA_SON_01';

    DECLARE @ExistingPoiId5 BIGINT = (SELECT id FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01');
    UPDATE dbo.poi_translation 
    SET title = N'Cầu Ba Son',
        summary = N'Cây cầu dây văng hiện đại bắc qua sông Sài Gòn, kết nối trung tâm thành phố với Khu đô thị mới Thủ Thiêm.',
        description = N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, thông xe ngày 28/4/2022, với trụ tháp hình vòm cao 113 m nghiêng về phía Thủ Thiêm.',
        historical_significance = N'Cầu từng mang tên Thủ Thiêm 2. Ngày 9/12/2022, HĐND TP.HCM thông qua việc đặt tên Ba Son, theo tên xưởng đóng tàu Ba Son lịch sử.'
    WHERE poi_id = @ExistingPoiId5 AND language_code = 'vi';
END
GO

-- 4. SEED 3 TUYẾN THAM QUAN (ROUTE) & GÁN ĐIỂM DỪNG THEO THỨ TỰ (STOP_ORDER)
DECLARE @RZone1 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC');
DECLARE @RZone2 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'CHO_LON');
DECLARE @RZone4 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'BA_SON');

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone1 AND name = N'Tuyến Kiến trúc Trung tâm Quận 1')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone1, N'Tuyến Kiến trúc Trung tâm Quận 1', N'Tuyến đi bộ tham quan các công trình kiến trúc lịch sử tiêu biểu tại khu vực trung tâm quanh Nhà thờ Đức Bà và Chợ Bến Thành.', 1);
ELSE
    UPDATE dbo.route SET description = N'Tuyến đi bộ tham quan các công trình kiến trúc lịch sử tiêu biểu tại khu vực trung tâm quanh Nhà thờ Đức Bà và Chợ Bến Thành.', display_order = 1 WHERE zone_id = @RZone1 AND name = N'Tuyến Kiến trúc Trung tâm Quận 1';

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone2 AND name = N'Tuyến Hội quán Chợ Lớn')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone2, N'Tuyến Hội quán Chợ Lớn', N'Khám phá các hội quán và chùa cổ của cộng đồng người Hoa tại Chợ Lớn.', 1);
ELSE
    UPDATE dbo.route SET description = N'Khám phá các hội quán và chùa cổ của cộng đồng người Hoa tại Chợ Lớn.', display_order = 1 WHERE zone_id = @RZone2 AND name = N'Tuyến Hội quán Chợ Lớn';

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone4 AND name = N'Tuyến Ven sông Ba Son')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone4, N'Tuyến Ven sông Ba Son', N'Dạo bộ ngắm cảnh ven sông Sài Gòn quanh khu vực Ba Son.', 1);
ELSE
    UPDATE dbo.route SET description = N'Dạo bộ ngắm cảnh ven sông Sài Gòn quanh khu vực Ba Son.', display_order = 1 WHERE zone_id = @RZone4 AND name = N'Tuyến Ven sông Ba Son';

DECLARE @Route1 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone1 AND name = N'Tuyến Kiến trúc Trung tâm Quận 1');
DECLARE @Route2 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone2 AND name = N'Tuyến Hội quán Chợ Lớn');
DECLARE @Route4 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone4 AND name = N'Tuyến Ven sông Ba Son');

UPDATE dbo.poi SET route_id = @Route1, stop_order = 1 WHERE code = 'POI_DUC_BA_01';
UPDATE dbo.poi SET route_id = @Route1, stop_order = 2 WHERE code = 'POI_BUU_DIEN_01';
UPDATE dbo.poi SET route_id = @Route1, stop_order = 3 WHERE code = 'POI_BEN_THANH_01';
UPDATE dbo.poi SET route_id = @Route2, stop_order = 1 WHERE code = 'POI_THIEN_HAU_01';
UPDATE dbo.poi SET route_id = @Route4, stop_order = 1 WHERE code = 'POI_CAU_BA_SON_01';
GO
