import { Drink } from '../types';

export const coverContent = {
  tagline: 'Vẻ đẹp văn hóa và điểm đến',
  title: 'Sài Gòn',
  date: 'TP. Hồ Chí Minh · 10/2026',
};

export const introContent = {
  title: 'Giới thiệu chung',
  photosLeft: [
    { hue: 12, caption: 'Ảnh: phố đi bộ Nguyễn Huệ' },
    { hue: 30, caption: 'Ảnh: xe máy giờ tan tầm' },
    { hue: 45, caption: 'Ảnh: quán cà phê vỉa hè' },
  ],
  paragraph:
    'Sài Gòn – TP. Hồ Chí Minh là thành phố lớn nhất cả nước, nơi giao thoa giữa Việt, Hoa, Khmer và dấu ấn kiến trúc Pháp. Chỉ một con phố có thể vừa có ngôi chùa trăm năm, vừa có nhà thờ gạch đỏ và tòa nhà chọc trời.',
  photoRight: { hue: 8, caption: 'Ảnh dọc: Nhà thờ Đức Bà / Bưu điện Trung tâm' },
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
  photoBig: { hue: 25, caption: 'Ảnh ngang: áo dài tại Dinh Độc Lập / Nhà thờ Đức Bà' },
  photosTwo: [
    { hue: 15, caption: 'Ảnh: áo dài' },
    { hue: 38, caption: 'Ảnh: áo bà ba' },
  ],
  paragraph:
    'Áo dài và áo bà ba là hai hình ảnh quen thuộc của người Sài Gòn. Áo dài thường xuất hiện ở lễ Tết và dịp quan trọng, còn áo bà ba gắn với vùng sông nước Nam Bộ, giản dị và thoải mái.',
};

export const foodContent = {
  title: 'Ẩm thực Sài Gòn',
  photosTop: [
    { hue: 20, caption: 'Ảnh: cơm tấm' },
    { hue: 32, caption: 'Ảnh: hủ tiếu' },
    { hue: 10, caption: 'Ảnh: bánh xèo' },
  ],
  paragraph:
    'Ẩm thực Sài Gòn nổi tiếng nhờ sự đa dạng và giá cả dễ chịu. Cơm tấm, hủ tiếu, bánh mì, phá lấu hay ly cà phê sữa đá đều có thể tìm thấy ngay trên vỉa hè, trong hẻm nhỏ hoặc quanh các khu chợ.',
  photosBottom: [
    { hue: 40, caption: 'Ảnh: bánh mì' },
    { hue: 6, caption: 'Ảnh: phá lấu' },
    { hue: 28, caption: 'Ảnh: cà phê sữa đá' },
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
    { hue: 10, caption: 'Dinh Độc Lập' },
    { hue: 30, caption: 'Chợ Bến Thành' },
    { hue: 16, caption: 'Địa đạo Củ Chi' },
    { hue: 42, caption: 'Landmark 81 & Bến Bạch Đằng' },
  ],
  paragraph:
    'Mỗi điểm đến kể một câu chuyện khác nhau: Dinh Độc Lập của lịch sử, Chợ Bến Thành của đời sống thường ngày, Địa đạo Củ Chi của ký ức chiến tranh và Landmark 81 của một thành phố đang vươn lên.',
};

export const contactContent = {
  title: 'Liên hệ',
  paragraph: 'Bạn có góp ý hoặc muốn đề xuất thêm địa điểm? Gửi cho mình nhé.',
  email: 'hello@example.com',
  phone: '0900 000 000',
  area: 'TP. Hồ Chí Minh',
};

export const footerContent = {
  brand: 'Sài Gòn',
  blurb: 'Khám phá văn hóa, ẩm thực và các điểm đến nổi bật của TP. Hồ Chí Minh.',
  copyright: '© 2026 Sài Gòn – Văn hóa các điểm du lịch TP.HCM. Bản demo.',
  backToTop: 'Về đầu trang ↑',
};
