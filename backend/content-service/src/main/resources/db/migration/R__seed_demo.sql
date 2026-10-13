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

-- 3. SEED 5 POIs FROM nearbyPois.json (vi/en authored text)
-- Source of text: frontend/src/content/nearbyPois.json
--   narration.short -> summary, narration.full -> description (paragraphs joined by blank line).
-- en rows use translation_source = 'MANUAL' so the pipeline speaks them verbatim (no machine translation).
-- Uses @Zone1 / @CatHist / @CatArch / @CatFood declared above in this batch.

CREATE TABLE #PoiSeed (
    code NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL PRIMARY KEY,
    slug NVARCHAR(100) NOT NULL,
    qr_token NVARCHAR(100) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
trigger_radius_meters INT NOT NULL,
    category_code NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL,
    thumbnail_url NVARCHAR(500) NULL,
    vi_title NVARCHAR(255) NOT NULL,
    vi_summary NVARCHAR(1000) NOT NULL,
    vi_description NVARCHAR(MAX) NOT NULL,
    en_title NVARCHAR(255) NOT NULL,
    en_summary NVARCHAR(1000) NOT NULL,
    en_description NVARCHAR(MAX) NOT NULL
);

INSERT INTO #PoiSeed (code, slug, qr_token, name, latitude, longitude, trigger_radius_meters, category_code, thumbnail_url, vi_title, vi_summary, vi_description, en_title, en_summary, en_description)
VALUES
  (N'POI_DINH_DOC_LAP_01', N'dinh-doc-lap', N'qr-dinh-doc-lap-01', N'Dinh Độc Lập', 10.7769500, 106.6953700, 50, N'HISTORIC', N'/images/pois/dinh-doc-lap.jpg',
   N'Dinh Độc Lập', N'Chào mừng bạn đến Dinh Độc Lập, nơi gắn liền với ngày thống nhất đất nước. Nơi đây từng là dinh của chính quyền thuộc địa Pháp, sau này là dinh của các tổng thống Việt Nam Cộng hòa. Tòa nhà bạn đang thấy được xây dựng vào những năm sáu mươi. Vào ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm, xe tăng đã tiến qua cổng chính, đánh dấu sự kết thúc của cuộc chiến. Hãy dành vài phút ngắm tòa nhà từ bãi cỏ phía trước, rồi bước vào trong để xem phòng khánh tiết và hầm chỉ huy. Ngày nay, dinh là một bảo tàng mở cửa cho mọi người tham quan.', N'Dinh Độc Lập nằm giữa một khu vườn rộng ở trung tâm thành phố. Câu chuyện của nơi này bắt đầu từ thế kỷ mười chín, khi người Pháp xây dinh Norodom làm nơi ở và làm việc của người đứng đầu chính quyền thuộc địa. Sau năm một nghìn chín trăm năm mươi tư, dinh trở thành nơi làm việc của chính quyền miền Nam. Năm một nghìn chín trăm sáu mươi hai, hai phi công đã ném bom vào dinh, và tòa nhà cũ bị hư hại nặng. Chính quyền khi đó quyết định phá bỏ để xây một công trình mới.

Kiến trúc sư Ngô Viết Thụ thiết kế tòa nhà mà ngày nay bạn nhìn thấy. Công trình hoàn thành năm một nghìn chín trăm sáu mươi sáu, kết hợp phong cách hiện đại với những yếu tố phương Đông, có nhiều khoảng thoáng và sảnh cao rộng. Bên trong là phòng khánh tiết, phòng họp nội các, phòng làm việc của tổng thống, và một hệ thống hầm chỉ huy nằm bên dưới.

Ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm, xe tăng của quân giải phóng tiến vào khuôn viên và húc đổ cổng dinh. Tổng thống Dương Văn Minh tuyên bố đầu hàng, và lá cờ được kéo lên trên nóc dinh. Ngày đó được nhớ đến như ngày thống nhất đất nước.

Sau đó, nơi này được gọi là Hội trường Thống Nhất, rồi trở thành một di tích. Năm hai nghìn không trăm lẻ chín, dinh được xếp hạng di tích quốc gia đặc biệt. Khi đi dạo trong khuôn viên, bạn hãy để ý hai chiếc xe tăng ở sân trước, và nếu có thời gian, hãy xuống tham quan khu hầm chỉ huy.',
   N'Independence Palace', N'Welcome to Independence Palace, a place tied to the day the country was reunified. The site once housed the French colonial rulers, and later the presidents of South Vietnam. The building in front of you was completed in the nineteen sixties. On the thirtieth of April, nineteen seventy-five, tanks drove through the gates, and the war came to an end. Take a few minutes to see the building from the front lawn, then step inside to see the reception rooms and the command bunker. Today the palace is a museum open to all visitors.', N'Independence Palace sits in a wide garden in the heart of the city. Its story begins in the nineteenth century, when the French built Norodom Palace as the home and office of the colonial governor. After nineteen fifty-four, it became the seat of the government of South Vietnam. In nineteen sixty-two, two pilots bombed the palace, and the old building was badly damaged. The government decided to tear it down and build a new one.

Architect Ngô Viết Thụ designed the building you see today. It was completed in nineteen sixty-six, blending a modern style with Eastern elements, with open spaces and tall, airy halls. Inside are reception rooms, a cabinet meeting room, the president''s office, and a command bunker underground.

On the thirtieth of April, nineteen seventy-five, tanks of the liberation forces entered the grounds and broke through the gate. President Dương Văn Minh announced the surrender, and a flag was raised over the palace. That day is remembered as the reunification of the country.

Afterwards the building was called Reunification Hall, and later became a historic site. In two thousand nine, it was recognized as a special national monument. As you walk the grounds, look for the two tanks in the front yard, and if you have time, visit the command bunker.'),
  (N'POI_DUC_BA_01', N'nha-tho-duc-ba', N'qr-duc-ba-01', N'Nhà thờ Đức Bà Sài Gòn', 10.7797200, 106.6990800, 60, N'ARCHITECTURE', N'/images/pois/nha-tho-duc-ba.jpg',
   N'Nhà thờ Đức Bà Sài Gòn', N'Bạn đang đứng trước Nhà thờ Đức Bà, một trong những biểu tượng kiến trúc nổi tiếng nhất của Sài Gòn. Nhà thờ được người Pháp xây dựng vào cuối thế kỷ mười chín, với những viên gạch đỏ không phủ vữa và hai tháp chuông cao vút. Phía trước là tượng Đức Mẹ Hòa Bình, nhìn ra một quảng trường nhỏ. Dù bạn theo tôn giáo nào, đây vẫn là nơi đẹp để dừng lại, ngước nhìn và chụp một tấm ảnh. Ngay bên cạnh là Bưu điện Trung tâm, điểm dừng tiếp theo của bạn.', N'Nhà thờ Đức Bà có tên chính thức là Vương cung thánh đường Chính tòa Đức Mẹ Vô Nhiễm Nguyên Tội. Công trình được xây dựng trong thời Pháp thuộc, khởi công năm một nghìn tám trăm sáu mươi ba và hoàn thành năm một nghìn tám trăm tám mươi. Kiến trúc sư Jules Bourard thiết kế theo phong cách Roman và Gothic của châu Âu.

Điểm dễ nhận ra nhất là lớp gạch đỏ ở mặt ngoài. Theo nhiều tài liệu, gạch được đưa từ Marseille, nước Pháp, sang, và đến nay vẫn giữ được màu sắc đặc trưng mà không cần sơn phủ. Hai tháp chuông được bổ sung vào năm một nghìn tám trăm chín mươi lăm, cao khoảng sáu mươi mét tính cả cây thánh giá trên đỉnh.

Trước nhà thờ là tượng Đức Mẹ Hòa Bình, được đặt năm một nghìn chín trăm năm mươi chín. Năm một nghìn chín trăm sáu mươi hai, nhà thờ được phong hàng vương cung thánh đường.

Hãy đi chậm quanh nhà thờ, ngắm mặt tiền gạch đỏ và những ô cửa kính màu. Nếu muốn vào bên trong, bạn nên kiểm tra giờ mở cửa trước, vì nhà thờ có giờ lễ và giờ đón khách riêng, và một số khu vực có thể đang được trùng tu. Chỉ vài bước chân nữa là tới Bưu điện Trung tâm, điểm dừng tiếp theo của bạn.',
   N'Notre Dame Cathedral of Saigon', N'You are standing before Notre-Dame Cathedral, one of the best-known landmarks of Saigon. The French built it in the late nineteenth century, with red bricks left bare and two tall bell towers. In front stands the statue of Our Lady of Peace, facing a small square. Whatever your beliefs, this is a lovely place to pause, look up, and take a photograph. Right next door is the Central Post Office, your next stop.', N'Its official name is the Cathedral Basilica of Our Lady of the Immaculate Conception. It was built during the French colonial period, started in eighteen sixty-three and finished in eighteen eighty. Architect Jules Bourard drew on European Romanesque and Gothic styles.

What you notice first is the red brick on the outside. Many sources say the bricks were brought from Marseille, in France, and they still keep their color today without any paint. Two bell towers were added in eighteen ninety-five, rising about sixty meters including the cross on top.

In front stands the statue of Our Lady of Peace, placed in nineteen fifty-nine. In nineteen sixty-two, the church was raised to the rank of basilica.

Walk slowly around the cathedral and look at the brick façade and the stained glass. If you plan to go inside, check the opening hours first, because there are times for services and times for visitors, and some areas may be closed for restoration. Just a few steps away stands the Central Post Office, your next stop.'),
  (N'POI_BUU_DIEN_01', N'buu-dien-trung-tam', N'qr-buu-dien-01', N'Bưu điện Trung tâm Sài Gòn', 10.7799500, 106.6997100, 40, N'ARCHITECTURE', N'/images/pois/buu-dien-trung-tam.jpg',
   N'Bưu điện Trung tâm Sài Gòn', N'Bưu điện Trung tâm Sài Gòn nổi bật với mái vòm cong cổ điển, sàn gạch hoa văn tinh tế và những tấm bản đồ vẽ tay trên tường. Công trình được xây dựng vào cuối thế kỷ mười chín, và đến nay vẫn là một bưu điện đang hoạt động. Người ta thường kể rằng Eiffel đã thiết kế nơi này, nhưng đó nhiều khả năng chỉ là giai thoại. Bạn có thể bước vào trong, ngắm trần vòm, mua một tấm bưu thiếp và gửi về cho người thân.', N'Bưu điện Trung tâm được xây dựng từ năm một nghìn tám trăm tám mươi sáu đến năm một nghìn tám trăm chín mươi mốt, trong thời kỳ Pháp thuộc. Người ta thường kể rằng công trình do Gustave Eiffel thiết kế, nhưng nhiều nguồn cho biết kiến trúc sư thực sự là Alfred Foulhoux. Câu chuyện về Eiffel nhiều khả năng chỉ là giai thoại.

Hãy bước vào bên trong. Bạn sẽ thấy một sảnh dài với mái vòm cong, khung sắt nhẹ và những ô cửa vòm cao. Sàn nhà lát gạch hoa nhiều họa tiết, các dãy quầy gỗ và buồng điện thoại cổ vẫn còn đó. Trên tường là hai tấm bản đồ lớn vẽ tay. Một tấm vẽ Sài Gòn và vùng phụ cận vào năm một nghìn tám trăm chín mươi hai, tấm còn lại là bản đồ các tuyến điện báo ở miền Nam Việt Nam và Campuchia. Ở cuối sảnh là chân dung Chủ tịch Hồ Chí Minh.

Bưu điện không chỉ để ngắm. Đây vẫn là nơi người dân gửi thư, mua tem và viết bưu thiếp. Nếu bạn có chút thời gian, hãy mua một tấm bưu thiếp, viết vài dòng và gửi đi. Đó là một cách thú vị để mang một phần Sài Gòn về với người thân.',
   N'Saigon Central Post Office', N'The Central Post Office stands out with its curved, classical vaulted roof, its patterned tile floor, and the hand-painted maps on its walls. It was built in the late nineteenth century and is still a working post office today. People often say Eiffel designed it, but that is most likely just a legend. Step inside, look up at the arched ceiling, and send a postcard to someone you love.', N'The Central Post Office was built between eighteen eighty-six and eighteen ninety-one, during the French colonial period. People often say it was designed by Gustave Eiffel, but many sources credit an architect named Alfred Foulhoux. The Eiffel story is most likely just a legend.

Step inside. You will find a long hall with a curved roof, a light iron frame, and tall arched windows. The floor is covered in patterned tiles, and rows of wooden counters and old telephone booths are still in place. On the walls hang two large hand-painted maps. One shows Saigon and its surroundings in eighteen ninety-two. The other shows the telegraph lines of southern Vietnam and Cambodia. At the far end you will see a portrait of President Hồ Chí Minh.

The post office is not only for sightseeing. People still come here to send letters, buy stamps, and write postcards. If you have a few minutes, buy a postcard, write a few lines, and send it off. It is a charming way to send a piece of Saigon home.'),
  (N'POI_BEN_THANH_01', N'cho-ben-thanh', N'qr-ben-thanh-01', N'Chợ Bến Thành', 10.7723200, 106.6981100, 55, N'FOOD', N'/images/pois/cho-ben-thanh.jpg',
   N'Chợ Bến Thành', N'Chợ Bến Thành là biểu tượng của Sài Gòn từ hơn một trăm năm nay. Tòa nhà có tháp đồng hồ ở cửa Nam được khánh thành năm một nghìn chín trăm mười bốn, nhưng khu chợ ven sông ở đây đã có từ trước đó rất lâu. Bên trong có rất nhiều gian hàng bán đồ ăn, vải vóc, quà lưu niệm và cà phê. Bạn có thể dừng ở cửa Nam để chụp ảnh với tháp đồng hồ. Hãy đi chậm và hỏi giá trước khi mua.', N'Chợ Bến Thành nằm ở trung tâm Quận Một, và là một trong những biểu tượng quen thuộc nhất của thành phố. Khu chợ có nguồn gốc từ đầu thế kỷ mười chín, khi người dân buôn bán ven sông. Tòa nhà hiện nay được xây dựng từ năm một nghìn chín trăm mười hai và khánh thành năm một nghìn chín trăm mười bốn, theo thiết kế của các kiến trúc sư người Pháp.

Chợ có bốn cửa chính, hướng Đông, Tây, Nam và Bắc. Nổi bật nhất là cửa Nam, với tháp đồng hồ cao, hình ảnh quen thuộc trên rất nhiều tấm bưu thiếp. Bên trong, các dãy hàng chia theo nhóm: vải vóc và quần áo, đồ thủ công và quà lưu niệm, cà phê, trà, đồ khô, trái cây, và khu ẩm thực phục vụ các món Việt quen thuộc.

Chợ đông nhất vào ban ngày, và buổi tối khu vực quanh chợ có thêm chợ đêm. Khi mua hàng, bạn nên hỏi giá và trả giá nhẹ nhàng, đó là nét văn hóa buôn bán thân thiện ở đây. Hãy dành chút thời gian thử một món ăn nhẹ ngay tại chợ, như chè hay bánh, để cảm nhận nhịp sống của người Sài Gòn.',
   N'Ben Thanh Market', N'Ben Thanh Market has been a symbol of Saigon for over a hundred years. The building with the clock tower at its south gate opened in nineteen fourteen, but a riverside market stood here long before. Inside you will find many stalls selling food, fabric, souvenirs, and coffee. You can stop at the south gate for a photo with the clock tower. Walk slowly, and ask the price before you buy.', N'Ben Thanh Market stands in the center of District One, and is one of the most familiar symbols of the city. The market grew out of riverside trading in the early nineteenth century. The present building went up in nineteen twelve and opened in nineteen fourteen, designed by French architects.

The market has four main gates, facing east, west, south, and north. The most famous is the south gate, with its tall clock tower, a sight seen on countless postcards. Inside, the aisles are grouped by goods: fabric and clothing, handicrafts and souvenirs, coffee, tea, dried goods, fruit, and a food area serving familiar Vietnamese dishes.

The market is busiest in the daytime, and in the evening the streets around it also hold a night market. When you shop, ask for the price and bargain gently, which is a friendly part of local trading culture. Take a little time to eat a light snack right here, such as a sweet dessert soup or a small cake, to feel the rhythm of daily life in Saigon.'),
  (N'POI_BAO_TANG_CHUNG_TICH_01', N'bao-tang-chung-tich-chien-tranh', N'qr-bao-tang-chung-tich-01', N'Bảo tàng Chứng tích Chiến tranh', 10.7792600, 106.6924700, 45, N'HISTORIC', N'/images/pois/bao-tang-chung-tich-chien-tranh.jpg',
   N'Bảo tàng Chứng tích Chiến tranh', N'Bảo tàng Chứng tích Chiến tranh ghi lại những hậu quả của chiến tranh đối với con người và đất nước Việt Nam. Bảo tàng được thành lập năm một nghìn chín trăm bảy mươi lăm. Sân trước trưng bày máy bay, xe tăng và vũ khí thật, còn các phòng bên trong có nhiều hình ảnh và hiện vật về chiến tranh. Hãy dành cho nơi này một tâm thế trầm lắng. Một số hình ảnh có thể gây xúc động mạnh, nên bạn hãy cân nhắc nếu đi cùng trẻ nhỏ.', N'Bảo tàng Chứng tích Chiến tranh nằm trên đường Võ Văn Tần. Bảo tàng được thành lập vào tháng chín năm một nghìn chín trăm bảy mươi lăm, ban đầu với một tên gọi khác, và đã nhiều lần đổi tên trước khi mang tên như hiện nay vào năm một nghìn chín trăm chín mươi lăm. Mục đích của bảo tàng là lưu giữ hình ảnh, tư liệu và hiện vật về chiến tranh Việt Nam, để người xem hiểu rõ hơn về những mất mát mà chiến tranh gây ra.

Ở sân trước, bạn sẽ thấy máy bay, xe tăng, pháo và nhiều loại bom đạn được trưng bày ngoài trời. Bên trong, các tầng trưng bày ảnh và hiện vật theo từng chủ đề, trong đó có phần nói về hậu quả của chất độc da cam đối với nhiều thế hệ, và một triển lãm ảnh dành cho các phóng viên đã hy sinh trong các cuộc chiến tranh ở Đông Dương.

Đây là nơi nên đến với tâm thế trầm lắng. Một số hình ảnh rất nặng nề, nên bạn hãy cân nhắc nếu đi cùng trẻ nhỏ, và có thể dừng lại nghỉ bất cứ lúc nào. Đây không chỉ là nơi nhìn lại quá khứ, mà còn là nơi nhắc chúng ta trân trọng hòa bình.',
   N'War Remnants Museum', N'The War Remnants Museum records the consequences of war for the people and the land of Vietnam. It was founded in nineteen seventy-five. The front yard displays real aircraft, tanks, and weapons, and the rooms inside hold photographs and objects from the war. Please come in a quiet frame of mind. Some images can be deeply upsetting, so think twice before bringing young children.', N'The War Remnants Museum is on Võ Văn Tần Street. It was founded in September nineteen seventy-five under a different name, and changed names several times before taking its present name in nineteen ninety-five. Its purpose is to keep photographs, documents, and objects from the Vietnam War, so that visitors can better understand the losses that war causes.

In the front yard you will see aircraft, tanks, artillery, and many kinds of bombs displayed in the open. Inside, the floors present photographs and objects by theme, including a section on the effects of Agent Orange across generations, and a photo exhibition honoring journalists who died in the wars of Indochina.

This is a place to visit in a quiet frame of mind. Some images are very heavy, so think carefully before bringing young children, and feel free to stop and rest whenever you need. It is not only a place to look back at the past, but also a place that reminds us to value peace.')
;

UPDATE p
SET p.slug = s.slug, p.zone_id = @Zone1,
    p.category_id = (SELECT id FROM dbo.category WHERE code = s.category_code),
    p.qr_token = s.qr_token, p.name = s.name, p.latitude = s.latitude, p.longitude = s.longitude,
    p.trigger_radius_meters = s.trigger_radius_meters, p.thumbnail_url = s.thumbnail_url,
    p.status = 'ACTIVE', p.updated_at = SYSUTCDATETIME()
FROM dbo.poi p JOIN #PoiSeed s ON p.code = s.code;

INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, slug, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url, status, created_at, updated_at)
SELECT @Zone1, (SELECT id FROM dbo.category WHERE code = s.category_code), s.code, s.qr_token, s.slug, s.name,
       s.latitude, s.longitude, s.trigger_radius_meters, NULL, s.thumbnail_url, 'ACTIVE', SYSUTCDATETIME(), SYSUTCDATETIME()
FROM #PoiSeed s
WHERE NOT EXISTS (SELECT 1 FROM dbo.poi p WHERE p.code = s.code);

-- Vietnamese source translation (authored)
UPDATE tr
SET tr.title = s.vi_title, tr.summary = s.vi_summary, tr.description = s.vi_description,
    tr.historical_significance = NULL, tr.audio_status = 'PENDING', tr.content_hash = NULL,
    tr.audio_url = NULL, tr.audio_duration_seconds = 0, tr.translation_source = 'MANUAL', tr.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation tr JOIN dbo.poi p ON p.id = tr.poi_id JOIN #PoiSeed s ON s.code = p.code
WHERE tr.language_code = 'vi';

INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
SELECT p.id, 'vi', s.vi_title, s.vi_summary, s.vi_description, NULL, 'PENDING', 'MANUAL', SYSUTCDATETIME()
FROM #PoiSeed s JOIN dbo.poi p ON p.code = s.code
WHERE NOT EXISTS (SELECT 1 FROM dbo.poi_translation tr WHERE tr.poi_id = p.id AND tr.language_code = 'vi');

-- English authored translation
UPDATE tr
SET tr.title = s.en_title, tr.summary = s.en_summary, tr.description = s.en_description,
    tr.historical_significance = NULL, tr.audio_status = 'PENDING', tr.content_hash = NULL,
    tr.audio_url = NULL, tr.audio_duration_seconds = 0, tr.translation_source = 'MANUAL', tr.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation tr JOIN dbo.poi p ON p.id = tr.poi_id JOIN #PoiSeed s ON s.code = p.code
WHERE tr.language_code = 'en';

INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
SELECT p.id, 'en', s.en_title, s.en_summary, s.en_description, NULL, 'PENDING', 'MANUAL', SYSUTCDATETIME()
FROM #PoiSeed s JOIN dbo.poi p ON p.code = s.code
WHERE NOT EXISTS (SELECT 1 FROM dbo.poi_translation tr WHERE tr.poi_id = p.id AND tr.language_code = 'en');

DROP TABLE #PoiSeed;

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

UPDATE dbo.poi SET status = 'INACTIVE', updated_at = SYSUTCDATETIME()
WHERE code IN ('POI_THIEN_HAU_01', 'POI_CAU_BA_SON_01');

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

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'com-tam-suon-bi-cha')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('com-tam-suon-bi-cha', N'Cơm tấm sườn bì chả', 'FOOD',
    N'Đĩa cơm sườn nướng than hoa thơm lừng ăn kèm bì heo giòn dai và chả trứng hấp béo ngậy.',
    N'Cơm tấm vốn là thức quà bình dân của người lao động Nam Bộ xưa từ những hạt gạo gãy vụn, nay đã thành biểu tượng ẩm thực không thể tách rời của Sài Gòn. Miếng sườn cốt lết dày dặn được ướp sả, mật ong, tiêu sọ rồi nướng trực tiếp trên bếp than hồng cho cháy cạnh óng ánh. Đĩa cơm bưng ra bốc khói, phủ lớp bì heo thấu thính gạo rang giòn bùi, lát chả trứng hấp vàng ruộm và mỡ hành bóng bẩy. Khi ăn, rưới đều muỗng nước mắm tỏi ớt pha kẹo chua ngọt, cắn thêm miếng dưa leo giòn rụm để dung hòa trọn vẹn vị mặn ngọt đậm đà.',
    55000, '/img/products/com-tam-suon-bi-cha.jpg', 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'hu-tieu-nam-vang')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('hu-tieu-nam-vang', N'Hủ tiếu Nam Vang', 'FOOD',
    N'Tô hủ tiếu dai mềm chan nước lèo xương ống ngọt thanh cùng tôm tươi, gan heo và thịt bằm.',
    N'Bắt nguồn từ cộng đồng người Hoa và người Khmer qua nhiều thập kỷ giao thoa, hủ tiếu Nam Vang đã trở thành món ăn sáng quen thuộc khắp các ngõ hẻm Sài Gòn. Sợi hủ tiếu dai mướt trần qua nước sôi vừa tới, xếp bên trên là tôm sú đỏ au, vài lát gan heo bùi béo, thịt nạc và tóp mỡ xào tỏi vàng rộm. Nước dùng hầm từ xương ống và mực khô suốt đêm cho vị ngọt hậu thanh tao không gắt bột ngọt. Ăn kiểu khô trộn sốt tương đen đậm đà hay kiểu nước chan ngập mặt kèm rổ cần tây tươi đều tròn vị.',
    60000, '/img/products/hu-tieu-nam-vang.jpg', 1, 2);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'banh-mi-pate-cha-thit')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('banh-mi-pate-cha-thit', N'Bánh mì pate chả thịt Sài Gòn', 'FOOD',
    N'Ổ bánh mì vỏ giòn rụm kẹp đẫm pate gan béo bùi, chả lụa, thịt nguội và đồ chua giải ngấy.',
    N'Ổ bánh mì tròn mình đặc ruột nướng vàng ươm trên lò than con là nét đẹp ẩm thực đường phố Sài Gòn thức giấc mỗi sớm mai. Lớp pate gan heo béo ngậy quết dọc thân bánh, tiếp nối bởi bơ trứng đánh tay, chả lụa thái mỏng, thịt xá xíu thơm mềm và dăm lát giò thủ sần sật. Điểm nhấn cân bằng vị giác nằm ở dưa leo, ngò rí và đồ chua củ cải cà rốt giòn ngọt đượm chút giấm thanh. Cắn một miếng nghe tiếng vụn bánh vỡ tan, quyện cùng nước sốt đậm đà và vị cay nồng của lát ớt hiểm.',
    30000, '/img/products/banh-mi-pate-cha-thit.jpg', 1, 3);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'pho-bo-tai-nam')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('pho-bo-tai-nam', N'Phở bò tái nạm kiểu miền Nam', 'FOOD',
    N'Bát phở bò nước dùng béo thơm đượm vị quế hồi cùng thịt tái mềm và nạm gàu giòn béo.',
    N'Khác với phong vị đất Bắc thanh đạm, phở bò phương Nam mang nét phóng khoáng với nồi nước lèo sóng sánh ánh mỡ, nồng nàn hương hồi, quế, thảo quả nướng cháy xém. Sợi bánh phở bản nhỏ ngập trong bát nước dùng ngọt đậm đà từ xương bò ninh rục. Thịt bò tái trụng lòng đào mềm ngọt kết hợp cùng nạm gàu dẻo giòn điểm chút mỡ vàng. Thưởng thức phở Sài Gòn đúng điệu không thể thiếu rổ rau ngò gai, húng quế tươi non ngắt ngập mặt bát, hòa cùng muỗng tương đen kẹo ngọt và tương ớt đỏ cay xè kích thích vị giác.',
    65000, '/img/products/pho-bo-tai-nam.jpg', 1, 4);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'banh-xeo-nam-bo')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('banh-xeo-nam-bo', N'Bánh xèo Nam Bộ', 'FOOD',
    N'Chiếc bánh xèo vàng ruộm viền giòn rụm ôm trọn nhân tôm đất, thịt ba rọi và giá đỗ tươi.',
    N'Được đổ trên chảo gang lớn với tiếng xèo xèo vui tai, bánh xèo Nam Bộ nổi bật nhờ kích thước rộng và màu vàng óng ả từ bột nghệ pha nước cốt dừa béo bùi. Lòng bánh ngập tràn nhân tôm sông ngọt thịt, thịt ba rọi xắt mỏng săn chắc cùng đậu xanh cà và giá sống thanh mát. Cách thưởng thức chuẩn là xé từng miếng bánh nóng hổi, gói cuộn trong lá cải bẹ xanh cay nồng kèm đọt xà lách, rau rừng rồi chấm ngập bát nước mắm chua ngọt giã tỏi ớt, nhấp nháp vị béo bùi giòn rụm tan nơi đầu lưỡi.',
    70000, '/img/products/banh-xeo-nam-bo.jpg', 1, 5);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bun-rieu-cua-gio-heo')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('bun-rieu-cua-gio-heo', N'Bún riêu cua giò heo', 'FOOD',
    N'Bát bún đỏ au màu cà chua với mảng riêu cua đồng thơm béo, giò heo giòn sần sật và đậu hũ rán.',
    N'Tô bún riêu Sài Gòn hấp dẫn thực khách ngay từ ánh nhìn đầu tiên nhờ sắc đỏ của cà chua chín mềm quyện cùng màu vàng rực từ dầu màu điều. Từng tảng riêu cua đồng giã nhuyễn đóng bánh chắc nịch, béo ngậy hương trứng và thịt băm, điểm xuyết khoanh giò heo hầm mềm vừa tới còn giữ độ giòn sần sật của da gân. Nước dùng chua thanh dịu nhẹ từ me chín hoặc giấm bỗng. Đừng quên nêm một thìa mắm tôm tím thẫm đánh sủi bọt, vắt lát chanh tươi và thả vội nắm rau muống chẻ xanh non để thưởng thức.',
    50000, '/img/products/bun-rieu-cua-gio-heo.jpg', 1, 6);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bo-bia-man')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('bo-bia-man', N'Bò bía mặn Sài Gòn', 'FOOD',
    N'Cuốn bò bía mỏng tang gói trọn lạp xưởng chiên bùi, củ sắn hấp ngọt lịm và tép khô rim đậm vị.',
    N'Là món ăn vặt quen thuộc trước cổng trường học và những gánh hàng rong quanh công viên Sài Gòn, bò bía mặn chinh phục người ăn bằng sự mộc mạc tinh tế. Vỏ bánh tráng dẻo mỏng cuốn chặt tay bên trong gồm củ sắn và cà rốt bào sợi hấp chín mềm ngọt nước, lạp xưởng Mai Quế Lộ thái lát mỏng, tép khô rang giòn đượm vị và rau húng quế thơm ngát. Món này ngon cốt ở chén tương đen xào tỏi ớt sền sệt, rắc thêm lạc rang giã dập và chút hành phi thơm lừng chấm ngập cuốn bánh vừa cắn.',
    35000, '/img/products/bo-bia-man.jpg', 1, 7);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'pha-lau-bo-cot-dua')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('pha-lau-bo-cot-dua', N'Phá lấu bò cốt dừa', 'FOOD',
    N'Chén phá lấu nội tạng bò mềm ngậy ngập trong nước dùng cốt dừa vàng óng ăn kèm bánh mì giòn.',
    N'Món ăn đường phố trứ danh của người Tiều du nhập vào Chợ Lớn đã trở thành ký ức ẩm thực khó quên của nhiều thế hệ người Sài Gòn. Toàn bộ lòng bò, lá sách, tổ ong, gan và bao tử được sơ chế kỹ lưỡng khử sạch mùi tanh rồi hầm mềm cùng ngũ vị hương và nước cốt dừa béo ngọt. Miếng lòng hầm vừa tới giữ trọn độ dai giòn sần sật, ngấm đều sắc vàng của bột nghệ. Chấm miếng phá lấu vào chén mắm me ớt chua cay nồng nàn rồi xé góc bánh mì giòn quẹt cạn nước sốt quả là mỹ vị.',
    45000, '/img/products/pha-lau-bo-cot-dua.jpg', 1, 8);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'banh-trang-tron-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('banh-trang-tron-cho-lon', N'Bánh tráng trộn Chợ Lớn', 'FOOD',
    N'Bịch bánh tráng trộn dai mềm thấm đẫm muối tôm Tây Ninh, khô bò đen, trứng cút và xoài xanh.',
    N'Không một góc phố nào ở Sài Gòn vắng bóng những xe bánh tráng trộn với đủ sắc màu bắt mắt. Bánh tráng sợi mềm dai được vò đều tay cùng muối tôm đậm đà, nước sốt bò đen ngọt dịu, hành phi giòn tan và mỡ hành béo ngậy. Đĩa bánh trộn đầy đặn với trứng cút luộc lòng đào, sợi xoài keo chua giòn, mực rim khô cay nồng và dăm ngọn rau răm the the đầu lưỡi. Khi ăn dùng đũa gắp một miếng đầy đủ nguyên liệu, vị chua cay mặn ngọt bùng nổ mang đến cảm giác nhâm nhi khó cưỡng.',
    25000, '/img/products/banh-trang-tron-cho-lon.jpg', 1, 9);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'goi-cuon-tom-thit')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('goi-cuon-tom-thit', N'Gỏi cuốn tôm thịt chấm tương đen', 'FOOD',
    N'Đĩa gỏi cuốn tôm sú đỏ âu cùng thịt ba chỉ thái lát mỏng cuộn tròn trong bánh tráng phơi sương.',
    N'Gỏi cuốn là đại diện tiêu biểu cho phong cách ăn uống thanh đạm, chuộng nhiều rau tươi của cư dân phương Nam. Từng cuốn bánh trong veo hé lộ sắc đỏ tươi của tôm sú luộc xẻ đôi, lát thịt ba rọi nạc mỡ đan xen cùng bún gạo trắng ngần và dải hẹ xanh vươn dài thanh nhã. Cuốn bánh chắc nịch cắn ngập miệng cảm nhận ngay độ thanh mát của xà lách, tía tô và diếp cá. Linh hồn của món nằm ở bát tương bần xay nhuyễn nấu ngọt cùng gan heo băm, điểm xuyết ớt băm cay nồng và đậu phộng rang giã mịn.',
    40000, '/img/products/goi-cuon-tom-thit.jpg', 1, 10);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'hu-tieu-mi-sa-te-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('hu-tieu-mi-sa-te-cho-lon', N'Hủ tiếu mì sa tế Chợ Lớn', 'FOOD',
    N'Tô hủ tiếu mì sợi vàng óng sóng sánh nước sốt sa tế cay nồng nàn cùng thịt bò mềm mọng.',
    N'Món ăn gia truyền độc đáo của người Tiều khu vực quận 5 và quận 11 ghi điểm bởi tầng hương vị phức hợp hiếm có. Nước dùng sền sệt được nấu từ gần hai mươi vị thảo mộc cùng ớt hiểm, sả băm, đậu phộng rang nhuyễn và tương mè đen thơm lừng. Sợi mì trứng vàng tươi dai sần sật hòa cùng sợi hủ tiếu mềm mượt dưới lớp thịt bắp bò chần vừa chín tới, giữ trọn vị ngọt tự nhiên. Khi ăn, gắp miếng thịt bò chấm muối tiêu chanh, nhai kèm lát dưa leo tươi mát để cân bằng lại độ cay nồng ấm bụng.',
    65000, '/img/products/hu-tieu-mi-sa-te-cho-lon.jpg', 1, 11);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'com-ga-xoi-mo')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('com-ga-xoi-mo', N'Cơm gà xối mỡ', 'FOOD',
    N'Dĩa cơm chiên cà chua đỏ cam thơm lừng xếp góc đùi gà xối mỡ da giòn rụm thịt mềm ngọt.',
    N'Cơm gà xối mỡ là lựa chọn no bụng quen thuộc cho bữa trưa bận rộn tại các quán ăn bình dân Sài Gòn. Hạt cơm được đảo đều trên chảo lửa lớn cùng nước cốt cà chua cho màu cam hồng bắt mắt và độ săn giòn tơi xốp. Chiếc đùi gà góc tư được luộc chín tới rồi treo lên giàn xối mỡ sôi liên tục, tạo nên lớp da ngoài mỏng tang giòn rụm nhưng thớ thịt bên trong vẫn mọng nước thơm lừng. Rưới thêm muỗng nước tương tỏi ớt pha gừng, ăn kèm vài lát cà chua và dưa leo mát lành là chuẩn vị.',
    50000, '/img/products/com-ga-xoi-mo.jpg', 1, 12);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bot-chien-trung-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('bot-chien-trung-cho-lon', N'Bột chiên trứng Chợ Lớn', 'FOOD',
    N'Đĩa bột gạo chiên giòn cháy cạnh đập hai quả trứng gà béo ngậy phủ ngập đu đủ bào sợi.',
    N'Tiếng xẻng lách cách trên chảo gang phẳng khổng lồ giữa đêm Chợ Lớn luôn kéo chân những tín đồ ăn khuya ghé lại. Khối bột gạo pha khoai môn dẻo bùi được cắt miếng vuông vức, chiên ngập mỡ heo cho lớp vỏ ngoài vàng rụm cháy cạnh trong khi ruột bên trong vẫn giữ độ mềm dẻo. Hai quả trứng gà đập thẳng lên mặt bột cùng hành lá xắt nhuyễn tạo độ ngậy béo thơm lừng. Món ăn dọn kèm đĩa đu đủ xanh ngâm giấm giòn sần sật, chan đẫm nước tương đen pha giấm đỏ chua ngọt thanh dịu.',
    40000, '/img/products/bot-chien-trung-cho-lon.jpg', 1, 13);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bun-mam-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('bun-mam-sai-gon', N'Bún mắm Sài Gòn', 'FOOD',
    N'Bát bún mắm nồng nàn hương mắm cá linh cá sặc kết hợp tôm tươi, mực giòn và heo quay bì giòn.',
    N'Chắt lọc tinh hoa từ sông nước miền Tây, bún mắm Sài Gòn được tinh chỉnh để hương vị hài hòa, dễ tiếp cận hơn mà vẫn giữ trọn bản sắc mộc mạc. Nồi nước lèo được ninh kỹ từ cốt mắm cá linh và cá sặc đồng, dậy mùi sả băm phi thơm và nước dừa xiêm ngọt lịm. Tô bún đầy ắp với tôm sú luộc đỏ au, mực ống tươi giòn, cá lóc phi lê trắng nõn và vài miếng heo quay da giòn tan đậm vị. Ăn bún mắm bắt buộc phải có đĩa rau sống phong phú với bông súng, kèo nèo, rau đắng và giá đỗ tươi giòn.',
    65000, '/img/products/bun-mam-sai-gon.jpg', 1, 14);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'oc-len-xao-dua-vinh-khanh')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('oc-len-xao-dua-vinh-khanh', N'Ốc len xào dừa Vĩnh Khánh', 'FOOD',
    N'Dĩa ốc len chặt đuôi béo ngậy ngập trong nước cốt dừa sả ớt thơm lừng phố đêm Vĩnh Khánh.',
    N'Con phố ẩm thực Vĩnh Khánh rực rỡ ánh đèn về đêm không thể thiếu mùi thơm quyến rũ từ những chảo ốc len xào dừa sôi sùng sục. Từng con ốc len tươi rói được chặt sẵn phần đuôi nhọn, xào nhanh trên lửa lớn cùng nước cốt dừa tươi nguyên chất, sả đập dập và dăm lát ớt chỉ thiên cay xé lưỡi. Khi ăn, kề miệng vào đuôi ốc hút nhẹ một hơi, phần thịt ốc giòn sần sật lọt thỏm vào miệng hòa quyện cùng dòng nước dừa béo ngậy ngọt lịm. Vét nốt thìa nước sốt ăn kèm rau răm thơm nồng khó quên.',
    75000, '/img/products/oc-len-xao-dua-vinh-khanh.jpg', 1, 15);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'so-diep-nuong-mo-hanh')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('so-diep-nuong-mo-hanh', N'Sò điệp nướng mỡ hành', 'FOOD',
    N'Đĩa sò điệp tươi nướng mỡ hành sôi xèo xèo trên than hồng rắc đẫm đậu phộng rang giòn bùi.',
    N'Hải sản nướng vỉa hè là phong cách thư giãn đặc trưng của người Sài Gòn mỗi chiều tan tầm bên bè bạn. Những con sò điệp tươi sống cạy nắp, đặt ngay ngắn trên vỉ than củi đỏ rực cho thịt sò săn lại và tiết nước ngọt lịm. Người bán thoăn thoắt chan muỗng mỡ hành xanh mướt sôi lục bục rồi rắc thêm nhúm đậu phộng rang giã nhỏ vàng ươm. Thịt sò điệp mềm ngọt tự nhiên quyện cùng độ ngậy béo của mỡ heo, mùi thơm hành lá và vị bùi giòn của lạc, chấm thêm muối tiêu chanh ớt hiểm là tuyệt hảo.',
    80000, '/img/products/so-diep-nuong-mo-hanh.jpg', 1, 16);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'banh-khot-tom-to')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('banh-khot-tom-to', N'Bánh khọt tôm tơ', 'FOOD',
    N'Dĩa bánh khọt vàng ươm viền giòn tan điểm chú tôm tươi ngọt thịt và lớp mỡ hành tôm chấy bùi béo.',
    N'Được chiên trong những chiếc khuôn đất nung truyền thống, bánh khọt chinh phục người ăn bằng lớp viền mỏng tang giòn rụm và phần đáy bánh mềm béo vị nước cốt dừa. Mỗi chiếc bánh nhỏ xinh nâng đỡ một con tôm đất tươi rói ngọt thịt, bên trên rắc vụn tôm chấy đỏ cam thơm phức cùng chút mỡ hành bóng bẩy. Cách thưởng thức đúng điệu là cuốn bánh khọt vào lá cải xanh, xà lách kèm vài nhánh ngò rí, chấm ngập trong chén nước mắm chua ngọt pha đu đủ ngâm giòn, cảm nhận trọn vẹn vị giòn rụm bùi béo lan tỏa.',
    55000, '/img/products/banh-khot-tom-to.jpg', 1, 17);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sup-cua-oc-heo-trung-bac-thao')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('sup-cua-oc-heo-trung-bac-thao', N'Súp cua óc heo trứng bắc thảo', 'FOOD',
    N'Chén súp cua nóng hổi sền sệt đầy ắp thịt cua xé, nấm tuyết giòn cùng óc heo và trứng bắc thảo bùi béo.',
    N'Những buổi chiều mưa Sài Gòn ngồi xì xụp chén súp cua nóng hổi bốc khói nghi ngút là cái thú bình dị thân thương. Nồi súp nấu từ nước dùng gà hầm ngọt lịm, khuấy đều bột năng tạo độ sền sệt bóng mượt, ngập tràn thịt cua bể xé sợi, thịt gà xé, trứng cút và nấm tuyết giòn sần sật. Miếng óc heo chần gừng béo ngậy như tan trên đầu lưỡi, kết hợp cùng nửa quả trứng bắc thảo dẻo thơm màu hổ phách. Rắc thêm chút tiêu sọ xay, vài giọt dầu mè và muỗng giấm tiều chua thanh giúp món súp dậy mùi thơm phức.',
    45000, '/img/products/sup-cua-oc-heo-trung-bac-thao.jpg', 1, 18);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'mi-vit-tiem-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('mi-vit-tiem-cho-lon', N'Mì vịt tiềm Chợ Lớn', 'FOOD',
    N'Tô mì sợi dai giòn ngập nước dùng thảo mộc thơm lừng cùng chiếc đùi vịt tiềm mềm rục da giòn.',
    N'Là đỉnh cao ẩm thực Quảng Đông gìn giữ qua nhiều thế hệ tại Chợ Lớn, mì vịt tiềm đòi hỏi quy trình chế biến vô cùng công phu. Chiếc đùi vịt góc tư được tẩm ướp gia vị bí truyền, chiên sơ cho da vàng ruộm rồi đem tiềm rục cùng đẳng sâm, kỷ tử, thục địa và nấm đông cô suốt nhiều giờ liền. Sợi mì trứng vàng óng cán mỏng dai giòn sần sật không hề bở nát khi chan ngập nước dùng nâu sẫm ngọt đậm đà hương thuốc bắc. Thịt vịt mềm tới mức róc xương, chấm kèm đu đủ muối chua ngọt giải ngấy tuyệt vời.',
    110000, '/img/products/mi-vit-tiem-cho-lon.jpg', 1, 19);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'hu-tieu-go-xa-xiu')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('hu-tieu-go-xa-xiu', N'Hủ tiếu gõ xá xíu', 'FOOD',
    N'Bát hủ tiếu gõ đơn sơ đậm đà nước lèo xương ống cùng vài lát xá xíu đỏ au và tóp mỡ giòn rụm.',
    N'Âm thanh lách cách của hai thanh tre gõ vào nhau trong đêm khuya đã trở thành một phần ký ức không thể thiếu của phố thị Sài Gòn. Bát hủ tiếu bình dân với sợi hủ tiếu mỏng dẻo trụng nhanh, xếp lên vài lát thịt nạc xá xíu xắt mỏng viền đỏ au, viên bò viên nhỏ và dúm hẹ xanh mát mắt. Nước lèo ninh từ xương heo và củ cải muối ngọt thanh tự nhiên, rắc ngập thìa tóp mỡ béo ngậy giòn tan và hành phi thơm nức. Ăn lúc nửa đêm đói bụng, xịt thêm chút tương ớt cay ấm lòng khôn xiết.',
    30000, '/img/products/hu-tieu-go-xa-xiu.jpg', 1, 20);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'ca-phe-sua-da-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('ca-phe-sua-da-sai-gon', N'Cà phê sữa đá Sài Gòn', 'DRINK',
    N'Ly cà phê pha phin đậm đặc nhỏ giọt hòa cùng sữa đặc béo ngọt và đá nhuyễn mát lạnh.',
    N'Cà phê sữa đá từ lâu đã trở thành nhịp sống buổi sáng không thể thiếu của người dân đô thị phương Nam. Những giọt cà phê Robusta rang mộc thơm nồng nhỏ giọt chầm chậm qua phin nhôm truyền thống, rớt xuống lớp sữa đặc ngọt ngào béo ngậy dưới đáy ly. Dùng muỗng khuấy đều tay cho màu nâu cánh gián sánh quyện xuất hiện rồi trút ngập đá bi mát lạnh. Vị đắng đậm đà của hạt cà phê Tây Nguyên hòa cùng hậu vị ngọt bùi của sữa đặc, nhấp từng ngụm chậm rãi mang lại sự tỉnh táo sảng khoái suốt ngày dài.',
    25000, '/img/products/ca-phe-sua-da-sai-gon.jpg', 1, 21);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'ca-phe-vot-ba-lu')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('ca-phe-vot-ba-lu', N'Cà phê vợt Ba Lù', 'DRINK',
    N'Tách cà phê vợt nấu ấm đất bốc khói ngun ngút lưu giữ hương vị mộc mạc trăm năm của người Hoa.',
    N'Nằm sâu trong khu Chợ Lớn cổ kính, cà phê vợt vẫn giữ nguyên phương pháp pha chế độc đáo bằng bếp than củi đỏ rực và ấm đất nung. Bột cà phê mịn được ủ kỹ trong chiếc vợt vải dài, đảo đều trong nước sôi lăn tăn cho chiết xuất trọn vẹn từng giọt hương thơm mộc mạc nguyên bản. Nước cà phê màu nâu trong veo, không sánh đặc như pha phin nhưng đượm mùi khói than ấm áp và hậu vị chua thanh nhẹ nhàng. Uống kèm chút sữa đặc béo ngọt trong ly thủy tinh con bên bàn cờ tướng tạo nên phong vị hoài cổ.',
    20000, '/img/products/ca-phe-vot-ba-lu.jpg', 1, 22);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bac-xiu-ba-tang-da')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('bac-xiu-ba-tang-da', N'Bạc xỉu ba tầng đá', 'DRINK',
    N'Ly bạc xỉu phân tầng đẹp mắt với lớp sữa đặc ngọt bùi, sữa tươi béo ngậy và lớp bọt cà phê thơm đượm.',
    N'Bạc xỉu là nét sáng tạo độc đáo của người lao động Chợ Lớn xưa dành cho phụ nữ và trẻ em không quen uống cà phê đậm đặc. Ly bạc xỉu ba tầng hấp dẫn với đáy ly là sữa đặc ngọt ngào, tầng giữa là sữa tươi thanh béo êm dịu và trên cùng là lớp cà phê đen đánh bọt bồng bềnh thơm phức. Thêm đá viên mát lạnh rồi khuấy đều tay trước khi thưởng thức. Từng ngụm đồ uống trôi qua cuống họng tràn ngập vị ngọt béo ngậy của sữa, chỉ phảng phất chút đắng nhẹ nhàng nơi đầu lưỡi rất dễ chịu.',
    30000, '/img/products/bac-xiu-ba-tang-da.jpg', 1, 23);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-dao-cam-sa')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('tra-dao-cam-sa', N'Trà đào cam sả', 'DRINK',
    N'Ly trà thanh mát đượm hương sả tươi kết hợp nước cam vắt chua thanh cùng những miếng đào giòn ngọt.',
    N'Trở thành cơn sốt trong giới trẻ Sài Gòn suốt nhiều năm, trà đào cam sả là thức uống giải nhiệt lý tưởng dưới cái nắng nhiệt đới oi ả. Cốt trà đen hoặc trà olong được ủ cùng những nhánh sả tươi đập dập dậy mùi thơm thanh khiết, pha cùng nước cam vàng vắt mọng nước tạo vị chua ngọt hài hòa dễ chịu. Điểm nhấn hấp dẫn là những miếng đào ngâm màu vàng cam giòn sần sật ngập trong đá lạnh. Vừa nhâm nhi ngụm trà mát lạnh sảng khoái vừa nhai miếng đào ngọt lịm xua tan mọi mệt mỏi.',
    35000, '/img/products/tra-dao-cam-sa.jpg', 1, 24);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nuoc-mia-sau-rieng')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('nuoc-mia-sau-rieng', N'Nước mía sầu riêng', 'DRINK',
    N'Ly nước mía ép tươi xanh ngắt xay nhuyễn cùng múi sầu riêng béo ngậy thơm nồng nàn.',
    N'Sự kết hợp táo bạo giữa cây mía ngọt mát miền Tây và sầu riêng chín cây trứ danh đã tạo nên món đồ uống vỉa hè độc nhất vô nhị. Cây mía tím được ép kiệt nước qua trục lăn cùng chút nước cốt tắc chua dịu, sau đó cho vào máy xay đều với múi sầu riêng tươi vàng ươm béo ngậy. Rót ra ly ngập đá vụn, một lớp bọt mịn màng nổi lên mang theo hương thơm nồng nàn đặc trưng. Vị ngọt thanh của mía hòa tan cùng vị béo ngậy đậm đà của sầu riêng đem lại cảm giác lạ miệng khó quên.',
    20000, '/img/products/nuoc-mia-sau-rieng.jpg', 1, 25);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nuoc-sam-rong-bien-hat-e')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('nuoc-sam-rong-bien-hat-e', N'Nước sâm rong biển hạt é', 'DRINK',
    N'Ly nước sâm nấu lá dứa rong biển thanh mát màu nâu sẫm thả ngập hạt é giòn mát giải nhiệt.',
    N'Những xe nước sâm giải khát góc ngã tư đường phố luôn là cứu cánh quen thuộc của người đi đường giữa trưa nắng gắt Sài Gòn. Nước sâm được nấu thủ công từ rong biển khô, thục địa, mía lau, rễ tranh và lá dứa tươi cho màu nâu sẫm tự nhiên cùng vị ngọt thanh tao không gắt đường. Thả thêm muỗng hạt é ngâm nở bung xòe giòn mát trôi tuột qua cuống họng. Uống một hơi cạn ly nước sâm ướp lạnh, cảm giác nóng nực trong người như tan biến hoàn toàn, để lại dư vị mộc mạc dễ chịu.',
    15000, '/img/products/nuoc-sam-rong-bien-hat-e.jpg', 1, 26);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-dau-tam-dong-du')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('tra-dau-tam-dong-du', N'Trà dâu tằm Đông Du', 'DRINK',
    N'Ly trà lài thơm ngát quyện cùng mứt dâu tằm chua ngọt đỏ au và dăm trái dâu tươi mọng nước.',
    N'Bắt nguồn từ những quán nước vỉa hè quanh khu phố Đông Du quận 1, trà dâu tằm đã trở thành thức uống gắn liền với thói quen tụ tập tán gẫu của giới trẻ. Cốt trà lài thơm ngát thoang thoảng được lắc đều cùng mứt dâu tằm ngâm đường phèn chua ngọt sóng sánh và nước cốt chanh tươi mát. Ly trà mang màu đỏ tím quyến rũ, bên trên phủ đầy những trái dâu tằm chín mọng dẻo dai nhai vui miệng. Vị chua thanh ngọt dịu hòa lẫn vị chát nhẹ của trà xua tan ngay cơn khát ngày hè.',
    30000, '/img/products/tra-dau-tam-dong-du.jpg', 1, 27);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-tac-xi-muoi-hat-chia')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('tra-tac-xi-muoi-hat-chia', N'Trà tắc xí muội hạt chia', 'DRINK',
    N'Ly trà tắc mát lạnh vị chua thanh hòa cùng viên xí muội mằn mặn và hạt chia thanh lọc cơ thể.',
    N'Trà tắc xí muội là thức uống đường phố bình dân nhưng sở hữu khả năng kích thích vị giác cực kỳ mạnh mẽ. Trà xanh ủ đậm đà được lắc cùng nước cốt tắc tươi chua thanh, đường cát trắng và một trái xí muội ngâm mềm mằn mặn thơm nồng thảo mộc. Rắc thêm muỗng hạt chia ngâm nở đều vừa tạo cảm giác thú vị khi nhai vừa tốt cho sức khỏe. Ngụm nước đầu tiên mang đến đủ tầng vị chua, ngọt, chát, mặn đan xen hài hòa, thấm sâu làm dịu mát ngay tức khắc cuống họng khô rát.',
    20000, '/img/products/tra-tac-xi-muoi-hat-chia.jpg', 1, 28);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'rau-ma-dau-xanh-cot-dua')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('rau-ma-dau-xanh-cot-dua', N'Rau má đậu xanh cốt dừa', 'DRINK',
    N'Ly sinh tố rau má tươi xanh mướt hòa quyện đậu xanh xay nhuyễn và nước cốt dừa béo bùi.',
    N'Rau má tươi thu hoạch từ vùng đất Củ Chi được rửa sạch, xay nhuyễn và lọc lấy dòng nước cốt xanh biếc mát lành tràn trề sức sống. Điểm làm nên sự khác biệt của phiên bản Sài Gòn là sự góp mặt của lớp đậu xanh đồ chín xay nhuyễn mịn màng cùng muỗng nước cốt dừa tươi thơm béo. Ba tầng nguyên liệu hòa vào nhau khi lắc đều với đá bi tạo nên thức uống xanh ngát sánh mịn. Vị nhằng nhặng đắng đặc trưng của rau má được trung hòa hoàn hảo bởi vị bùi ngọt của đậu xanh.',
    25000, '/img/products/rau-ma-dau-xanh-cot-dua.jpg', 1, 29);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nuoc-mia-tac-truyen-thong')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('nuoc-mia-tac-truyen-thong', N'Nước mía tắc truyền thống', 'DRINK',
    N'Ly nước mía ép tươi ngọt lịm thoang thoảng hương tinh dầu vỏ tắc xanh mát lạnh sảng khoái.',
    N'Không gì mộc mạc và chân thật bằng một ly nước mía ép tươi bên chiếc máy quay tay thân thuộc khắp phố phường Sài Gòn. Cây mía róc vỏ sạch bóng được kẹp chung với một quả tắc xanh rồi cho qua trục ép kim loại, vắt kiệt dòng nước ngọt lành màu vàng xanh óng ả. Tinh dầu từ vỏ tắc hòa lẫn vị chua dịu của nước cốt làm giảm vị ngọt gắt của đường mía tự nhiên. Rót đầy ly đá bào mịn, uống một ngụm lớn cảm nhận dòng nước mát lạnh ngọt lịm tưới mát tâm hồn sau giờ làm.',
    15000, '/img/products/nuoc-mia-tac-truyen-thong.jpg', 1, 30);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'che-mam-16-mon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('che-mam-16-mon', N'Chè mâm 16 món', 'DRINK',
    N'Mâm chè truyền thống 16 chén nhỏ đủ loại chè đậu, chè bà ba và trôi nước béo ngậy nước cốt dừa.',
    N'Tồn tại suốt hơn nửa thế kỷ trên đường Sư Vạn Hạnh, chè mâm là trải nghiệm ẩm thực cộng đồng độc đáo không nơi nào có được. Một mâm nhôm tròn bày biện ngay ngắn mười sáu chén chè nhỏ nghi ngút khói: chè đậu trắng, đậu đen, đậu đỏ, chè chuối nướng, chè bà ba, chè bắp, trôi nước ngũ sắc chan nước cốt dừa béo ngậy rắc mè rang. Ngồi quây quần cùng bạn bè thưởng thức từng muỗng chè ngọt bùi ấm nóng, cảm nhận trọn vẹn sự phong phú và ngọt ngào của văn hóa ẩm thực Nam Bộ xưa.',
    85000, '/img/products/che-mam-16-mon.jpg', 1, 31);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sam-bo-luong-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('sam-bo-luong-cho-lon', N'Sâm bổ lượng Chợ Lớn', 'DRINK',
    N'Ly chè thanh mát với rong biển, nhãn nhục, hạt sen, củ năng giòn ngọt chan nước đường phèn thanh khiết.',
    N'Sâm bổ lượng là món chè tráng miệng thanh nhiệt danh tiếng có nguồn gốc từ nền y thực dưỡng sinh của người Hoa Chợ Lớn. Bát chè trong veo ngập tràn các vị thảo mộc bổ dưỡng: hạt sen bùi bở, củ năng gọt tròn giòn ngọt, nhãn nhục nâu sẫm dẻo thơm, bo bo dai mềm, táo tàu đỏ au và rong biển thanh mát. Nước chè nấu từ đường phèn thanh tao thoang thoảng hương hoa lài dịu nhẹ. Khi ăn thêm chút đá nhuyễn, múc từng thìa thưởng thức vị giòn mát ngọt dịu, giúp an thần dưỡng tâm sau ngày dài bận rộn.',
    30000, '/img/products/sam-bo-luong-cho-lon.jpg', 1, 32);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'che-thai-sau-rieng')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('che-thai-sau-rieng', N'Chè thái sầu riêng', 'DRINK',
    N'Bát chè thái ngập tràn mít chín, thạch lá dứa, thốt nốt và múi sầu riêng béo ngậy ngập sữa tươi.',
    N'Con đường Nguyễn Tri Phương luôn tấp nập thực khách tìm đến các quán chè Thái nức tiếng với mùi thơm sầu riêng lan tỏa từ đầu phố. Bát chè rực rỡ sắc màu với những sợi mít nghệ vàng ươm ngọt lịm, hạt thốt nốt dẻo dai trong suốt, thạch dừa giòn sần sật, sợi thạch lá dứa xanh mướt và hạt lựu đỏ giòn. Nước chan nấu từ sữa tươi béo ngậy hòa quyện cùng cơm sầu riêng chín rục xay mịn. Trộn đều cùng đá bào mát lạnh, từng thìa chè ngậy béo thơm lừng đưa vào miệng ngon khó cưỡng.',
    40000, '/img/products/che-thai-sau-rieng.jpg', 1, 33);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'cacao-dua-da-xay-di-beo')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('cacao-dua-da-xay-di-beo', N'Cacao dừa đá xay Dì Béo', 'DRINK',
    N'Ly đá xay dừa tươi béo ngậy phủ ngập bột ca cao nguyên chất đậm đà sốt socola sánh mịn.',
    N'Món đồ uống giải nhiệt sáng tạo từng làm mưa làm gió trong các con hẻm ẩm thực quận 4 với phong cách đậm chất Sài Gòn. Cùi dừa non và nước dừa tươi nguyên chất được xay nhuyễn cùng đá viên tạo nên lớp tuyết trắng sánh mịn béo ngậy thơm mát. Bên trên được rắc phủ lớp bột ca cao nguyên chất nâu sẫm đắng nhẹ cùng dòng sốt socola ngọt ngào đặc sánh. Khi dùng muỗng múc một miếng đầy đủ hai phần, vị đắng bùi của ca cao hòa tan cùng vị béo mát của dừa tươi vô cùng bắt miệng.',
    35000, '/img/products/cacao-dua-da-xay-di-beo.jpg', 1, 34);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sua-dau-nanh-bap-la-dua')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('sua-dau-nanh-bap-la-dua', N'Sữa đậu nành bắp lá dứa', 'DRINK',
    N'Ly sữa hạt nóng hổi thơm nức mùi bắp non và lá dứa xanh ngát nấu cùng đậu nành nguyên chất.',
    N'Những nồi sữa đậu nành bốc khói ấm áp trên vỉa hè đêm muộn luôn là chốn dừng chân bình yên của người dân thành phố. Hạt đậu nành ta chọn lọc được ngâm mềm, xay mịn và nấu chung với những bắp ngô ngọt non mới bẻ cùng bó lá dứa tươi cuộn tròn. Dòng sữa sánh vàng nhạt tỏa hương thơm mộc mạc dịu nhẹ của đồng nội. Nhấp ngụm sữa ấm nóng cảm nhận ngay vị béo ngậy tự nhiên, hậu vị ngọt thanh nơi cuống họng, có thể uống nóng vào đêm se lạnh hoặc thêm đá giải khát ban ngày.',
    18000, '/img/products/sua-dau-nanh-bap-la-dua.jpg', 1, 35);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-mang-cau-xiem')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('tra-mang-cau-xiem', N'Trà mãng cầu xiêm chua ngọt', 'DRINK',
    N'Ly trà lài thơm thoang thoảng lắc cùng thịt mãng cầu xiêm chua ngọt dẻo dai mọng nước.',
    N'Trà mãng cầu xiêm là món đồ uống hiện đại nhanh chóng chiếm trọn tình cảm của thực khách nhờ hương vị chua ngọt sảng khoái khó quên. Trái mãng cầu xiêm chín cây được xé múi tách hạt khéo léo rồi ướp cùng chút đường cát cho tiết ra dòng nước cốt sóng sánh đậm đà. Lắc đều thịt mãng cầu dẻo thơm cùng cốt trà lài ủ lạnh và vài giọt tắc tươi tạo nên ly trà vàng nhạt óng ả. Vừa uống ngụm trà chát ngọt vừa nhai những thớ thịt mãng cầu dai dẻo mọng nước vô cùng kích thích.',
    35000, '/img/products/tra-mang-cau-xiem.jpg', 1, 36);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'dua-tac-ngam-duong-thot-not')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('dua-tac-ngam-duong-thot-not', N'Dừa tắc ngâm đường thốt nốt', 'DRINK',
    N'Ly nước dừa xiêm ngọt lịm chan ngập mứt tắc ngào đường thốt nốt và cơm dừa giòn bùi.',
    N'Ghé qua đường Pasteur vào những buổi chiều oi ả, xe dừa tắc luôn đông đúc người đứng chờ mua ly nước giải nhiệt truyền thống. Nước dừa xiêm Bến Tre ngọt lịm tự nhiên được rót ra ly lớn, thêm vào vài thìa mứt vỏ tắc rim đường thốt nốt thơm lừng dẻo quẹo mằn mặn chua ngọt. Đáy ly là những lát cơm dừa nạo giòn sần sật bùi béo cùng dăm hạt đậu phộng rang giòn rụm. Khuấy tan đều cùng đá bi mát lạnh, từng ngụm nước ngọt mát làm dịu cơn khát tức thì.',
    25000, '/img/products/dua-tac-ngam-duong-thot-not.jpg', 1, 37);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-sen-vang-cu-nang')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('tra-sen-vang-cu-nang', N'Trà sen vàng củ năng', 'DRINK',
    N'Ly trà ô long thanh khiết kết hợp hạt sen ninh bở mềm, củ năng giòn ngọt và lớp kem sữa béo ngậy.',
    N'Món đồ uống trang nhã kết hợp hoàn hảo giữa hương vị truyền thống và phong cách pha chế hiện đại được yêu thích khắp các quán cà phê Sài thành. Cốt trà ô long thượng hạng ủ vừa tới giữ trọn sắc vàng óng và vị chát nhẹ ngọt hậu, hòa cùng những hạt sen tươi ninh mềm bở bùi ngậy. Dưới đáy ly là những viên củ năng áo bột lọc giòn ngọt sần sật, phủ lên trên cùng là lớp kem béo mằn mặn mịn như nhung. Thưởng thức từng tầng hương vị thanh tao mang lại cảm giác thư thái dễ chịu.',
    45000, '/img/products/tra-sen-vang-cu-nang.jpg', 1, 38);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nuoc-dang-24-vi-cho-lon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('nuoc-dang-24-vi-cho-lon', N'Nước đắng 24 vị Chợ Lớn', 'DRINK',
    N'Chén nước đắng thảo dược 24 vị đen nhánh đặc trưng của các tiệm thuốc bắc gia truyền Chợ Lớn.',
    N'Trước cửa các tiệm thuốc bắc cổ kính trên đường Hải Thượng Lãn Ông, những ấm đồng đựng nước đắng 24 vị luôn nghi ngút khói phục vụ bà con lao động. Nấu từ hai mươi bốn vị thuốc nam thảo mộc quý như xuyên tâm liên, cam thảo, kim ngân hoa, hoa cúc và actiso, bát nước có màu đen kịt đặc trưng. Vị đắng gắt nồng xộc lên sống mũi trong ngụm đầu tiên nhưng lập tức chuyển hóa thành vị ngọt thanh nơi cuống họng. Thức uống dưỡng sinh này giúp giải độc, thanh lọc gan và xua tan mệt mỏi hiệu nghiệm.',
    15000, '/img/products/nuoc-dang-24-vi-cho-lon.jpg', 1, 39);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sinh-to-bo-dua-sap')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, is_active, sort_order)
    VALUES ('sinh-to-bo-dua-sap', N'Sinh tố bơ dừa sáp', 'DRINK',
    N'Ly sinh tố bơ sáp sánh mịn ngậy béo kết hợp dừa sáp Cầu Kè dẻo quẹo hòa cùng sữa đặc ngọt thơm.',
    N'Là món sinh tố cao cấp trứ danh tại các phố trái cây đêm Sài Gòn, thức uống này quyến rũ bởi độ sánh đặc và độ ngậy béo tột đỉnh. Trái bơ sáp Đắk Lắk dẻo vàng ươm được nạo sạch thịt, xay nhuyễn cùng cơm dừa sáp đặc ruột dẻo quẹo nức tiếng của đất Trà Vinh, thêm chút sữa tươi và sữa đặc béo ngậy. Ly sinh tố màu xanh ngọc bích sánh mịn như kem, xúc từng muỗng ngập tràn vị béo ngậy tan chảy trên đầu lưỡi, thơm lừng hương bơ dừa tự nhiên không hề ngấy.',
    45000, '/img/products/sinh-to-bo-dua-sap.jpg', 1, 40);
GO
