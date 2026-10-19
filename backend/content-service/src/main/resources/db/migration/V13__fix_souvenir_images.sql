-- Gán ảnh phù hợp hơn cho một số quà lưu niệm (dùng ảnh nội bộ trong
-- frontend/public/images/souvenirs). Idempotent: chỉ cập nhật theo slug,
-- chạy lại nhiều lần vẫn cho kết quả như nhau.
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'vong-tay-da-may-man' AND image_path = '/images/souvenirs/vong-tay-da.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/vong-tay-da.jpg' WHERE slug = 'vong-tay-da-may-man';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'chuoi-hat-go-my-nghe' AND image_path = '/images/souvenirs/chuoi-hat-go.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/chuoi-hat-go.jpg' WHERE slug = 'chuoi-hat-go-my-nghe';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'mo-hinh-dinh-doc-lap' AND image_path = '/images/souvenirs/mo-hinh.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/mo-hinh.jpg' WHERE slug = 'mo-hinh-dinh-doc-lap';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-dinh-doc-lap' AND image_path = '/images/souvenirs/nam-cham.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/nam-cham.jpg' WHERE slug = 'nam-cham-dinh-doc-lap';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-nha-tho-duc-ba' AND image_path = '/images/souvenirs/nam-cham.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/nam-cham.jpg' WHERE slug = 'nam-cham-nha-tho-duc-ba';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'nam-cham-bao-tang' AND image_path = '/images/souvenirs/nam-cham.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/nam-cham.jpg' WHERE slug = 'nam-cham-bao-tang';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'sach-lich-su-sai-gon' AND image_path = '/images/souvenirs/sach-lich-su.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/sach-lich-su.jpg' WHERE slug = 'sach-lich-su-sai-gon';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'huy-hieu-luu-niem' AND image_path = '/images/souvenirs/huy-hieu.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/huy-hieu.jpg' WHERE slug = 'huy-hieu-luu-niem';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'den-long-hoi-quan' AND image_path = '/images/souvenirs/den-long.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/den-long.jpg' WHERE slug = 'den-long-hoi-quan';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'non-la-thu-cong' AND image_path = '/images/souvenirs/non-la.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/non-la.jpg' WHERE slug = 'non-la-thu-cong';

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE slug = 'tranh-co-dong-viet-nam' AND image_path = '/images/souvenirs/tranh-co-dong.jpg')
    UPDATE dbo.products SET image_path = '/images/souvenirs/tranh-co-dong.jpg' WHERE slug = 'tranh-co-dong-viet-nam';

GO
