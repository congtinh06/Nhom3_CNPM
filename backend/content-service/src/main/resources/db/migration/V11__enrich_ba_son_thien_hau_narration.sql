-- ==============================================================================
-- Echora - Flyway V11 Migration
-- Bổ sung nội dung thuyết minh đầy đủ cho 2 POI demo:
--   * Chùa Bà Thiên Hậu (POI_THIEN_HAU_01)
--   * Cầu Ba Son (POI_CAU_BA_SON_01)
--
-- Trước đây hai POI này chỉ có một đoạn mô tả ngắn; bản tiếng Anh của Chùa Bà
-- còn bị dịch máy sai thuật ngữ kiến trúc. Migration này thay bằng bản viết tay
-- tiếng Việt + tiếng Anh, đồng thời đưa audio về PENDING để pipeline tổng hợp lại.
--
-- Nguyên tắc an toàn:
--   * Chỉ cập nhật khi nội dung vẫn là bản cũ đã biết (không ghi đè bản admin sửa).
--   * Idempotent: chạy lại nhiều lần cho cùng kết quả.
-- ==============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ------------------------------------------------------------------------------
-- Chùa Bà Thiên Hậu - bản tiếng Việt
-- ------------------------------------------------------------------------------
UPDATE t
SET t.summary = N'Bạn đang đứng trước Chùa Bà Thiên Hậu, hay Hội quán Tuệ Thành, một trong những ngôi chùa cổ và linh thiêng nhất của cộng đồng người Hoa tại Chợ Lớn. Công trình được xây dựng khoảng năm 1760, nổi tiếng với kiến trúc nhiều lớp và những phù điêu gốm nung rực rỡ trên mái.',
    t.description = N'Hội quán Tuệ Thành, thường được gọi là Chùa Bà Thiên Hậu, nằm ở số 710 đường Nguyễn Trãi, Quận 5. Công trình do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 để thờ Bà Thiên Hậu, vị thần bảo hộ người đi biển và người buôn bán. Trải qua hơn hai thế kỷ, chùa vẫn là nơi sinh hoạt tín ngưỡng quen thuộc của người dân Chợ Lớn.

Ngôi chùa được tổ chức theo kiểu hội quán với nhiều lớp không gian nối tiếp nhau, gồm tiền điện, trung điện và hậu điện. Điểm nổi bật là bộ khung gỗ chạm trổ, các hoành phi, câu đối và những phù điêu gốm nung nhiều màu trên mái. Các hình tượng nhân vật, rồng, chim và hoa lá được đắp nổi tỉ mỉ, tạo nên vẻ rực rỡ đặc trưng của kiến trúc người Hoa.

Trong chùa có không gian thờ tự trang nghiêm, hương khói quanh năm và những dấu tích cho thấy sự gắn bó lâu đời của cộng đồng người Hoa với vùng đất Sài Gòn - Chợ Lớn. Khi tham quan, bạn nên đi nhẹ, nói khẽ, giữ trang phục lịch sự và hỏi trước nếu muốn chụp ảnh trong khu vực thờ tự.

Công trình được công nhận là di tích kiến trúc nghệ thuật cấp quốc gia vào ngày 7 tháng 1 năm 1993. Chùa nằm gần nhiều điểm tham quan khác của Chợ Lớn, nên bạn có thể kết hợp ghé thăm trong cùng một buổi dạo quanh khu vực.',
    t.historical_significance = N'Chùa được công nhận ngày 7/1/1993 là di tích kiến trúc nghệ thuật cấp quốc gia, ghi dấu vai trò trung tâm tín ngưỡng và sinh hoạt cộng đồng của người Hoa gốc Quảng Đông tại Chợ Lớn.',
    t.translation_source = 'MANUAL',
    t.audio_status = 'PENDING',
    t.audio_url = NULL,
    t.audio_error_reason = NULL,
    t.audio_last_attempt_at = NULL,
    t.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation t
JOIN dbo.poi p ON p.id = t.poi_id
WHERE p.code = 'POI_THIEN_HAU_01'
  AND t.language_code = 'vi'
  AND t.description = N'Hội quán Tuệ Thành (Chùa Bà Thiên Hậu) do cộng đồng người Hoa gốc Quảng Đông xây dựng khoảng năm 1760 tại Chợ Lớn. Ngôi chùa nổi bật với kiến trúc tiền điện độc đáo và hệ thống phù điêu gốm nung tinh xảo trên mái.';
GO

-- ------------------------------------------------------------------------------
-- Chùa Bà Thiên Hậu - bản tiếng Anh (thay bản dịch máy sai thuật ngữ)
-- ------------------------------------------------------------------------------
UPDATE t
SET t.title = N'Ba Thien Hau Pagoda',
    t.summary = N'You are standing in front of Ba Thien Hau Pagoda, also known as Tue Thanh Assembly Hall, one of the oldest and most revered Chinese temples in Cho Lon. Built around 1760, it is known for its multi-hall layout and the colorful ceramic reliefs covering its roof.',
    t.description = N'Tue Thanh Assembly Hall, commonly called Ba Thien Hau Pagoda, stands at 710 Nguyen Trai Street in District 5. It was built around 1760 by the Cantonese Chinese community to honor Thien Hau, the goddess believed to protect seafarers and traders. After more than two centuries, the temple remains a living place of worship for the Cho Lon community.

The temple follows the layout of a Chinese assembly hall, with a series of connected spaces leading from the front hall through the middle hall to the rear hall. Its wooden frames, horizontal boards, couplets and roof are richly decorated. The roof is especially notable for its glazed ceramic reliefs, where figures, dragons, birds and flowers are built up in fine detail.

Inside, the atmosphere is quiet and incense-filled, with altars and ornaments that reflect the long presence of the Cantonese community in Saigon and Cho Lon. Visitors should dress respectfully, keep their voices low and ask before taking photographs in the worship areas.

The temple was recognized as a national architectural and artistic relic on 7 January 1993. It sits close to several other attractions in Cho Lon, so it can easily be combined with a walk through the neighborhood.',
    t.historical_significance = N'The temple was recognized as a national architectural and artistic relic on 7 January 1993, reflecting its role as a center of worship and community life for the Cantonese Chinese community in Cho Lon.',
    t.translation_source = 'MANUAL',
    t.audio_status = 'PENDING',
    t.audio_url = NULL,
    t.audio_error_reason = NULL,
    t.audio_last_attempt_at = NULL,
    t.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation t
JOIN dbo.poi p ON p.id = t.poi_id
WHERE p.code = 'POI_THIEN_HAU_01'
  AND t.language_code = 'en'
  AND t.description LIKE N'Tue Thanh Assembly Hall (Ba Thien Hau Pagoda) was built by the Cantonese Chinese community around 1760%';
GO

-- ------------------------------------------------------------------------------
-- Cầu Ba Son - bản tiếng Việt
-- ------------------------------------------------------------------------------
UPDATE t
SET t.summary = N'Bạn đang đứng trước Cầu Ba Son, cây cầu dây văng hiện đại bắc qua sông Sài Gòn. Cây cầu nối trung tâm thành phố với Khu đô thị mới Thủ Thiêm, với trụ tháp nghiêng cao 113 mét tạo thành điểm nhấn nổi bật trên sông.',
    t.description = N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, nối khu vực đường Tôn Đức Thắng ở trung tâm thành phố với Khu đô thị mới Thủ Thiêm. Cầu thông xe ngày 28 tháng 4 năm 2022, góp phần rút ngắn hành trình giữa hai bờ và mở rộng kết nối giao thông của thành phố.

Điểm dễ nhận ra nhất của cầu là trụ tháp hình vòm cao khoảng 113 mét, nghiêng về phía Thủ Thiêm. Hệ dây văng kéo các nhịp cầu tạo nên dáng vẻ thanh thoát, đồng thời mở ra góc nhìn rộng về sông Sài Gòn, bờ Thủ Thiêm và khu trung tâm.

Cầu từng được gọi là Thủ Thiêm 2. Ngày 9 tháng 12 năm 2022, Hội đồng Nhân dân Thành phố Hồ Chí Minh thông qua việc đặt tên Ba Son, nhằm gắn cây cầu với tên gọi của xưởng đóng tàu Ba Son, một địa danh lịch sử bên bờ sông.

Khi dạo bộ ven sông hoặc đi qua cầu, bạn có thể ngắm toàn cảnh khu vực, đặc biệt là vào buổi chiều khi ánh nắng phản chiếu trên mặt nước. Đây cũng là điểm kết nối thuận tiện để tiếp tục hành trình đến các khu vực ven sông của thành phố.',
    t.historical_significance = N'Cầu từng mang tên Thủ Thiêm 2. Ngày 9/12/2022, HĐND TP.HCM thông qua việc đặt tên Ba Son, theo tên xưởng đóng tàu Ba Son lịch sử.',
    t.translation_source = 'MANUAL',
    t.audio_status = 'PENDING',
    t.audio_url = NULL,
    t.audio_error_reason = NULL,
    t.audio_last_attempt_at = NULL,
    t.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation t
JOIN dbo.poi p ON p.id = t.poi_id
WHERE p.code = 'POI_CAU_BA_SON_01'
  AND t.language_code = 'vi'
  AND t.description = N'Cầu Ba Son là cầu dây văng bất đối xứng bắc qua sông Sài Gòn, thông xe ngày 28/4/2022, với trụ tháp hình vòm cao 113 m nghiêng về phía Thủ Thiêm.';
GO

-- ------------------------------------------------------------------------------
-- Cầu Ba Son - bản tiếng Anh
-- ------------------------------------------------------------------------------
UPDATE t
SET t.title = N'Ba Son Bridge',
    t.summary = N'You are standing in front of Ba Son Bridge, a modern cable-stayed bridge across the Saigon River. It links the city center with the Thu Thiem New Urban Area, and its 113-meter inclined tower has become a striking landmark on the river.',
    t.description = N'Ba Son Bridge is an asymmetric cable-stayed bridge over the Saigon River, connecting Ton Duc Thang Street in the city center with the Thu Thiem New Urban Area. It opened to traffic on 28 April 2022, shortening the journey between the two banks and strengthening the city''s transport links.

Its most recognizable feature is the 113-meter arched tower, which leans toward Thu Thiem. The cables fan out to support the bridge deck, giving the structure a light appearance and opening wide views of the Saigon River, the Thu Thiem bank and the city center.

The bridge was once known as Thu Thiem 2. On 9 December 2022, the Ho Chi Minh City People''s Council approved the name Ba Son, linking the bridge to the historic Ba Son Shipyard on the riverbank.

When walking along the riverside or crossing the bridge, you can take in the panorama of the area, especially in the late afternoon when sunlight reflects off the water. The bridge is also a convenient connection for continuing your journey to other riverside districts.',
    t.historical_significance = N'The bridge was once known as Thu Thiem 2. On 9 December 2022, the Ho Chi Minh City People''s Council approved the name Ba Son, after the historic Ba Son Shipyard.',
    t.translation_source = 'MANUAL',
    t.audio_status = 'PENDING',
    t.audio_url = NULL,
    t.audio_error_reason = NULL,
    t.audio_last_attempt_at = NULL,
    t.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation t
JOIN dbo.poi p ON p.id = t.poi_id
WHERE p.code = 'POI_CAU_BA_SON_01'
  AND t.language_code = 'en'
  AND t.description LIKE N'Ba Son Bridge is a cable-stayed bridge over the Saigon River, opened to traffic on April 28, 2022%';
GO

-- ------------------------------------------------------------------------------
-- Buộc pipeline dịch/TTS tổng hợp lại các ngôn ngữ còn lại từ bản tiếng Việt mới.
-- ------------------------------------------------------------------------------
UPDATE t
SET t.audio_status = 'PENDING',
    t.audio_url = NULL,
    t.audio_error_reason = NULL,
    t.audio_last_attempt_at = NULL,
    t.updated_at = SYSUTCDATETIME()
FROM dbo.poi_translation t
JOIN dbo.poi p ON p.id = t.poi_id
WHERE p.code IN ('POI_THIEN_HAU_01', 'POI_CAU_BA_SON_01')
  AND t.language_code IN ('ja', 'ko');
GO

UPDATE dbo.poi
SET publish_status = 'PENDING',
    publish_event_type = 'POI_UPDATED',
    publish_attempts = 0,
    last_publish_error = NULL,
    last_publish_attempt_at = NULL,
    updated_at = SYSUTCDATETIME()
WHERE code IN ('POI_THIEN_HAU_01', 'POI_CAU_BA_SON_01');
GO
