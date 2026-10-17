# News external links — tracking

Mục tiêu: mỗi thẻ tin tức phải dẫn tới nội dung thật, không có thẻ "chết".
Bài nào có `externalUrl` thì thẻ mở bài gốc ở tab mới; bài chỉ có nội dung nội bộ
thì mở trang chi tiết trong site.

## Quy tắc
- Chỉ hiển thị: tiêu đề, mô tả ngắn (viết lại), nguồn, ngày, và liên kết tới bài gốc.
- Không sao chép toàn văn, không hotlink ảnh từ báo. Ảnh dùng tài sản cục bộ
  (Wikimedia Commons / Unsplash / ảnh của site) kèm ghi công.
- URL phải là thật và đã kiểm tra trả về HTTP 200 (đã xác minh bên dưới).

## Bài có liên kết ngoài thật (đã xác minh 200)
| slug | nguồn | url |
| --- | --- | --- |
| ao-dai-qua-hon-100-nam | VnExpress | https://vnexpress.net/ao-dai-qua-hon-100-nam-4122267.html |
| tri-thuc-may-mac-ao-dai-hue-di-san-quoc-gia | VnExpress | https://vnexpress.net/tri-thuc-may-mac-ao-dai-hue-la-di-san-van-hoa-phi-vat-the-quoc-gia-4780585.html |
| chiec-ao-ba-ba-va-van-hoa-nam-bo | Thanh Niên | https://thanhnien.vn/chiec-ao-ba-ba-gan-lien-voi-van-hoa-nam-bo-185230917021604218.htm |
| non-la-lang-chuong-giu-hon-van-hoa-viet | Báo Chính phủ | https://thanglong.chinhphu.vn/non-la-lang-chuong-giu-hon-van-hoa-viet-103240117115141963.htm |
| 9-di-san-van-hoa-thien-nhien-the-gioi-tai-viet-nam | VnExpress | https://vnexpress.net/9-di-san-van-hoa-thien-nhien-the-gioi-tai-viet-nam-4654852.html |
| 10-ky-quan-thien-nhien-dep-nhat-viet-nam | VnExpress | https://vnexpress.net/10-ky-quan-thien-nhien-dep-nhat-viet-nam-4197437.html |
| 17-diem-den-hang-dau-viet-nam | VnExpress | https://vnexpress.net/17-diem-den-hang-dau-viet-nam-do-bao-nuoc-ngoai-binh-chon-4503730.html |
| nu-cuoi-nguoi-viet | VnExpress | https://vnexpress.net/nu-cuoi-nguoi-viet-4933492.html |

## Bài nội bộ (chủ động KHÔNG có liên kết ngoài)
13 bài biên tập gốc của Echora về Sài Gòn (diem-den / van-hoa / meo-tham-quan).
Các bài này dùng nội dung và ảnh của site, không gắn liên kết ngoài.

- dinh-doc-lap-nhung-can-phong-it-nguoi-de-y
- gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua
- buu-dien-trung-tam-ben-trong-toa-nha-mang-dau-an-phap
- cho-ben-thanh-di-cho-nhu-nguoi-sai-gon
- bao-tang-chung-tich-chien-tranh-luu-y-khi-tham-quan
- ca-phe-vot-sai-gon-nep-song-dong-lai
- am-vang-don-ca-tai-tu-giua-long-do-thi
- ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam
- com-tam-dem-sai-gon-net-quyen-ru-am-thuc-he-pho
- hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan
- lo-trinh-di-bo-buoi-sang-5-cong-trinh-tieu-bieu
- cach-chup-anh-dep-di-tich-kien-truc-co-sai-gon
- cam-nang-chuan-bi-tien-le-va-vat-dung-di-cho

## Ảnh cục bộ mới (đã tối ưu < 200KB)
- `public/images/news/non-la.jpg` — Wikimedia Commons (Vietnamese conical hat)
- `public/images/news/trang-an.jpg` — Wikimedia Commons (Tràng An, Ninh Bình)
- `public/images/news/halong.webp` — Unsplash
- `public/images/news/arch.webp` — Unsplash
- `public/images/news/dan-tranh.jpg` — Wikimedia Commons (đàn tranh)
