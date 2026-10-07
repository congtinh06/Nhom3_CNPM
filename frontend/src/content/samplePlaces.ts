import { SamplePlace } from '../types';

export const samplePlaces: SamplePlace[] = [
  {
    id: 1,
    name: 'Dinh Độc Lập',
    group: 'ls',
    hue: 8,
    description: 'Công trình gắn với sự kiện ngày 30/4/1975, còn giữ nội thất và hầm chỉ huy thời chiến.',
    tip: 'Nên đến buổi sáng và xem cả tầng hầm.',
  },
  {
    id: 2,
    name: 'Địa đạo Củ Chi',
    group: 'ls',
    hue: 16,
    description: 'Hệ thống đường hầm dài hàng trăm km, cho thấy đời sống và cách chiến đấu của người dân vùng này.',
    tip: 'Cách trung tâm khoảng 70 km, nên dành nửa ngày.',
  },
  {
    id: 3,
    name: 'Nhà thờ Đức Bà',
    group: 'tl',
    hue: 5,
    description: 'Nhà thờ gạch đỏ kiểu Pháp ở trung tâm, nằm cạnh Bưu điện Trung tâm cũng do người Pháp xây.',
    tip: 'Kiểm tra lịch mở cửa trước khi đi; chụp ảnh đẹp lúc sáng sớm.',
  },
  {
    id: 4,
    name: 'Chùa Bà Thiên Hậu',
    group: 'tl',
    hue: 28,
    description: 'Ngôi chùa của cộng đồng người Hoa ở Chợ Lớn, nổi bật với những vòng hương treo và lễ hội hằng năm.',
    tip: 'Hợp đi cùng một vòng khám phá Chợ Lớn.',
  },
  {
    id: 5,
    name: 'Chợ Bến Thành',
    group: 'cp',
    hue: 30,
    description: 'Biểu tượng của thành phố từ đầu thế kỷ 20, nơi gom đủ đặc sản, vải vóc và quà lưu niệm.',
    tip: 'Trả giá nhẹ nhàng và nên ăn thử vài món ngay trong chợ.',
  },
  {
    id: 6,
    name: 'Phố đi bộ Nguyễn Huệ',
    group: 'cp',
    hue: 12,
    description: 'Quảng trường sống động ở trung tâm, nơi tổ chức đường hoa Tết và nhiều sự kiện lớn.',
    tip: 'Tối cuối tuần là lúc đông vui nhất.',
  },
  {
    id: 7,
    name: 'Landmark 81',
    group: 'hd',
    hue: 42,
    description: 'Tòa tháp 81 tầng bên sông Sài Gòn, đại diện cho diện mạo hiện đại của thành phố.',
    tip: 'Lên cao lúc hoàng hôn để thấy thành phố lên đèn.',
  },
  {
    id: 8,
    name: 'Bến Bạch Đằng',
    group: 'hd',
    hue: 200,
    description: 'Bờ sông gần trung tâm, nơi ngắm tàu thuyền và đi du thuyền tối trên sông Sài Gòn.',
    tip: 'Chiều muộn là lúc gió mát nhất.',
  },
];

export const sampleGroups: Record<string, string> = {
  all: 'TẤT CẢ',
  ls: 'LỊCH SỬ',
  tl: 'TÂM LINH',
  cp: 'CHỢ & PHỐ',
  hd: 'HIỆN ĐẠI',
  fav: 'YÊU THÍCH',
};
