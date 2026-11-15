import { Drink } from '../types';

export const coverContent = {
  tagline: 'Vẻ đẹp văn hóa và điểm đến',
  title: 'Sài Gòn',
  date: 'TP. Hồ Chí Minh, 10/2026',
};

export const introContent = {
  title: 'Giới thiệu chung',
  photosLeft: [
    { hue: 12, caption: 'Phố đi bộ Nguyễn Huệ', src: '/images/home/intro-nguyen-hue.jpg', link: '/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y' },
    { hue: 30, caption: 'Xe máy giờ cao điểm', src: '/images/home/intro-traffic.jpg', link: '/tin-tuc/hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan' },
    { hue: 45, caption: 'Quán cà phê vỉa hè', src: '/images/home/intro-cafe.jpg', link: '/tin-tuc/ca-phe-vot-sai-gon-nep-song-dong-lai' },
  ],
  paragraph:
    'Sài Gòn – TP. Hồ Chí Minh là thành phố lớn nhất cả nước, nơi giao thoa giữa Việt, Hoa, Khmer và dấu ấn kiến trúc Pháp. Chỉ một con phố có thể vừa có ngôi chùa trăm năm, vừa có nhà thờ gạch đỏ và tòa nhà chọc trời.',
  photoRight: { hue: 8, caption: 'Nhà thờ Đức Bà', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/tin-tuc/gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua' },
};

export const cultureContent = {
  title: 'Văn hóa Sài Gòn',
  photos: [
    { hue: 18, caption: 'Ảnh: đờn ca tài tử, cải lương' },
    { hue: 35, caption: 'Ảnh: đường hoa Tết Nguyễn Huệ' },
    { hue: 5, caption: 'Ảnh: lễ hội ở Chợ Lớn' },
  ],
  paragraph:
    'Văn hóa Sài Gòn cởi mở và phóng khoáng, hình thành từ nhiều cộng đồng cùng sống chung. Từ đờn ca tài tử, lễ hội người Hoa ở Chợ Lớn đến thói quen ngồi cà phê vỉa hè, mỗi điểm đến đều giữ một nét sống rất riêng.',
};

export const costumeContent = {
  title: 'Trang phục truyền thống',
  photoBig: { hue: 25, caption: 'Áo dài', src: '/images/home/costume-ao-dai.jpg', link: '/tin-tuc/ao-dai-qua-hon-100-nam' },
  photosTwo: [
    { hue: 15, caption: 'Áo dài', src: '/images/home/costume-ao-dai-2.jpg', link: '/tin-tuc/ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam' },
    { hue: 38, caption: 'Áo bà ba', src: '/images/home/costume-ao-ba-ba.jpg', link: '/tin-tuc/chiec-ao-ba-ba-va-van-hoa-nam-bo' },
  ],
  paragraph:
    'Áo dài và áo bà ba là hai hình ảnh quen thuộc của người Sài Gòn. Áo dài thường xuất hiện ở lễ Tết và dịp quan trọng, còn áo bà ba gắn với vùng sông nước Nam Bộ, giản dị và thoải mái.',
};

export const foodContent = {
  title: 'Ẩm thực Sài Gòn',
  photosTop: [
    { hue: 20, caption: 'Cơm tấm', src: '/images/dishes/com-tam-suon-bi-cha.webp' },
    { hue: 32, caption: 'Hủ tiếu', src: '/images/dishes/hu-tieu-nam-vang.webp' },
    { hue: 10, caption: 'Bánh xèo', src: '/images/dishes/banh-xeo-nam-bo.webp' },
  ],
  paragraph:
    'Ẩm thực Sài Gòn nổi tiếng nhờ sự đa dạng và giá cả dễ chịu. Cơm tấm, hủ tiếu, bánh mì, phá lấu hay ly cà phê sữa đá đều có thể tìm thấy ngay trên vỉa hè, trong hẻm nhỏ hoặc quanh các khu chợ.',
  photosBottom: [
    { hue: 40, caption: 'Bánh mì', src: '/images/dishes/banh-mi-thit-nguoi-pate.webp' },
    { hue: 6, caption: 'Phá lấu', src: '/images/home/food-pha-lau.jpg' },
    { hue: 28, caption: 'Cà phê sữa đá', src: '/images/home/food-ca-phe-sua-da.jpg' },
  ],
};

export const drinksList: Drink[] = [
  {
    id: 0,
    name: 'Cà phê sữa đá',
    price: 29000,
    hue: 22,
    description: 'Cà phê pha phin với sữa đặc và đá, thức uống khởi đầu ngày mới của nhiều người Sài Gòn.',
  },
  {
    id: 1,
    name: 'Bạc xỉu',
    price: 32000,
    hue: 34,
    description: 'Nhiều sữa, ít cà phê, vị ngọt dịu và dễ uống hơn.',
  },
  {
    id: 2,
    name: 'Nước mía',
    price: 20000,
    hue: 90,
    description: 'Giải khát giữa trưa nắng, thường bán ở vỉa hè và quanh các khu chợ.',
  },
  {
    id: 3,
    name: 'Trà đá vỉa hè',
    price: 8000,
    hue: 40,
    description: 'Ly trà đá quen thuộc, gắn với thói quen ngồi nói chuyện bên lề phố.',
  },
];

export const tourismTeaserContent = {
  title: 'Du lịch Sài Gòn',
  photos: [
    { hue: 10, caption: 'Dinh Độc Lập', src: '/images/pois/dinh-doc-lap.jpg', link: '/diem-du-lich/dinh-doc-lap' },
    { hue: 30, caption: 'Chợ Bến Thành', src: '/images/pois/cho-ben-thanh.jpg', link: '/diem-du-lich/cho-ben-thanh' },
    { hue: 16, caption: 'Địa đạo Củ Chi', src: '/images/home/tour-cu-chi.jpg', link: '/diem-du-lich' },
    { hue: 42, caption: 'Nhà thờ Đức Bà', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/diem-du-lich/nha-tho-duc-ba' },
  ],
  paragraph:
    'Mỗi điểm đến kể một câu chuyện khác nhau: Dinh Độc Lập của lịch sử, Chợ Bến Thành của đời sống thường ngày, Địa đạo Củ Chi của ký ức chiến tranh và Nhà thờ Đức Bà của nét kiến trúc Pháp cổ.',
};

export const siteContact = {
  address: '338 An Dương Vương',
  fullAddress: '338 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
  phone: '0346358399',
  email: 'congtinh1932006@gmail.com',
  hours: '8h - 23h',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=10.7599%2C106.6791',
};

export const contactContent = {
  title: 'Liên hệ',
  paragraph: 'Bạn có góp ý hoặc muốn đề xuất thêm địa điểm? Gửi cho mình nhé.',
  email: siteContact.email,
  phone: siteContact.phone,
  area: 'TP. Hồ Chí Minh',
};

export const footerContent = {
  brand: 'Echora',
  tagline: 'Audio guide for places and souvenirs',
  blurb: 'Khám phá văn hóa, ẩm thực và các điểm đến nổi bật của TP. Hồ Chí Minh.',
  copyright: '© 2026 Echora, Văn hóa các điểm du lịch TP.HCM. Bản demo.',
  backToTop: 'Về đầu trang',
};
