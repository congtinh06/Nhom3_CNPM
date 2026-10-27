-- ==============================================================================
-- Echora — Flyway V16 Migration: Seed phân đoạn (chap) bài thuyết minh cho 7 POI.
-- Nội dung tách từ narration tiếng Việt + tiếng Anh đã có sẵn trong seed/V11,
-- mỗi chap giữ nguyên văn một nhóm đoạn văn để không mất mát nội dung.
-- Chap mới đều ở trạng thái audio PENDING (pipeline TTS sẽاة xử lý sau).
-- Idempotent: chỉ chèn chap khi (poi, chapter_order) chưa tồn tại.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE #ChapterSeed (
    poi_code NVARCHAR(50) COLLATE DATABASE_DEFAULT NOT NULL,
    chapter_order INT NOT NULL,
    language_code NVARCHAR(10) COLLATE DATABASE_DEFAULT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    narration_text NVARCHAR(MAX) NOT NULL
);

INSERT INTO #ChapterSeed (poi_code, chapter_order, language_code, title, narration_text)
VALUES
-- ============== Dinh Độc Lập (4 chap) ==============
(N'POI_DINH_DOC_LAP_01', 1, 'vi', N'Khởi nguồn dinh Norodom',
 N'Dinh Độc Lập nằm giữa một khu vườn rộng ở trung tâm thành phố. Câu chuyện của nơi này bắt đầu từ thế kỷ mười chín, khi người Pháp xây dinh Norodom làm nơi ở và làm việc của người đứng đầu chính quyền thuộc địa. Sau năm một nghìn chín trăm năm mươi tư, dinh trở thành nơi làm việc của chính quyền miền Nam. Năm một nghìn chín trăm sáu mươi hai, hai phi công đã ném bom vào dinh, và tòa nhà cũ bị hư hại nặng. Chính quyền khi đó quyết định phá bỏ để xây một công trình mới.'),
(N'POI_DINH_DOC_LAP_01', 1, 'en', N'The Norodom Palace origins',
 N'Independence Palace sits in a wide garden in the heart of the city. Its story begins in the nineteenth century, when the French built Norodom Palace as the home and office of the colonial governor. After nineteen fifty-four, it became the seat of the government of South Vietnam. In nineteen sixty-two, two pilots bombed the palace, and the old building was badly damaged. The government decided to tear it down and build a new one.'),
(N'POI_DINH_DOC_LAP_01', 2, 'vi', N'Tòa dinh mới của kiến trúc sư Ngô Viết Thụ',
 N'Kiến trúc sư Ngô Viết Thụ thiết kế tòa nhà mà ngày nay bạn nhìn thấy. Công trình hoàn thành năm một nghìn chín trăm sáu mươi sáu, kết hợp phong cách hiện đại với những yếu tố phương Đông, có nhiều khoảng thoáng và sảnh cao rộng. Bên trong là phòng khánh tiết, phòng họp nội các, phòng làm việc của tổng thống, và một hệ thống hầm chỉ huy nằm bên dưới.'),
(N'POI_DINH_DOC_LAP_01', 2, 'en', N'The new palace designed by Ngô Viết Thụ',
 N'Architect Ngô Viết Thụ designed the building you see today. It was completed in nineteen sixty-six, blending a modern style with Eastern elements, with open spaces and tall, airy halls. Inside are reception rooms, a cabinet meeting room, the president''s office, and a command bunker underground.'),
(N'POI_DINH_DOC_LAP_01', 3, 'vi', N'Sự kiện 30-4-1975',
 N'Ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm, xe tăng của quân giải phóng tiến vào khuôn viên và húc đổ cổng dinh. Tổng thống Dương Văn Minh tuyên bố đầu hàng, và lá cờ được kéo lên trên nóc dinh. Ngày đó được nhớ đến như ngày thống nhất đất nước.'),
(N'POI_DINH_DOC_LAP_01', 3, 'en', N'30 April 1975',
 N'On the thirtieth of April, nineteen seventy-five, tanks of the liberation forces entered the grounds and broke through the gate. President Dương Văn Minh announced the surrender, and a flag was raised over the palace. That day is remembered as the reunification of the country.'),
(N'POI_DINH_DOC_LAP_01', 4, 'vi', N'Hội trường Thống Nhất hôm nay',
 N'Sau đó, nơi này được gọi là Hội trường Thống Nhất, rồi trở thành một di tích. Năm hai nghìn không trăm lẻ chín, dinh được xếp hạng di tích quốc gia đặc biệt. Khi đi dạo trong khuôn viên, bạn hãy để ý hai chiếc xe tăng ở sân trước, và nếu có thời gian, hãy xuống tham quan khu hầm chỉ huy.'),
(N'POI_DINH_DOC_LAP_01', 4, 'en', N'Reunification Hall today',
 N'Afterwards the building was called Reunification Hall, and later became a historic site. In two thousand nine, it was recognized as a special national monument. As you walk the grounds, look for the two tanks in the front yard, and if you have time, visit the command bunker.'),

-- ============== Nhà thờ Đức Bà (4 chap) ==============
(N'POI_DUC_BA_01', 1, 'vi', N'Lịch sử xây dựng nhà thờ',
 N'Nhà thờ Đức Bà có tên chính thức là Vương cung thánh đường Chính tòa Đức Mẹ Vô Nhiễm Nguyên Tội. Công trình được xây dựng trong thời Pháp thuộc, khởi công năm một nghìn tám trăm sáu mươi ba và hoàn thành năm một nghìn tám trăm tám mươi. Kiến trúc sư Jules Bourard thiết kế theo phong cách Roman và Gothic của châu Âu.'),
(N'POI_DUC_BA_01', 1, 'en', N'Building the cathedral',
 N'Its official name is the Cathedral Basilica of Our Lady of the Immaculate Conception. It was built during the French colonial period, started in eighteen sixty-three and finished in eighteen eighty. Architect Jules Bourard drew on European Romanesque and Gothic styles.'),
(N'POI_DUC_BA_01', 2, 'vi', N'Viên gạch đỏ nổi tiếng',
 N'Điểm dễ nhận ra nhất là lớp gạch đỏ ở mặt ngoài. Theo nhiều tài liệu, gạch được đưa từ Marseille, nước Pháp, sang, và đến nay vẫn giữ được màu sắc đặc trưng mà không cần sơn phủ. Hai tháp chuông được bổ sung vào năm một nghìn tám trăm chín mươi lăm, cao khoảng sáu mươi mét tính cả cây thánh giá trên đỉnh.'),
(N'POI_DUC_BA_01', 2, 'en', N'The famous red bricks',
 N'What you notice first is the red brick on the outside. Many sources say the bricks were brought from Marseille, in France, and they still keep their color today without any paint. Two bell towers were added in eighteen ninety-five, rising about sixty meters including the cross on top.'),
(N'POI_DUC_BA_01', 3, 'vi', N'Tượng Đức Mẹ Hòa Bình',
 N'Trước nhà thờ là tượng Đức Mẹ Hòa Bình, được đặt năm một nghìn chín trăm năm mươi chín. Năm một nghìn chín trăm sáu mươi hai, nhà thờ được phong hàng vương cung thánh đường.'),
(N'POI_DUC_BA_01', 3, 'en', N'Our Lady of Peace',
 N'In front stands the statue of Our Lady of Peace, placed in nineteen fifty-nine. In nineteen sixty-two, the church was raised to the rank of basilica.'),
(N'POI_DUC_BA_01', 4, 'vi', N'Thăm nhà thờ',
 N'Hãy đi chậm quanh nhà thờ, ngắm mặt tiền gạch đỏ và những ô cửa kính màu. Nếu muốn vào bên trong, bạn nên kiểm tra giờ mở cửa trước, vì nhà thờ có giờ lễ và giờ đón khách riêng, và một số khu vực có thể đang được trùng tu. Chỉ vài bước chân nữa là tới Bưu điện Trung tâm, điểm dừng tiếp theo của bạn.'),
(N'POI_DUC_BA_01', 4, 'en', N'Visiting the cathedral',
 N'Walk slowly around the cathedral and look at the brick façade and the stained glass. If you plan to go inside, check the opening hours first, because there are times for services and times for visitors, and some areas may be closed for restoration. Just a few steps away stands the Central Post Office, your next stop.'),

-- ============== Bưu điện Trung tâm (3 chap) ==============
(N'POI_BUU_DIEN_01', 1, 'vi', N'Lịch sử và giai thoại Eiffel',
 N'Bưu điện Trung tâm được xây dựng từ năm một nghìn tám trăm tám mươi sáu đến năm một nghìn tám trăm chín mươi mốt, trong thời kỳ Pháp thuộc. Người ta thường kể rằng công trình do Gustave Eiffel thiết kế, nhưng nhiều nguồn cho biết kiến trúc sư thực sự là Alfred Foulhoux. Câu chuyện về Eiffel nhiều khả năng chỉ là giai thoại.'),
(N'POI_BUU_DIEN_01', 1, 'en', N'History and the Eiffel legend',
 N'The Central Post Office was built between eighteen eighty-six and eighteen ninety-one, during the French colonial period. People often say it was designed by Gustave Eiffel, but many sources credit an architect named Alfred Foulhoux. The Eiffel story is most likely just a legend.'),
(N'POI_BUU_DIEN_01', 2, 'vi', N'Sảnh vòm và bản đồ vẽ tay',
 N'Hãy bước vào bên trong. Bạn sẽ thấy một sảnh dài với mái vòm cong, khung sắt nhẹ và những ô cửa vòm cao. Sàn nhà lát gạch hoa nhiều họa tiết, các dãy quầy gỗ và buồng điện thoại cổ vẫn còn đó. Trên tường là hai tấm bản đồ lớn vẽ tay. Một tấm vẽ Sài Gòn và vùng phụ cận vào năm một nghìn tám trăm chín mươi hai, tấm còn lại là bản đồ các tuyến điện báo ở miền Nam Việt Nam và Campuchia. Ở cuối sảnh là chân dung Chủ tịch Hồ Chí Minh.'),
(N'POI_BUU_DIEN_01', 2, 'en', N'The vaulted hall and the maps',
 N'Step inside. You will find a long hall with a curved roof, a light iron frame, and tall arched windows. The floor is covered in patterned tiles, and rows of wooden counters and old telephone booths are still in place. On the walls hang two large hand-painted maps. One shows Saigon and its surroundings in eighteen ninety-two. The other shows the telegraph lines of southern Vietnam and Cambodia. At the far end you will see a portrait of President Hồ Chí Minh.'),
(N'POI_BUU_DIEN_01', 3, 'vi', N'Bưu điện hôm nay',
 N'Bưu điện không chỉ để ngắm. Đây vẫn là nơi người dân gửi thư, mua tem và viết bưu thiếp. Nếu bạn có chút thời gian, hãy mua một tấm bưu thiếp, viết vài dòng và gửi đi. Đó là một cách thú vị để mang một phần Sài Gòn về với người thân.'),
(N'POI_BUU_DIEN_01', 3, 'en', N'The post office today',
 N'The post office is not only for sightseeing. People still come here to send letters, buy stamps, and write postcards. If you have a few minutes, buy a postcard, write a few lines, and send it off. It is a charming way to send a piece of Saigon home.'),

-- ============== Chợ Bến Thành (3 chap) ==============
(N'POI_BEN_THANH_01', 1, 'vi', N'Từ chợ ven sông đến biểu tượng',
 N'Chợ Bến Thành nằm ở trung tâm Quận Một, và là một trong những biểu tượng quen thuộc nhất của thành phố. Khu chợ có nguồn gốc từ đầu thế kỷ mười chín, khi người dân buôn bán ven sông. Tòa nhà hiện nay được xây dựng từ năm một nghìn chín trăm mười hai và khánh thành năm một nghìn chín trăm mười bốn, theo thiết kế của các kiến trúc sư người Pháp.'),
(N'POI_BEN_THANH_01', 1, 'en', N'From riverside market to icon',
 N'Ben Thanh Market stands in the center of District One, and is one of the most familiar symbols of the city. The market grew out of riverside trading in the early nineteenth century. The present building went up in nineteen twelve and opened in nineteen fourteen, designed by French architects.'),
(N'POI_BEN_THANH_01', 2, 'vi', N'Bốn cửa chợ và các dãy hàng',
 N'Chợ có bốn cửa chính, hướng Đông, Tây, Nam và Bắc. Nổi bật nhất là cửa Nam, với tháp đồng hồ cao, hình ảnh quen thuộc trên rất nhiều tấm bưu thiếp. Bên trong, các dãy hàng chia theo nhóm: vải vóc và quần áo, đồ thủ công và quà lưu niệm, cà phê, trà, đồ khô, trái cây, và khu ẩm thực phục vụ các món Việt quen thuộc.'),
(N'POI_BEN_THANH_01', 2, 'en', N'Four gates and the aisles',
 N'The market has four main gates, facing east, west, south, and north. The most famous is the south gate, with its tall clock tower, a sight seen on countless postcards. Inside, the aisles are grouped by goods: fabric and clothing, handicrafts and souvenirs, coffee, tea, dried goods, fruit, and a food area serving familiar Vietnamese dishes.'),
(N'POI_BEN_THANH_01', 3, 'vi', N'Nhịp sống chợ',
 N'Chợ đông nhất vào ban ngày, và buổi tối khu vực quanh chợ có thêm chợ đêm. Khi mua hàng, bạn nên hỏi giá và trả giá nhẹ nhàng, đó là nét văn hóa buôn bán thân thiện ở đây. Hãy dành chút thời gian thử một món ăn nhẹ ngay tại chợ, như chè hay bánh, để cảm nhận nhịp sống của người Sài Gòn.'),
(N'POI_BEN_THANH_01', 3, 'en', N'The rhythm of the market',
 N'The market is busiest in the daytime, and in the evening the streets around it also hold a night market. When you shop, ask for the price and bargain gently, which is a friendly part of local trading culture. Take a little time to eat a light snack right here, such as a sweet dessert soup or a small cake, to feel the rhythm of daily life in Saigon.'),

-- ============== Bảo tàng Chứng tích Chiến tranh (3 chap) ==============
(N'POI_BAO_TANG_CHUNG_TICH_01', 1, 'vi', N'Lịch sử bảo tàng',
 N'Bảo tàng Chứng tích Chiến tranh nằm trên đường Võ Văn Tần. Bảo tàng được thành lập vào tháng chín năm một nghìn chín trăm bảy mươi lăm, ban đầu với một tên gọi khác, và đã nhiều lần đổi tên trước khi mang tên như hiện nay vào năm một nghìn chín trăm chín mươi lăm. Mục đích của bảo tàng là lưu giữ hình ảnh, tư liệu và hiện vật về chiến tranh Việt Nam, để người xem hiểu rõ hơn về những mất mát mà chiến tranh gây ra.'),
(N'POI_BAO_TANG_CHUNG_TICH_01', 1, 'en', N'History of the museum',
 N'The War Remnants Museum is on Võ Văn Tần Street. It was founded in September nineteen seventy-five under a different name, and changed names several times before taking its present name in nineteen ninety-five. Its purpose is to keep photographs, documents, and objects from the Vietnam War, so that visitors can better understand the losses that war causes.'),
(N'POI_BAO_TANG_CHUNG_TICH_01', 2, 'vi', N'Đồ trưng bày trong sân và các chuyên đề',
 N'Ở sân trước, bạn sẽ thấy máy bay, xe tăng, pháo và nhiều loại bom đạn được trưng bày ngoài trời. Bên trong, các tầng trưng bày ảnh và hiện vật theo từng chủ đề, trong đó có phần nói về hậu quả của chất độc da cam đối với nhiều thế hệ, và một triển lãm ảnh dành cho các phóng viên đã hy sinh trong các cuộc chiến tranh ở Đông Dương.'),
(N'POI_BAO_TANG_CHUNG_TICH_01', 2, 'en', N'The yard and the exhibitions',
 N'In the front yard you will see aircraft, tanks, artillery, and many kinds of bombs displayed in the open. Inside, the floors present photographs and objects by theme, including a section on the effects of Agent Orange across generations, and a photo exhibition honoring journalists who died in the wars of Indochina.'),
(N'POI_BAO_TANG_CHUNG_TICH_01', 3, 'vi', N'Thăm bảo tàng với tâm thế trầm lắng',
 N'Đây là nơi nên đến với tâm thế trầm lắng. Một số hình ảnh rất nặng nề, nên bạn hãy cân nhắc nếu đi cùng trẻ nhỏ, và có thể dừng lại nghỉ bất cứ lúc nào. Đây không chỉ là nơi nhìn lại quá khứ, mà còn là nơi nhắc chúng ta trân trọng hòa bình.'),
(N'POI_BAO_TANG_CHUNG_TICH_01', 3, 'en', N'A thoughtful visit',
 N'This is a place to visit in a quiet frame of mind. Some images are very heavy, so think carefully before bringing young children, and feel free to stop and rest whenever you need. It is not only a place to look back at the past, but also a place that reminds us to value peace.'),

-- ============== Chùa Bà Thiên Hậu (4 chap) ==============
(N'POI_THIEN_HAU_01', 1, 'vi', N'Hội quán Tuệ Thành và bà Thiên Hậu',
 N'Hội quán Tuệ Thành, thường được gọi là Chùa Bà Thiên Hậu, nằm ở số 710 đường Nguyễn Trãi, Quận 5. Công trình do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 để thờ Bà Thiên Hậu, vị thần bảo hộ người đi biển và người buôn bán. Trải qua hơn hai thế kỷ, chùa vẫn là nơi sinh hoạt tín ngưỡng quen thuộc của người dân Chợ Lớn.'),
(N'POI_THIEN_HAU_01', 1, 'en', N'Tue Thanh Assembly Hall and Thien Hau',
 N'Tue Thanh Assembly Hall, commonly called Ba Thien Hau Pagoda, stands at 710 Nguyen Trai Street in District 5. It was built around 1760 by the Cantonese Chinese community to honor Thien Hau, the goddess believed to protect seafarers and traders. After more than two centuries, the temple remains a living place of worship for the Cho Lon community.'),
(N'POI_THIEN_HAU_01', 2, 'vi', N'Kiến trúc tiền điện - trung điện - hậu điện',
 N'Ngôi chùa được tổ chức theo kiểu hội quán với nhiều lớp không gian nối tiếp nhau, gồm tiền điện, trung điện và hậu điện. Điểm nổi bật là bộ khung gỗ chạm trổ, các hoành phi, câu đối và những phù điêu gốm nung nhiều màu trên mái. Các hình tượng nhân vật, rồng, chim và hoa lá được đắp nổi tỉ mỉ, tạo nên vẻ rực rỡ đặc trưng của kiến trúc người Hoa.'),
(N'POI_THIEN_HAU_01', 2, 'en', N'The halls and ceramic reliefs',
 N'The temple follows the layout of a Chinese assembly hall, with a series of connected spaces leading from the front hall through the middle hall to the rear hall. Its wooden frames, horizontal boards, couplets and roof are richly decorated. The roof is especially notable for its glazed ceramic reliefs, where figures, dragons, birds and flowers are built up in fine detail.'),
(N'POI_THIEN_HAU_01', 3, 'vi', N'Không gian thờ tự',
 N'Trong chùa có không gian thờ tự trang nghiêm, hương khói quanh năm và những dấu tích cho thấy sự gắn bó lâu đời của cộng đồng người Hoa với vùng đất Sài Gòn - Chợ Lớn. Khi tham quan, bạn nên đi nhẹ, nói khẽ, giữ trang phục lịch sự và hỏi trước nếu muốn chụp ảnh trong khu vực thờ tự.'),
(N'POI_THIEN_HAU_01', 3, 'en', N'The worship space',
 N'Inside, the atmosphere is quiet and incense-filled, with altars and ornaments that reflect the long presence of the Cantonese community in Saigon and Cho Lon. Visitors should dress respectfully, keep their voices low and ask before taking photographs in the worship areas.'),
(N'POI_THIEN_HAU_01', 4, 'vi', N'Di tích quốc gia và gợi ý tham quan',
 N'Công trình được công nhận là di tích kiến trúc nghệ thuật cấp quốc gia vào ngày 7 tháng 1 năm 1993. Chùa nằm gần nhiều điểm tham quan khác của Chợ Lớn, nên bạn có thể kết hợp ghé thăm trong cùng một buổi dạo quanh khu vực.'),
(N'POI_THIEN_HAU_01', 4, 'en', N'A national relic and visiting tips',
 N'The temple was recognized as a national architectural and artistic relic on 7 January 1993. It sits close to several other attractions in Cho Lon, so it can easily be combined with a walk through the neighborhood.'),

-- ============== Cầu Ba Son (4 chap) ==============
(N'POI_CAU_BA_SON_01', 1, 'vi', N'Chung chân dự án',
 N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, nối khu vực đường Tôn Đức Thắng ở trung tâm thành phố với Khu đô thị mới Thủ Thiêm. Cầu thông xe ngày 28 tháng 4 năm 2022, góp phần rút ngắn hành trình giữa hai bờ và mở rộng kết nối giao thông của thành phố.'),
(N'POI_CAU_BA_SON_01', 1, 'en', N'About the project',
 N'Ba Son Bridge is an asymmetric cable-stayed bridge over the Saigon River, connecting Ton Duc Thang Street in the city center with the Thu Thiem New Urban Area. It opened to traffic on 28 April 2022, shortening the journey between the two banks and strengthening the city''s transport links.'),
(N'POI_CAU_BA_SON_01', 2, 'vi', N'Kiến trúc dây văng và tháp nghiêng',
 N'Điểm dễ nhận ra nhất của cầu là trụ tháp hình vòm cao khoảng 113 mét, nghiêng về phía Thủ Thiêm. Hệ dây văng kéo các nhịp cầu tạo nên dáng vẻ thanh thoát, đồng thời mở ra góc nhìn rộng về sông Sài Gòn, bờ Thủ Thiêm và khu trung tâm.'),
(N'POI_CAU_BA_SON_01', 2, 'en', N'Cable-stayed design and leaning tower',
 N'Its most recognizable feature is the 113-meter arched tower, which leans toward Thu Thiem. The cables fan out to support the bridge deck, giving the structure a light appearance and opening wide views of the Saigon River, the Thu Thiem bank and the city center.'),
(N'POI_CAU_BA_SON_01', 3, 'vi', N'Từ tên Thủ Thiêm 2 đến tên Ba Son',
 N'Cầu từng được gọi là Thủ Thiêm 2. Ngày 9 tháng 12 năm 2022, Hội đồng Nhân dân Thành phố Hồ Chí Minh thông qua việc đặt tên Ba Son, nhằm gắn cây cầu với tên gọi của xưởng đóng tàu Ba Son, một địa danh lịch sử bên bờ sông.'),
(N'POI_CAU_BA_SON_01', 3, 'en', N'From Thu Thiem 2 to Ba Son',
 N'The bridge was once known as Thu Thiem 2. On 9 December 2022, the Ho Chi Minh City People''s Council approved the name Ba Son, linking the bridge to the historic Ba Son Shipyard on the riverbank.'),
(N'POI_CAU_BA_SON_01', 4, 'vi', N'Trang cảnh ven sông',
 N'Khi dạo bộ ven sông hoặc đi qua cầu, bạn có thể ngắm toàn cảnh khu vực, đặc biệt là vào buổi chiều khi ánh nắng phản chiếu trên mặt nước. Đây cũng là điểm kết nối thuận tiện để tiếp tục hành trình đến các khu vực ven sông của thành phố.'),
(N'POI_CAU_BA_SON_01', 4, 'en', N'Views along the river',
 N'When walking along the riverside or crossing the bridge, you can take in the panorama of the area, especially in the late afternoon when sunlight reflects off the water. The bridge is also a convenient connection for continuing your journey to other riverside districts.');
GO

-- Chèn chap + bản dịch cho mỗi dòng seed còn thiếu (idempotent).
CREATE TABLE #MissingChapter (
    row_number_key INT IDENTITY(1,1) PRIMARY KEY,
    poi_id BIGINT NOT NULL,
    chapter_id BIGINT NULL,
    chapter_order INT NOT NULL,
    language_code NVARCHAR(10) COLLATE DATABASE_DEFAULT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    narration_text NVARCHAR(MAX) NOT NULL
);
GO

-- Điền roomId POI, giữ lại chỉ những dòng thiếu chap hoặc thiếu bản dịch chap.
INSERT INTO #MissingChapter (poi_id, chapter_id, chapter_order, language_code, title, narration_text)
SELECT p.id,
       (
           SELECT c.id
           FROM dbo.poi_chapter c
           WHERE c.poi_id = p.id AND c.chapter_order = s.chapter_order
       ) AS chapter_id,
       s.chapter_order, s.language_code, s.title, s.narration_text
FROM #ChapterSeed s
JOIN dbo.poi p ON p.code = s.poi_code
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.poi_chapter c
    JOIN dbo.poi_chapter_translation ct ON ct.chapter_id = c.id
    WHERE c.poi_id = p.id
      AND c.chapter_order = s.chapter_order
      AND ct.language_code = s.language_code
);
GO

-- Tạo chap khi chưa tồn tại trong POI (DISTINCT: mỗi chap vi+en chỉ tạo 1 dòng).
INSERT INTO dbo.poi_chapter (poi_id, chapter_order, is_active, created_at, updated_at)
SELECT DISTINCT m.poi_id, m.chapter_order, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
FROM #MissingChapter m
WHERE m.chapter_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM dbo.poi_chapter c
      WHERE c.poi_id = m.poi_id AND c.chapter_order = m.chapter_order);
GO

-- Chèn bản dịch chap, nối về chap vừa tạo hoặc chap có sẵn.
INSERT INTO dbo.poi_chapter_translation
    (chapter_id, language_code, title, narration_text, audio_status, updated_at)
SELECT c.id, m.language_code, m.title, m.narration_text, 'PENDING', SYSUTCDATETIME()
FROM #MissingChapter m
JOIN dbo.poi_chapter c ON c.poi_id = m.poi_id AND c.chapter_order = m.chapter_order
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.poi_chapter_translation ct
    WHERE ct.chapter_id = c.id AND ct.language_code = m.language_code);
GO

DROP TABLE #MissingChapter;
DROP TABLE #ChapterSeed;
GO
