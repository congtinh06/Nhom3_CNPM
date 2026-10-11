export interface Ward {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  wards: Ward[];
}

export interface Province {
  id: string;
  name: string;
  districts: District[];
}

export interface SimpleProvince {
  code: string;
  name: string;
}

/**
 * Danh sách toàn bộ 63 Tỉnh / Thành phố Việt Nam (mã số chuẩn theo Tổng cục Thống kê)
 */
export const VN_ALL_63_PROVINCES: SimpleProvince[] = [
  { code: '79', name: 'Thành phố Hồ Chí Minh' },
  { code: '1', name: 'Thành phố Hà Nội' },
  { code: '48', name: 'Thành phố Đà Nẵng' },
  { code: '31', name: 'Thành phố Hải Phòng' },
  { code: '92', name: 'Thành phố Cần Thơ' },
  { code: '74', name: 'Tỉnh Bình Dương' },
  { code: '75', name: 'Tỉnh Đồng Nai' },
  { code: '77', name: 'Tỉnh Bà Rịa - Vũng Tàu' },
  { code: '56', name: 'Tỉnh Khánh Hòa' },
  { code: '46', name: 'Thành phố Huế' },
  { code: '49', name: 'Tỉnh Quảng Nam' },
  { code: '68', name: 'Tỉnh Lâm Đồng' },
  { code: '80', name: 'Tỉnh Long An' },
  { code: '82', name: 'Tỉnh Tiền Giang' },
  { code: '89', name: 'Tỉnh An Giang' },
  { code: '91', name: 'Tỉnh Kiên Giang' },
  { code: '83', name: 'Tỉnh Bến Tre' },
  { code: '87', name: 'Tỉnh Đồng Tháp' },
  { code: '86', name: 'Tỉnh Vĩnh Long' },
  { code: '84', name: 'Tỉnh Trà Vinh' },
  { code: '93', name: 'Tỉnh Hậu Giang' },
  { code: '94', name: 'Tỉnh Sóc Trăng' },
  { code: '95', name: 'Tỉnh Bạc Liêu' },
  { code: '96', name: 'Tỉnh Cà Mau' },
  { code: '70', name: 'Tỉnh Bình Phước' },
  { code: '72', name: 'Tỉnh Tây Ninh' },
  { code: '60', name: 'Tỉnh Bình Thuận' },
  { code: '58', name: 'Tỉnh Ninh Thuận' },
  { code: '52', name: 'Tỉnh Bình Định' },
  { code: '54', name: 'Tỉnh Phú Yên' },
  { code: '51', name: 'Tỉnh Quảng Ngãi' },
  { code: '66', name: 'Tỉnh Đắk Lắk' },
  { code: '67', name: 'Tỉnh Đắk Nông' },
  { code: '64', name: 'Tỉnh Gia Lai' },
  { code: '62', name: 'Tỉnh Kon Tum' },
  { code: '45', name: 'Tỉnh Quảng Trị' },
  { code: '44', name: 'Tỉnh Quảng Bình' },
  { code: '42', name: 'Tỉnh Hà Tĩnh' },
  { code: '40', name: 'Tỉnh Nghệ An' },
  { code: '38', name: 'Tỉnh Thanh Hóa' },
  { code: '37', name: 'Tỉnh Ninh Bình' },
  { code: '36', name: 'Tỉnh Nam Định' },
  { code: '35', name: 'Tỉnh Hà Nam' },
  { code: '34', name: 'Tỉnh Thái Bình' },
  { code: '33', name: 'Tỉnh Hưng Yên' },
  { code: '30', name: 'Tỉnh Hải Dương' },
  { code: '27', name: 'Tỉnh Bắc Ninh' },
  { code: '26', name: 'Tỉnh Vĩnh Phúc' },
  { code: '25', name: 'Tỉnh Phú Thọ' },
  { code: '24', name: 'Tỉnh Bắc Giang' },
  { code: '22', name: 'Tỉnh Quảng Ninh' },
  { code: '20', name: 'Tỉnh Lạng Sơn' },
  { code: '19', name: 'Tỉnh Thái Nguyên' },
  { code: '17', name: 'Tỉnh Hoà Bình' },
  { code: '15', name: 'Tỉnh Yên Bái' },
  { code: '14', name: 'Tỉnh Sơn La' },
  { code: '12', name: 'Tỉnh Lai Châu' },
  { code: '11', name: 'Tỉnh Điện Biên' },
  { code: '10', name: 'Tỉnh Lào Cai' },
  { code: '8', name: 'Tỉnh Tuyên Quang' },
  { code: '6', name: 'Tỉnh Bắc Kạn' },
  { code: '4', name: 'Tỉnh Cao Bằng' },
  { code: '2', name: 'Tỉnh Hà Giang' },
];

/**
 * Dữ liệu tĩnh phân cấp dự phòng (Offline Fallback)
 */
export const VN_MAJOR_PROVINCES: Province[] = [
  {
    id: '79',
    name: 'Thành phố Hồ Chí Minh',
    districts: [
      {
        id: '760',
        name: 'Quận 1',
        wards: [
          { id: '26734', name: 'Phường Bến Nghé' },
          { id: '26737', name: 'Phường Bến Thành' },
          { id: '26740', name: 'Phường Đa Kao' },
          { id: '26743', name: 'Phường Tân Định' },
          { id: '26746', name: 'Phường Phạm Ngũ Lão' },
          { id: '26749', name: 'Phường Cầu Ông Lãnh' },
        ],
      },
      {
        id: '770',
        name: 'Quận 3',
        wards: [
          { id: '27088', name: 'Phường Võ Thị Sáu' },
          { id: '27091', name: 'Phường 1' },
          { id: '27094', name: 'Phường 2' },
          { id: '27097', name: 'Phường 3' },
          { id: '27100', name: 'Phường 4' },
          { id: '27103', name: 'Phường 5' },
        ],
      },
      {
        id: '774',
        name: 'Quận 5',
        wards: [
          { id: '27220', name: 'Phường 1' },
          { id: '27223', name: 'Phường 2' },
          { id: '27226', name: 'Phường 5' },
          { id: '27229', name: 'Phường 7' },
          { id: '27232', name: 'Phường 11' },
        ],
      },
      {
        id: '778',
        name: 'Quận 7',
        wards: [
          { id: '27361', name: 'Phường Tân Phong' },
          { id: '27364', name: 'Phường Tân Phú' },
          { id: '27367', name: 'Phường Tân Quy' },
          { id: '27370', name: 'Phường Bình Thuận' },
          { id: '27373', name: 'Phường Phú Thuận' },
        ],
      },
      {
        id: '771',
        name: 'Quận 10',
        wards: [
          { id: '27139', name: 'Phường 1' },
          { id: '27142', name: 'Phường 2' },
          { id: '27145', name: 'Phường 6' },
          { id: '27148', name: 'Phường 12' },
          { id: '27151', name: 'Phường 14' },
        ],
      },
      {
        id: '765',
        name: 'Quận Bình Thạnh',
        wards: [
          { id: '26905', name: 'Phường 1' },
          { id: '26908', name: 'Phường 2' },
          { id: '26911', name: 'Phường 19' },
          { id: '26914', name: 'Phường 25' },
          { id: '26917', name: 'Phường 26' },
        ],
      },
      {
        id: '768',
        name: 'Quận Phú Nhuận',
        wards: [
          { id: '27040', name: 'Phường 1' },
          { id: '27043', name: 'Phường 2' },
          { id: '27046', name: 'Phường 7' },
          { id: '27049', name: 'Phường 9' },
          { id: '27052', name: 'Phường 11' },
        ],
      },
      {
        id: '766',
        name: 'Quận Tân Bình',
        wards: [
          { id: '26950', name: 'Phường 1' },
          { id: '26953', name: 'Phường 2' },
          { id: '26956', name: 'Phường 4' },
          { id: '26959', name: 'Phường 12' },
          { id: '26962', name: 'Phường 13' },
        ],
      },
      {
        id: '764',
        name: 'Quận Gò Vấp',
        wards: [
          { id: '26860', name: 'Phường 1' },
          { id: '26863', name: 'Phường 3' },
          { id: '26866', name: 'Phường 5' },
          { id: '26869', name: 'Phường 7' },
          { id: '26872', name: 'Phường 10' },
        ],
      },
      {
        id: '769',
        name: 'Thành phố Thủ Đức',
        wards: [
          { id: '26800', name: 'Phường Thảo Điền' },
          { id: '26803', name: 'Phường An Phú' },
          { id: '26806', name: 'Phường Hiệp Phú' },
          { id: '26809', name: 'Phường Linh Trung' },
          { id: '26812', name: 'Phường Tăng Nhơn Phú A' },
        ],
      },
    ],
  },
  {
    id: '1',
    name: 'Thành phố Hà Nội',
    districts: [
      {
        id: '2',
        name: 'Quận Hoàn Kiếm',
        wards: [
          { id: '37', name: 'Phường Phúc Tân' },
          { id: '40', name: 'Phường Đồng Xuân' },
          { id: '43', name: 'Phường Hàng Mã' },
          { id: '46', name: 'Phường Hàng Buồm' },
          { id: '49', name: 'Phường Hàng Đào' },
          { id: '52', name: 'Phường Hàng Bạc' },
          { id: '55', name: 'Phường Hàng Gai' },
          { id: '58', name: 'Phường Chương Dương' },
          { id: '61', name: 'Phường Hàng Trống' },
          { id: '64', name: 'Phường Cửa Đông' },
          { id: '67', name: 'Phường Cửa Nam' },
          { id: '70', name: 'Phường Đồng Nhân' },
          { id: '73', name: 'Phường Tràng Tiền' },
          { id: '76', name: 'Phường Trần Hưng Đạo' },
          { id: '79', name: 'Phường Phan Chu Trinh' },
          { id: '82', name: 'Phường Hàng Bài' },
          { id: '85', name: 'Phường Lý Thái Tổ' },
        ],
      },
      {
        id: '1',
        name: 'Quận Ba Đình',
        wards: [
          { id: '1', name: 'Phường Phúc Xá' },
          { id: '4', name: 'Phường Trúc Bạch' },
          { id: '7', name: 'Phường Vĩnh Phúc' },
          { id: '10', name: 'Phường Cống Vị' },
          { id: '13', name: 'Phường Liễu Giai' },
          { id: '16', name: 'Phường Nguyễn Trung Trực' },
          { id: '19', name: 'Phường Quán Thánh' },
          { id: '22', name: 'Phường Ngọc Hà' },
          { id: '25', name: 'Phường Điện Biên' },
          { id: '28', name: 'Phường Đội Cấn' },
          { id: '31', name: 'Phường Ngọc Khánh' },
          { id: '34', name: 'Phường Kim Mã' },
          { id: '35', name: 'Phường Giảng Võ' },
          { id: '36', name: 'Phường Thành Công' },
        ],
      },
      {
        id: '6',
        name: 'Quận Đống Đa',
        wards: [
          { id: '169', name: 'Phường Cát Linh' },
          { id: '172', name: 'Phường Văn Miếu' },
          { id: '175', name: 'Phường Quốc Tử Giám' },
          { id: '178', name: 'Phường Láng Thượng' },
          { id: '181', name: 'Phường Ô Chợ Dừa' },
          { id: '184', name: 'Phường Láng Hạ' },
        ],
      },
      {
        id: '5',
        name: 'Quận Cầu Giấy',
        wards: [
          { id: '145', name: 'Phường Nghĩa Đô' },
          { id: '148', name: 'Phường Nghĩa Tân' },
          { id: '151', name: 'Phường Mai Dịch' },
          { id: '154', name: 'Phường Dịch Vọng' },
          { id: '157', name: 'Phường Dịch Vọng Hậu' },
        ],
      },
      {
        id: '7',
        name: 'Quận Hai Bà Trưng',
        wards: [
          { id: '211', name: 'Phường Bạch Mai' },
          { id: '214', name: 'Phường Bách Khoa' },
          { id: '217', name: 'Phường Đồng Tâm' },
          { id: '220', name: 'Phường Lê Đại Hành' },
        ],
      },
      {
        id: '3',
        name: 'Quận Tây Hồ',
        wards: [
          { id: '91', name: 'Phường Phú Thượng' },
          { id: '94', name: 'Phường Nhật Tân' },
          { id: '97', name: 'Phường Tứ Liên' },
          { id: '100', name: 'Phường Quảng An' },
          { id: '103', name: 'Phường Xuân La' },
          { id: '106', name: 'Phường Yên Phụ' },
          { id: '109', name: 'Phường Bưởi' },
          { id: '112', name: 'Phường Thụy Khuê' },
        ],
      },
    ],
  },
  {
    id: '48',
    name: 'Thành phố Đà Nẵng',
    districts: [
      {
        id: '490',
        name: 'Quận Hải Châu',
        wards: [
          { id: '20194', name: 'Phường Hải Châu I' },
          { id: '20197', name: 'Phường Hải Châu II' },
          { id: '20200', name: 'Phường Thạch Thang' },
          { id: '20203', name: 'Phường Thanh Bình' },
        ],
      },
      {
        id: '491',
        name: 'Quận Thanh Khê',
        wards: [
          { id: '20233', name: 'Phường Tam Thuận' },
          { id: '20236', name: 'Phường Thanh Khê Đông' },
          { id: '20239', name: 'Phường Thanh Khê Tây' },
        ],
      },
      {
        id: '492',
        name: 'Quận Sơn Trà',
        wards: [
          { id: '20263', name: 'Phường An Hải Bắc' },
          { id: '20266', name: 'Phường An Hải Đông' },
          { id: '20269', name: 'Phường Phước Mỹ' },
        ],
      },
      {
        id: '493',
        name: 'Quận Ngũ Hành Sơn',
        wards: [
          { id: '20284', name: 'Phường Mỹ An' },
          { id: '20287', name: 'Phường Khuê Mỹ' },
          { id: '20290', name: 'Phường Hòa Hải' },
        ],
      },
    ],
  },
];

export const VN_PROVINCES = VN_MAJOR_PROVINCES;
