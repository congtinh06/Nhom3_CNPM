-- ==============================================================================
-- Echora — Flyway Repeatable Migration: Seed Data mẫu cho saigonvoice_content_db
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

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'CHO_LON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('CHO_LON', N'Khu Di sản Chợ Lớn', N'Khu phố cổ người Hoa lâu đời với nét văn hóa đặc sắc, chùa cổ, hội quán và ẩm thực truyền thống.', 10.7533000, 106.6575000, 700);

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'VINH_KHANH')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('VINH_KHANH', N'Phố Ẩm thực Vĩnh Khánh', N'Khu phố ẩm thực đường phố sôi động về đêm, nổi tiếng với các món ốc và hải sản tươi ngon.', 10.7600000, 106.7025000, 400);

IF NOT EXISTS (SELECT 1 FROM dbo.zone WHERE code = 'BA_SON')
    INSERT INTO dbo.zone (code, name, description, center_lat, center_lng, radius_meters)
    VALUES ('BA_SON', N'Khu Đô thị Ven sông & Cảng Ba Son', N'Khu vực gắn liền với di tích xưởng đóng tàu Ba Son lịch sử kết hợp cùng không gian đô thị hiện đại ven sông Sài Gòn.', 10.7835000, 106.7085000, 450);
GO

-- 2. SEED CÁC DANH MỤC DU LỊCH (CATEGORY)
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

-- Chỉ chèn POI khi chưa tồn tại. Không UPDATE để tránh ghi đè dữ liệu admin đã sửa.
INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, slug, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url, status, created_at, updated_at)
SELECT @Zone1, (SELECT id FROM dbo.category WHERE code = s.category_code), s.code, s.qr_token, s.slug, s.name,
       s.latitude, s.longitude, s.trigger_radius_meters, NULL, s.thumbnail_url, 'ACTIVE', SYSUTCDATETIME(), SYSUTCDATETIME()
FROM #PoiSeed s
WHERE NOT EXISTS (SELECT 1 FROM dbo.poi p WHERE p.code = s.code);

-- Vietnamese source translation (authored) - chỉ chèn khi chưa có.
INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
SELECT p.id, 'vi', s.vi_title, s.vi_summary, s.vi_description, NULL, 'PENDING', 'MANUAL', SYSUTCDATETIME()
FROM #PoiSeed s JOIN dbo.poi p ON p.code = s.code
WHERE NOT EXISTS (SELECT 1 FROM dbo.poi_translation tr WHERE tr.poi_id = p.id AND tr.language_code = 'vi');

-- English authored translation - chỉ chèn khi chưa có.
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
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, slug, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone2, @CatReli, 'POI_THIEN_HAU_01', 'qr-thien-hau-01', N'chua-ba-thien-hau', N'Chùa Bà Thiên Hậu (Hội quán Tuệ Thành)', 10.7538000, 106.6601000, 35, N'Số 710 Đường Nguyễn Trãi', '/images/thienhau.jpg');

    DECLARE @PoiId4 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
    VALUES (@PoiId4, 'vi', N'Chùa Bà Thiên Hậu', 
            N'Bạn đang đứng trước Chùa Bà Thiên Hậu, hay Hội quán Tuệ Thành, một trong những ngôi chùa cổ và linh thiêng nhất của cộng đồng người Hoa tại Chợ Lớn. Công trình được xây dựng khoảng năm 1760, nổi tiếng với kiến trúc nhiều lớp và những phù điêu gốm nung rực rỡ trên mái.',
            N'Hội quán Tuệ Thành, thường được gọi là Chùa Bà Thiên Hậu, nằm ở số 710 đường Nguyễn Trãi, Quận 5. Công trình do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 để thờ Bà Thiên Hậu, vị thần bảo hộ người đi biển và người buôn bán. Trải qua hơn hai thế kỷ, chùa vẫn là nơi sinh hoạt tín ngưỡng quen thuộc của người dân Chợ Lớn.

Ngôi chùa được tổ chức theo kiểu hội quán với nhiều lớp không gian nối tiếp nhau, gồm tiền điện, trung điện và hậu điện. Điểm nổi bật là bộ khung gỗ chạm trổ, các hoành phi, câu đối và những phù điêu gốm nung nhiều màu trên mái. Các hình tượng nhân vật, rồng, chim và hoa lá được đắp nổi tỉ mỉ, tạo nên vẻ rực rỡ đặc trưng của kiến trúc người Hoa.

Trong chùa có không gian thờ tự trang nghiêm, hương khói quanh năm và những dấu tích cho thấy sự gắn bó lâu đời của cộng đồng người Hoa với vùng đất Sài Gòn - Chợ Lớn. Khi tham quan, bạn nên đi nhẹ, nói khẽ, giữ trang phục lịch sự và hỏi trước nếu muốn chụp ảnh trong khu vực thờ tự.

Công trình được công nhận là di tích kiến trúc nghệ thuật cấp quốc gia vào ngày 7 tháng 1 năm 1993. Chùa nằm gần nhiều điểm tham quan khác của Chợ Lớn, nên bạn có thể kết hợp ghé thăm trong cùng một buổi dạo quanh khu vực.',
            N'Chùa được công nhận ngày 7/1/1993 là di tích kiến trúc nghệ thuật cấp quốc gia, ghi dấu vai trò trung tâm tín ngưỡng và sinh hoạt cộng đồng của người Hoa gốc Quảng Đông tại Chợ Lớn.',
            'PENDING', 'MANUAL', SYSUTCDATETIME());
END

-- POI 5: Cầu Ba Son
-- Địa chỉ chỉ giữ số nhà và tên đường: Đường Tôn Đức Thắng
IF NOT EXISTS (SELECT 1 FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01')
BEGIN
    INSERT INTO dbo.poi (zone_id, category_id, code, qr_token, slug, name, latitude, longitude, trigger_radius_meters, address, thumbnail_url)
    VALUES (@Zone4, @CatArch, 'POI_CAU_BA_SON_01', 'qr-ba-son-01', N'cau-ba-son', N'Cầu Ba Son', 10.7818000, 106.7092000, 50, N'Đường Tôn Đức Thắng', '/images/bason.jpg');

    DECLARE @PoiId5 BIGINT = SCOPE_IDENTITY();
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
    VALUES (@PoiId5, 'vi', N'Cầu Ba Son', 
            N'Bạn đang đứng trước Cầu Ba Son, cây cầu dây văng hiện đại bắc qua sông Sài Gòn. Cây cầu nối trung tâm thành phố với Khu đô thị mới Thủ Thiêm, với trụ tháp nghiêng cao 113 mét tạo thành điểm nhấn nổi bật trên sông.',
            N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, nối khu vực đường Tôn Đức Thắng ở trung tâm thành phố với Khu đô thị mới Thủ Thiêm. Cầu thông xe ngày 28 tháng 4 năm 2022, góp phần rút ngắn hành trình giữa hai bờ và mở rộng kết nối giao thông của thành phố.

Điểm dễ nhận ra nhất của cầu là trụ tháp hình vòm cao khoảng 113 mét, nghiêng về phía Thủ Thiêm. Hệ dây văng kéo các nhịp cầu tạo nên dáng vẻ thanh thoát, đồng thời mở ra góc nhìn rộng về sông Sài Gòn, bờ Thủ Thiêm và khu trung tâm.

Cầu từng được gọi là Thủ Thiêm 2. Ngày 9 tháng 12 năm 2022, Hội đồng Nhân dân Thành phố Hồ Chí Minh thông qua việc đặt tên Ba Son, nhằm gắn cây cầu với tên gọi của xưởng đóng tàu Ba Son, một địa danh lịch sử bên bờ sông.

Khi dạo bộ ven sông hoặc đi qua cầu, bạn có thể ngắm toàn cảnh khu vực, đặc biệt là vào buổi chiều khi ánh nắng phản chiếu trên mặt nước. Đây cũng là điểm kết nối thuận tiện để tiếp tục hành trình đến các khu vực ven sông của thành phố.',
            N'Cầu từng mang tên Thủ Thiêm 2. Ngày 9/12/2022, HĐND TP.HCM thông qua việc đặt tên Ba Son, theo tên xưởng đóng tàu Ba Son lịch sử.',
            'PENDING', 'MANUAL', SYSUTCDATETIME());
END

-- English authored translations for the two additional demo POIs.
IF NOT EXISTS (
    SELECT 1 FROM dbo.poi_translation t
    JOIN dbo.poi p ON p.id = t.poi_id
    WHERE p.code = 'POI_THIEN_HAU_01' AND t.language_code = 'en'
)
BEGIN
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
    SELECT p.id, 'en', N'Ba Thien Hau Pagoda',
           N'You are standing in front of Ba Thien Hau Pagoda, also known as Tue Thanh Assembly Hall, one of the oldest and most revered Chinese temples in Cho Lon. Built around 1760, it is known for its multi-hall layout and the colorful ceramic reliefs covering its roof.',
           N'Tue Thanh Assembly Hall, commonly called Ba Thien Hau Pagoda, stands at 710 Nguyen Trai Street in District 5. It was built around 1760 by the Cantonese Chinese community to honor Thien Hau, the goddess believed to protect seafarers and traders. After more than two centuries, the temple remains a living place of worship for the Cho Lon community.

The temple follows the layout of a Chinese assembly hall, with a series of connected spaces leading from the front hall through the middle hall to the rear hall. Its wooden frames, horizontal boards, couplets and roof are richly decorated. The roof is especially notable for its glazed ceramic reliefs, where figures, dragons, birds and flowers are built up in fine detail.

Inside, the atmosphere is quiet and incense-filled, with altars and ornaments that reflect the long presence of the Cantonese community in Saigon and Cho Lon. Visitors should dress respectfully, keep their voices low and ask before taking photographs in the worship areas.

The temple was recognized as a national architectural and artistic relic on 7 January 1993. It sits close to several other attractions in Cho Lon, so it can easily be combined with a walk through the neighborhood.',
           N'The temple was recognized as a national architectural and artistic relic on 7 January 1993, reflecting its role as a center of worship and community life for the Cantonese Chinese community in Cho Lon.',
           'PENDING', 'MANUAL', SYSUTCDATETIME()
    FROM dbo.poi p
    WHERE p.code = 'POI_THIEN_HAU_01';
END

IF NOT EXISTS (
    SELECT 1 FROM dbo.poi_translation t
    JOIN dbo.poi p ON p.id = t.poi_id
    WHERE p.code = 'POI_CAU_BA_SON_01' AND t.language_code = 'en'
)
BEGIN
    INSERT INTO dbo.poi_translation (poi_id, language_code, title, summary, description, historical_significance, audio_status, translation_source, updated_at)
    SELECT p.id, 'en', N'Ba Son Bridge',
           N'You are standing in front of Ba Son Bridge, a modern cable-stayed bridge across the Saigon River. It links the city center with the Thu Thiem New Urban Area, and its 113-meter inclined tower has become a striking landmark on the river.',
           N'Ba Son Bridge is an asymmetric cable-stayed bridge over the Saigon River, connecting Ton Duc Thang Street in the city center with the Thu Thiem New Urban Area. It opened to traffic on 28 April 2022, shortening the journey between the two banks and strengthening the city''s transport links.

Its most recognizable feature is the 113-meter arched tower, which leans toward Thu Thiem. The cables fan out to support the bridge deck, giving the structure a light appearance and opening wide views of the Saigon River, the Thu Thiem bank and the city center.

The bridge was once known as Thu Thiem 2. On 9 December 2022, the Ho Chi Minh City People''s Council approved the name Ba Son, linking the bridge to the historic Ba Son Shipyard on the riverbank.

When walking along the riverside or crossing the bridge, you can take in the panorama of the area, especially in the late afternoon when sunlight reflects off the water. The bridge is also a convenient connection for continuing your journey to other riverside districts.',
           N'The bridge was once known as Thu Thiem 2. On 9 December 2022, the Ho Chi Minh City People''s Council approved the name Ba Son, after the historic Ba Son Shipyard.',
           'PENDING', 'MANUAL', SYSUTCDATETIME()
    FROM dbo.poi p
    WHERE p.code = 'POI_CAU_BA_SON_01';
END
GO

-- 4. SEED 3 TUYẾN THAM QUAN (ROUTE) & GÁN ĐIỂM DỪNG THEO THỨ TỰ (STOP_ORDER)
DECLARE @RZone1 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'D1_HISTORIC');
DECLARE @RZone2 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'CHO_LON');
DECLARE @RZone4 BIGINT = (SELECT id FROM dbo.zone WHERE code = 'BA_SON');

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone1 AND name = N'Tuyến Kiến trúc Trung tâm Quận 1')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone1, N'Tuyến Kiến trúc Trung tâm Quận 1', N'Tuyến đi bộ tham quan các công trình kiến trúc lịch sử tiêu biểu tại khu vực trung tâm quanh Nhà thờ Đức Bà và Chợ Bến Thành.', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone2 AND name = N'Tuyến Hội quán Chợ Lớn')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone2, N'Tuyến Hội quán Chợ Lớn', N'Khám phá các hội quán và chùa cổ của cộng đồng người Hoa tại Chợ Lớn.', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.route WHERE zone_id = @RZone4 AND name = N'Tuyến Ven sông Ba Son')
    INSERT INTO dbo.route (zone_id, name, description, display_order)
    VALUES (@RZone4, N'Tuyến Ven sông Ba Son', N'Dạo bộ ngắm cảnh ven sông Sài Gòn quanh khu vực Ba Son.', 1);

DECLARE @Route1 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone1 AND name = N'Tuyến Kiến trúc Trung tâm Quận 1');
DECLARE @Route2 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone2 AND name = N'Tuyến Hội quán Chợ Lớn');
DECLARE @Route4 BIGINT = (SELECT id FROM dbo.route WHERE zone_id = @RZone4 AND name = N'Tuyến Ven sông Ba Son');

-- Gán tuyến khi POI chưa thuộc tuyến nào (không ghi đè phân tuyến admin đã đặt).
UPDATE dbo.poi SET route_id = @Route1, stop_order = 1 WHERE code = 'POI_DUC_BA_01' AND route_id IS NULL;
UPDATE dbo.poi SET route_id = @Route1, stop_order = 2 WHERE code = 'POI_BUU_DIEN_01' AND route_id IS NULL;
UPDATE dbo.poi SET route_id = @Route1, stop_order = 3 WHERE code = 'POI_BEN_THANH_01' AND route_id IS NULL;
UPDATE dbo.poi SET route_id = @Route2, stop_order = 1 WHERE code = 'POI_THIEN_HAU_01' AND route_id IS NULL;
UPDATE dbo.poi SET route_id = @Route4, stop_order = 1 WHERE code = 'POI_CAU_BA_SON_01' AND route_id IS NULL;
GO


-- Quà lưu niệm gắn với 7 điểm thuyết minh (POI). Mỗi sản phẩm liên kết poi_id để hiển thị ở tab "Quà lưu niệm".
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-ma-vang-dinh-doc-lap')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-ma-vang-dinh-doc-lap', N'Tranh mạ vàng Dinh Độc Lập', 'SOUVENIR',
    N'Tranh mạ vàng ánh kim in hình Dinh Độc Lập, món quà lưu niệm trang trọng của Sài Gòn.',
    N'Lấy cảm hứng từ công trình kiến trúc lịch sử Dinh Độc Lập, bức tranh được in trên nền kim loại rồi mạ vàng tạo hiệu ứng ánh kim bền đẹp. Khung gỗ sang trọng cùng lớp mica bảo vệ giúp tác phẩm giữ nguyên độ sáng bóng theo thời gian. Đây là món quà trang trọng để tặng bạn bè quốc tế hoặc bày biện trong phòng khách, phòng làm việc.',
    180000, '/images/souvenirs/tranh-dinh-doc-lap.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'mo-hinh-dinh-doc-lap')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('mo-hinh-dinh-doc-lap', N'Mô hình Dinh Độc Lập', 'SOUVENIR',
    N'Mô hình thu nhỏ Dinh Độc Lập chế tác tỉ mỉ, thích hợp trưng bày và sưu tầm.',
    N'Mô hình tái hiện Dinh Độc Lập với các khối nhà chính và hàng cột lớn đặc trưng. Từng chi tiết mái, cửa và lan can được gia công tỉ mỉ từ chất liệu nhẹ nhưng chắc chắn. Sản phẩm phù hợp đặt trên bàn làm việc, kệ sách hoặc làm quà tặng cho người yêu kiến trúc và lịch sử.',
    220000, '/images/souvenirs/mo-hinh.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 2);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-dinh-doc-lap')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('nam-cham-dinh-doc-lap', N'Nam châm tủ lạnh Dinh Độc Lập', 'SOUVENIR',
    N'Nam châm tủ lạnh in hình Dinh Độc Lập, món quà nhỏ gọn và dễ thương.',
    N'Nam châm ép nổi hình Dinh Độc Lập với màu sắc tươi sáng, mặt sau là nam châm dính chắc trên bề mặt kim loại. Kích thước nhỏ gọn nên dễ dàng mang theo trong hành lý hoặc làm quà tặng số đông. Sản phẩm giúp lưu giữ kỷ niệm chuyến tham quan Sài Gòn một cách gọn gàng.',
    30000, '/images/souvenirs/nam-cham.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 3);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'buu-thiep-dinh-doc-lap')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('buu-thiep-dinh-doc-lap', N'Bộ bưu thiếp Dinh Độc Lập', 'SOUVENIR',
    N'Bộ bưu thiếp in các góc chụp đẹp của Dinh Độc Lập.',
    N'Bộ bưu thiếp gồm nhiều tấm in hình Dinh Độc Lập ở các góc chụp khác nhau, từ toàn cảnh mặt tiền đến những ô cửa và hàng cột đặc trưng. Giấy in dày, màu sắc sắc nét, phù hợp để viết lời chúc gửi bạn bè hoặc lưu giữ như một cuốn album nhỏ. Đây là món quà lưu niệm nhẹ nhàng mà ý nghĩa cho du khách.',
    25000, '/images/souvenirs/buu-thiep.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 4);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'ca-phe-rang-xay-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('ca-phe-rang-xay-sai-gon', N'Cà phê rang xay Sài Gòn', 'SOUVENIR',
    N'Cà phê rang xay đậm vị Sài Gòn, đóng gói làm quà tặng.',
    N'Cà phê được chọn lọc và rang mộc để giữ trọn hương thơm cùng vị đậm đà đặc trưng của người Sài Gòn. Hạt cà phê xay vừa phù hợp pha phin truyền thống lẫn pha máy. Gói cà phê kèm hộp quà trang nhã, thích hợp biếu tặng người thân và bạn bè sau chuyến đi.',
    120000, '/images/souvenirs/ca-phe-phin.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 5);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'ao-dai-cach-tan-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('ao-dai-cach-tan-sai-gon', N'Áo dài cách tân Sài Gòn', 'SOUVENIR',
    N'Áo dài cách tân nhẹ nhàng, tôn dáng và hợp nhiều dịp.',
    N'Áo dài cách tân giữ nét duyên dáng truyền thống nhưng được cắt may thoải mái, dễ mặc trong nhiều hoàn cảnh. Chất liệu mềm mại, thấm hút tốt, đường may tỉ mỉ ở cổ, tay và tà áo. Đây là lựa chọn để mặc đẹp, chụp hình hoặc làm quà may mặc mang đậm bản sắc Việt Nam.',
    420000, '/images/souvenirs/ao-dai.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DINH_DOC_LAP_01'), 1, 6);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-theu-nha-tho-duc-ba')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-theu-nha-tho-duc-ba', N'Tranh thêu tay Nhà thờ Đức Bà', 'SOUVENIR',
    N'Tranh thêu tay hình Nhà thờ Đức Bà với từng đường kim mũi chỉ tinh xảo.',
    N'Bức tranh thêu tay tái hiện Nhà thờ Đức Bà Sài Gòn với hai tháp chuông và hàng cây xanh mát. Người thợ dùng nhiều sắc chỉ để làm nổi khối kiến trúc gạch hồng đặc trưng. Khung tranh gỗ chắc chắn, phù hợp treo phòng khách hoặc làm quà tặng mang giá trị thủ công.',
    260000, '/images/souvenirs/tranh-nha-tho-duc-ba.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01'), 1, 7);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-ma-vang-nha-tho-duc-ba')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-ma-vang-nha-tho-duc-ba', N'Tranh mạ vàng Nhà thờ Đức Bà', 'SOUVENIR',
    N'Tranh mạ vàng ánh kim hình Nhà thờ Đức Bà, quà tặng trang trọng.',
    N'Hình ảnh Nhà thờ Đức Bà được in trên nền kim loại và mạ vàng tạo hiệu ứng sáng bóng sang trọng. Khung gỗ kèm lớp mica giúp bức tranh bền màu và dễ vệ sinh. Món quà lưu niệm này phù hợp cho cả trưng bày lẫn biếu tặng.',
    190000, '/images/souvenirs/tranh-nha-tho-duc-ba.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01'), 1, 8);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-nha-tho-duc-ba')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('nam-cham-nha-tho-duc-ba', N'Nam châm Nhà thờ Đức Bà', 'SOUVENIR',
    N'Nam châm tủ lạnh hình Nhà thờ Đức Bà, nhỏ gọn và dễ thương.',
    N'Nam châm ép nổi hình Nhà thờ Đức Bà với màu gạch hồng nổi bật, gắn chắc trên tủ lạnh hoặc bảng từ. Món quà nhỏ gọn, dễ mang theo và phù hợp để tặng nhiều người. Sản phẩm là cách gọn gàng để lưu giữ kỷ niệm về biểu tượng của Sài Gòn.',
    30000, '/images/souvenirs/nam-cham.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01'), 1, 9);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'buu-thiep-nha-tho-duc-ba')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('buu-thiep-nha-tho-duc-ba', N'Bưu thiếp Nhà thờ Đức Bà', 'SOUVENIR',
    N'Bưu thiếp in hình Nhà thờ Đức Bà với góc chụp đẹp.',
    N'Tấm bưu thiếp in hình Nhà thờ Đức Bà với bố cục trang nhã và màu sắc trung thực. Mặt sau có chỗ viết lời nhắn và dán tem để gửi đi. Món quà lưu niệm giản dị nhưng giàu cảm xúc cho người nhận.',
    25000, '/images/souvenirs/buu-thiep.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01'), 1, 10);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'chuoi-hat-go-my-nghe')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('chuoi-hat-go-my-nghe', N'Chuỗi hạt gỗ mỹ nghệ', 'SOUVENIR',
    N'Chuỗi hạt gỗ mỹ nghệ chạm khắc tinh tế, hợp làm quà tặng.',
    N'Chuỗi hạt được tiện và chạm khắc thủ công từ gỗ, mỗi hạt đều mịn và thơm nhẹ mùi gỗ tự nhiên. Sản phẩm mang nét mộc mạc của làng nghề truyền thống Việt Nam. Thích hợp đeo trang trí, treo xe hoặc làm quà tặng cho người lớn tuổi.',
    65000, '/images/souvenirs/chuoi-hat-go.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_DUC_BA_01'), 1, 11);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tem-suu-tam-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tem-suu-tam-sai-gon', N'Bộ tem sưu tầm Sài Gòn', 'SOUVENIR',
    N'Bộ tem in hình các danh thắng Sài Gòn dành cho người sưu tầm.',
    N'Bộ tem giới thiệu hình ảnh các công trình và danh thắng nổi tiếng của Sài Gòn như Bưu điện Trung tâm, Nhà thờ Đức Bà và Chợ Bến Thành. Tem được in màu sắc nét trên giấy tốt, giữ được độ mới theo thời gian. Đây là món quà tinh tế cho người yêu thích sưu tầm và văn hóa bưu chính.',
    50000, '/images/souvenirs/buu-thiep.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01'), 1, 12);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'buu-thiep-retro-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('buu-thiep-retro-sai-gon', N'Bưu thiếp retro Sài Gòn xưa', 'SOUVENIR',
    N'Bưu thiếp phong cách retro in hình Sài Gòn xưa.',
    N'Bộ bưu thiếp mang phong cách hoài cổ tái hiện nhịp sống Sài Gòn những thập niên trước qua gam màu ấm. Hình ảnh đường phố, xe cộ và các công trình kiến trúc cũ được in sắc nét trên giấy mờ. Món quà phù hợp cho người yêu thích nét cổ điển và ký ức về một Sài Gòn xưa.',
    30000, '/images/souvenirs/buu-thiep.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01'), 1, 13);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'moc-khoa-buu-dien')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('moc-khoa-buu-dien', N'Móc khóa Bưu điện Trung tâm', 'SOUVENIR',
    N'Móc khóa hình Bưu điện Trung tâm Sài Gòn, món quà nhỏ gọn.',
    N'Móc khóa in hình Bưu điện Trung tâm với thiết kế nhỏ gọn, gắn kèm khoen kim loại chắc chắn. Sản phẩm dễ mang theo và có thể dùng treo chìa khóa, balo hoặc làm quà tặng số đông. Một món lưu niệm dễ thương lưu giữ kỷ niệm nơi tòa nhà bưu chính cổ kính.',
    25000, '/images/souvenirs/tranh-buu-dien.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01'), 1, 14);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-ma-vang-buu-dien')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-ma-vang-buu-dien', N'Tranh mạ vàng Bưu điện Trung tâm', 'SOUVENIR',
    N'Tranh mạ vàng ánh kim hình Bưu điện Trung tâm Sài Gòn.',
    N'Hình ảnh Bưu điện Trung tâm được in trên nền kim loại rồi mạ vàng sang trọng, nổi bật đường nét kiến trúc Pháp cổ. Khung gỗ kèm lớp mica bảo vệ giúp tranh bền đẹp lâu dài. Thích hợp trưng bày ở nhà hoặc làm quà biếu trang trọng.',
    190000, '/images/souvenirs/tranh-buu-dien.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01'), 1, 15);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'ca-phe-sua-da-phin')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('ca-phe-sua-da-phin', N'Cà phê sữa đá phin quà tặng', 'SOUVENIR',
    N'Bộ cà phê sữa đá kèm phin nhôm, quà tặng đậm vị Sài Gòn.',
    N'Bộ quà gồm cà phê xay sẵn, sữa đặc và chiếc phin nhôm truyền thống để pha ly cà phê sữa đá đúng điệu. Hương vị đậm đà, thơm nồng hòa cùng vị ngọt béo của sữa tạo nên thức uống đặc trưng của người Sài Gòn. Sản phẩm đóng hộp gọn gàng, thích hợp biếu tặng người thân.',
    90000, '/images/souvenirs/ca-phe-sua-da.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BUU_DIEN_01'), 1, 16);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'lua-tam-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('lua-tam-sai-gon', N'Khăn lụa tơ tằm Sài Gòn', 'SOUVENIR',
    N'Khăn lụa tơ tằm mềm mại, óng ả, hợp làm quà tặng thanh lịch.',
    N'Khăn lụa dệt từ tơ tằm cho bề mặt mềm mịn, nhẹ và óng ánh tự nhiên. Hoa văn được in với màu sắc hài hòa, mang nét thanh lịch của người Việt. Sản phẩm phù hợp làm quà tặng hoặc phụ kiện thời trang.',
    220000, '/images/souvenirs/lua-viet-nam.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 17);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'non-la-thu-cong')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('non-la-thu-cong', N'Nón lá thủ công', 'SOUVENIR',
    N'Nón lá thủ công truyền thống, biểu tượng gần gũi của Việt Nam.',
    N'Nón lá được chuốt vành và chằm lá thủ công tỉ mỉ, tạo nên chiếc nón nhẹ, thoáng và bền. Sản phẩm vừa dùng để che nắng vừa là đạo cụ chụp hình đậm chất Việt. Một món quà lưu niệm mộc mạc mà giàu bản sắc.',
    45000, '/images/souvenirs/non-la.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 18);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'do-may-tre-dan')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('do-may-tre-dan', N'Đồ mây tre đan', 'SOUVENIR',
    N'Túi và đồ dùng mây tre đan thủ công, thân thiện với môi trường.',
    N'Đồ mây tre đan được làm thủ công từ nguyên liệu tự nhiên, đường đan đều và chắc chắn. Sản phẩm gồm túi xách, giỏ hoặc khay đựng với nét mộc mạc dễ mến. Đây là món quà vừa đẹp vừa thân thiện với môi trường.',
    90000, '/images/souvenirs/may-tre.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 19);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'gom-su-bat-trang')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('gom-su-bat-trang', N'Bộ ấm tách gốm Bát Tràng', 'SOUVENIR',
    N'Bộ ấm tách gốm Bát Tràng men trắng, nét thanh nhã truyền thống.',
    N'Bộ ấm tách được nung ở làng gốm Bát Tràng với lớp men trắng bóng và họa tiết vẽ tay nhẹ nhàng. Chất liệu gốm dày dặn giữ nhiệt tốt và an toàn khi sử dụng. Sản phẩm phù hợp dùng pha trà hoặc làm quà tặng trang nhã.',
    170000, '/images/souvenirs/gom-bat-trang.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 20);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'quat-giay-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('quat-giay-sai-gon', N'Quạt giấy Sài Gòn', 'SOUVENIR',
    N'Quạt giấy in họa tiết Việt Nam, vừa dùng vừa chụp hình đẹp.',
    N'Quạt giấy được làm thủ công với nan tre và mặt giấy in họa tiết hoa lá, danh thắng Việt Nam. Sản phẩm gấp gọn tiện mang theo và tạo điểm nhấn đẹp trong ảnh. Món quà lưu niệm nhẹ nhàng, dễ thương và hợp túi tiền.',
    35000, '/images/souvenirs/quat-giay.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 21);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'banh-pia-tan-huong')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('banh-pia-tan-huong', N'Bánh pía Tân Hương', 'SOUVENIR',
    N'Bánh pía vỏ mềm nhân đậu xanh trứng muối, đặc sản miền Tây.',
    N'Bánh pía là loại bánh nướng nổi tiếng với lớp vỏ mềm mỏng bọc nhân đậu xanh, sầu riêng và trứng muối béo bùi. Vị ngọt dịu hòa quyện cùng hương sầu riêng đặc trưng tạo nên món quà khó quên. Bánh được đóng hộp kín, thuận tiện mang về làm quà.',
    75000, '/images/souvenirs/banh-pia.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 22);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'keo-dua-ben-tre')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('keo-dua-ben-tre', N'Kẹo dừa Bến Tre', 'SOUVENIR',
    N'Kẹo dừa Bến Tre dẻo thơm, vị ngọt thanh từ dừa tươi.',
    N'Kẹo dừa được nấu từ nước cốt dừa tươi và đường, dẻo mềm và thơm lừng mùi dừa. Xứ dừa Bến Tre lâu đời nổi tiếng với loại kẹo dân dã này. Sản phẩm đóng gói tiện lợi, thích hợp làm quà cho cả gia đình.',
    45000, '/images/souvenirs/keo-dua.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 23);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'hat-dieu-rang-muoi')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('hat-dieu-rang-muoi', N'Hạt điều rang muối', 'SOUVENIR',
    N'Hạt điều rang muối giòn bùi, món quà đặc sản được ưa chuộng.',
    N'Hạt điều được tuyển chọn hạt to đều, rang muối vừa tới để giữ độ giòn và vị béo tự nhiên. Sản phẩm thơm bùi, dùng ăn vặt hoặc đãi khách đều hợp. Hộp hạt điều đóng kín, phù hợp làm quà biếu lịch sự.',
    130000, '/images/souvenirs/hat-dieu.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 24);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'kho-bo-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('kho-bo-sai-gon', N'Khô bò Sài Gòn', 'SOUVENIR',
    N'Khô bò dai ngọt đậm vị, món nhắm và quà vặt quen thuộc.',
    N'Khô bò được ướp gia vị rồi sấy khô để thịt dai ngọt, thơm mùi sả và tiêu. Sợi khô bò đều, màu nâu đỏ hấp dẫn, dùng làm món nhắm hoặc ăn vặt đều ngon. Sản phẩm đóng gói kín, tiện mang theo làm quà.',
    150000, '/images/souvenirs/kho-bo.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 25);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'mut-trai-cay-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('mut-trai-cay-sai-gon', N'Mứt trái cây Sài Gòn', 'SOUVENIR',
    N'Mứt trái cây ngọt dịu làm từ các loại trái chín tự nhiên.',
    N'Mứt được làm từ các loại trái cây chín như dừa, gừng, hạt sen và trái cây theo mùa. Miếng mứt dẻo, giữ vị ngọt tự nhiên và màu sắc bắt mắt. Sản phẩm đóng hộp trang nhã, thường dùng trong dịp lễ Tết hoặc làm quà tặng.',
    95000, '/images/souvenirs/mut-trai-cay.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 26);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tra-sen-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tra-sen-sai-gon', N'Trà sen Sài Gòn', 'SOUVENIR',
    N'Trà sen ướp hương hoa sen thanh tao, hậu vị ngọt dịu.',
    N'Trà sen được ướp cùng hương hoa sen tươi để tạo nên mùi thơm thanh tao và vị chát dịu đặc trưng. Sản phẩm phù hợp pha ấm trà chiêu đãi khách hoặc thư giãn tại nhà. Hộp trà được thiết kế trang nhã, thích hợp làm quà biếu.',
    110000, '/images/souvenirs/tra-sen.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 27);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-ma-vang-cho-ben-thanh')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-ma-vang-cho-ben-thanh', N'Tranh mạ vàng Chợ Bến Thành', 'SOUVENIR',
    N'Tranh mạ vàng ánh kim hình Chợ Bến Thành, quà tặng sang trọng.',
    N'Hình ảnh Chợ Bến Thành cùng bốn cửa và tháp đồng hồ được in trên nền kim loại mạ vàng ánh kim. Khung gỗ và lớp mica giúp bức tranh bền màu và dễ bảo quản. Món quà trang trọng lưu giữ hình ảnh ngôi chợ biểu tượng của Sài Gòn.',
    180000, '/images/souvenirs/tranh-cho-ben-thanh.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BEN_THANH_01'), 1, 28);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-co-dong-viet-nam')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-co-dong-viet-nam', N'Tranh cổ động Việt Nam', 'SOUVENIR',
    N'Tranh cổ động phong cách cũ, món lưu niệm đậm dấu ấn lịch sử.',
    N'Tranh cổ động mang phong cách đồ họa một thời với gam màu mạnh và thông điệp ngắn gọn. Sản phẩm được in lại trên giấy tốt, phù hợp treo trang trí theo phong cách hoài cổ. Đây là món lưu niệm gợi nhắc một giai đoạn lịch sử đặc biệt.',
    120000, '/images/souvenirs/tranh-co-dong.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BAO_TANG_CHUNG_TICH_01'), 1, 29);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sach-lich-su-sai-gon')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('sach-lich-su-sai-gon', N'Sách lịch sử Sài Gòn', 'SOUVENIR',
    N'Sách ảnh về lịch sử và con người Sài Gòn, quà tặng cho người ham đọc.',
    N'Cuốn sách tập hợp tư liệu và hình ảnh về lịch sử hình thành, phát triển của Sài Gòn qua nhiều giai đoạn. Nội dung trình bày dễ đọc, kèm nhiều hình ảnh minh họa sinh động. Món quà thích hợp cho người muốn tìm hiểu sâu hơn về thành phố.',
    95000, '/images/souvenirs/sach-lich-su.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BAO_TANG_CHUNG_TICH_01'), 1, 30);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'huy-hieu-luu-niem')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('huy-hieu-luu-niem', N'Huy hiệu lưu niệm', 'SOUVENIR',
    N'Huy hiệu ghim lưu niệm với thiết kế biểu tượng Sài Gòn.',
    N'Huy hiệu nhỏ gọn in họa tiết biểu tượng của thành phố và các điểm tham quan nổi tiếng. Mặt sau có kim ghim chắc chắn để cài lên áo, balo hoặc mũ. Món quà lưu niệm tiết kiệm, dễ sưu tầm và phù hợp tặng nhóm đông.',
    20000, '/images/souvenirs/huy-hieu.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BAO_TANG_CHUNG_TICH_01'), 1, 31);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-bao-tang')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('nam-cham-bao-tang', N'Nam châm Bảo tàng Chứng tích Chiến tranh', 'SOUVENIR',
    N'Nam châm tủ lạnh in hình Bảo tàng Chứng tích Chiến tranh.',
    N'Nam châm ép nổi tái hiện mặt tiền Bảo tàng Chứng tích Chiến tranh với màu sắc trang nghiêm. Sản phẩm gắn chắc trên bề mặt kim loại và dễ mang theo. Món lưu niệm nhỏ nhắc nhớ một địa chỉ mang nhiều giá trị lịch sử và hòa bình.',
    30000, '/images/souvenirs/nam-cham.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_BAO_TANG_CHUNG_TICH_01'), 1, 32);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nhang-thom-chua-ba')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('nhang-thom-chua-ba', N'Nhang thơm Chùa Bà Thiên Hậu', 'SOUVENIR',
    N'Nhang thơm dịu, dùng dâng hương hoặc tạo không gian ấm cúng.',
    N'Nhang được làm từ bột trầm và thảo mộc tự nhiên, khi cháy tỏa mùi thơm dịu nhẹ dễ chịu. Sản phẩm thường được dùng dâng hương nơi cửa Phật hoặc thư giãn trong nhà. Hộp nhang đóng kín giúp giữ hương thơm lâu dài.',
    40000, '/images/souvenirs/huong.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01'), 1, 33);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'bao-li-xi-do')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('bao-li-xi-do', N'Bao lì xì đỏ may mắn', 'SOUVENIR',
    N'Bao lì xì đỏ in họa tiết may mắn, món quà nhỏ mang lời chúc tốt lành.',
    N'Bao lì xì màu đỏ tươi in họa tiết hoa văn và chữ chúc may mắn theo phong cách truyền thống. Sản phẩm dùng để đựng tiền mừng trong dịp Tết hoặc lễ cưới, sinh nhật. Món quà nhỏ gọn, nhiều ý nghĩa và dễ dàng mang theo.',
    20000, '/images/souvenirs/bao-li-xi.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01'), 1, 34);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'vong-tay-da-may-man')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('vong-tay-da-may-man', N'Vòng tay đá may mắn', 'SOUVENIR',
    N'Vòng tay đá tự nhiên mài bóng, tượng trưng cho bình an may mắn.',
    N'Vòng tay được mài và xâu từ những viên đá tự nhiên với màu sắc hài hòa. Sản phẩm đeo vừa tay, mang ý nghĩa cầu bình an và tài lộc theo quan niệm dân gian. Một món quà nhỏ được nhiều du khách lựa chọn khi ghé thăm Chợ Lớn.',
    80000, '/images/souvenirs/vong-tay-da.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01'), 1, 35);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'den-long-hoi-quan')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('den-long-hoi-quan', N'Đèn lồng Hội quán', 'SOUVENIR',
    N'Đèn lồng đỏ trang trí mang nét văn hóa của người Hoa.',
    N'Đèn lồng được làm từ vải và khung tre với màu đỏ nổi bật, gấp gọn khi cần cất giữ. Sản phẩm gợi nhớ không gian rực rỡ của các hội quán người Hoa ở Chợ Lớn. Đèn dùng để trang trí nhà cửa, quán cà phê hoặc làm điểm nhấn chụp hình.',
    95000, '/images/souvenirs/den-long.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_THIEN_HAU_01'), 1, 36);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-cau-ba-son')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('tranh-cau-ba-son', N'Tranh Cầu Ba Son', 'SOUVENIR',
    N'Tranh in hình Cầu Ba Son, biểu tượng mới bên bờ sông Sài Gòn.',
    N'Bức tranh tái hiện Cầu Ba Son với nhịp cầu vắt qua dòng sông Sài Gòn và khung cảnh ven bờ. Màu sắc hài hòa, in trên chất liệu bền đẹp, phù hợp treo trang trí. Món quà lưu niệm ghi dấu một điểm đến mới của thành phố.',
    170000, '/images/souvenirs/tranh-cau-ba-son.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01'), 1, 37);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'mat-ong-rung-ngap-man')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('mat-ong-rung-ngap-man', N'Mật ong rừng ngập mặn Cần Giờ', 'SOUVENIR',
    N'Mật ong rừng ngập mặn Cần Giờ thơm ngon, giàu dưỡng chất.',
    N'Mật ong được khai thác từ các vùng rừng ngập mặn Cần Giờ, có màu vàng sẫm và hương thơm đặc trưng. Sản phẩm dùng pha nước uống, chế biến món ăn hoặc chăm sóc sức khỏe. Chai mật ong được đóng kín, thuận tiện mang về làm quà.',
    150000, '/images/souvenirs/mat-ong.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01'), 1, 38);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'dau-dua-nguyen-chat')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('dau-dua-nguyen-chat', N'Dầu dừa nguyên chất', 'SOUVENIR',
    N'Dầu dừa nguyên chất ép lạnh, dùng nấu ăn và chăm sóc da, tóc.',
    N'Dầu dừa được ép lạnh từ cơm dừa già để giữ trọn mùi thơm và dưỡng chất tự nhiên. Sản phẩm dùng để nấu ăn, dưỡng da, dưỡng tóc hoặc tẩy trang đều được. Chai dầu đóng kín, tiện lợi và phù hợp làm quà cho gia đình.',
    85000, '/images/souvenirs/dau-dua.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01'), 1, 39);

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'duong-thot-not-an-giang')
    INSERT INTO dbo.products (slug, name, category, short_description, description, price, image_path, poi_id, is_active, sort_order)
    VALUES ('duong-thot-not-an-giang', N'Đường thốt nốt An Giang', 'SOUVENIR',
    N'Đường thốt nốt An Giang ngọt thanh, dùng nấu ăn và pha chế.',
    N'Đường thốt nốt được nấu từ mật hoa thốt nốt, có vị ngọt thanh và mùi thơm dịu tự nhiên. Sản phẩm thường dùng nấu chè, pha nước hoặc chế biến món ăn miền Tây. Đường được đóng gói tiện lợi, thích hợp làm quà đặc sản.',
    55000, '/images/souvenirs/duong-thot-not.jpg', (SELECT id FROM dbo.poi WHERE code = 'POI_CAU_BA_SON_01'), 1, 40);

-- Trang "Ẩm thực" đã đổi thành quà lưu niệm: ẩn các món ăn/đồ uống cũ (giữ nguyên dữ liệu, không xóa).
UPDATE dbo.products SET is_active = 0 WHERE category IN ('FOOD', 'DRINK');

GO
