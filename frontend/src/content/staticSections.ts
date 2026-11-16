import { Drink, SupportedLanguage } from '../types';

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
    { hue: 16, caption: 'Bưu điện Trung tâm', src: '/images/pois/buu-dien-trung-tam.jpg', link: '/diem-du-lich/buu-dien-trung-tam' },
    { hue: 42, caption: 'Nhà thờ Đức Bà', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/diem-du-lich/nha-tho-duc-ba' },
  ],
  paragraph:
    'Mỗi điểm đến kể một câu chuyện khác nhau: Dinh Độc Lập của lịch sử, Chợ Bến Thành của đời sống thường ngày, Bưu điện Trung tâm của những lá thư cũ và Nhà thờ Đức Bà của nét kiến trúc Pháp cổ.',
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

export interface CoverData {
  kicker: string;
  title: string;
  date: string;
}

export function getCoverContent(lang: SupportedLanguage = 'vi'): CoverData {
  switch (lang) {
    case 'en':
      return {
        kicker: 'BEAUTY OF THE LAND AND PEOPLE',
        title: 'HO CHI MINH CITY',
        date: 'Ho Chi Minh City, 10/2026',
      };
    case 'ja':
      return {
        kicker: '美しい国土と人々',
        title: 'ホーチミン市',
        date: 'ホーチミン市、2026年10月',
      };
    case 'ko':
      return {
        kicker: '아름다운 국토와 사람들',
        title: '호찌민시',
        date: '호찌민시, 2026년 10월',
      };
    default:
      return {
        kicker: 'VẺ ĐẸP ĐẤT NƯỚC VÀ CON NGƯỜI',
        title: 'THÀNH PHỐ HỒ CHÍ MINH',
        date: 'TP. Hồ Chí Minh, 10/2026',
      };
  }
}

export interface IntroData {
  title: string;
  paragraph: string;
  photosLeft: { hue: number; caption: string; src: string; link: string }[];
  photoRight: { hue: number; caption: string; src: string; link: string };
}

export function getIntroContent(lang: SupportedLanguage = 'vi'): IntroData {
  switch (lang) {
    case 'en':
      return {
        title: 'Overview',
        paragraph:
          'Saigon - Ho Chi Minh City is Vietnam\'s largest metropolis, a vibrant crossroads of Vietnamese, Chinese, Khmer cultures, and French colonial heritage. Within a single street, a century-old pagoda stands steps away from a red-brick cathedral and modern skyscrapers.',
        photosLeft: [
          { hue: 12, caption: 'Nguyen Hue Walking Street', src: '/images/home/intro-nguyen-hue.jpg', link: '/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y' },
          { hue: 30, caption: 'Rush hour traffic flow', src: '/images/home/intro-traffic.jpg', link: '/tin-tuc/hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan' },
          { hue: 45, caption: 'Sidewalk coffee stall', src: '/images/home/intro-cafe.jpg', link: '/tin-tuc/ca-phe-vot-sai-gon-nep-song-dong-lai' },
        ],
        photoRight: { hue: 8, caption: 'Notre Dame Cathedral', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/tin-tuc/gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua' },
      };
    case 'ja':
      return {
        title: 'サイゴンのご紹介',
        paragraph:
          'サイゴン（ホーチミン市）はベトナム最大の都市であり、ベトナム、中国、クメール、そしてフランス建築の伝統が美しく調和しています。同じ通りの中に、百年の歴史を持つ寺院、赤レンガの大聖堂、そして超高層ビルが共存しています。',
        photosLeft: [
          { hue: 12, caption: 'グエンフエ歩行者天国', src: '/images/home/intro-nguyen-hue.jpg', link: '/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y' },
          { hue: 30, caption: 'ラッシュアワーのバイク', src: '/images/home/intro-traffic.jpg', link: '/tin-tuc/hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan' },
          { hue: 45, caption: '路上のカフェ', src: '/images/home/intro-cafe.jpg', link: '/tin-tuc/ca-phe-vot-sai-gon-nep-song-dong-lai' },
        ],
        photoRight: { hue: 8, caption: 'サイゴン大聖堂', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/tin-tuc/gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua' },
      };
    case 'ko':
      return {
        title: '도시 소개',
        paragraph:
          '사이공(호찌민시)은 베트남 최대의 도시로, 베트남, 화교, 크메르 문화와 프랑스 건축 양식이 조화롭게 어우러진 곳입니다. 하나의 거리 안에서 백 년 역사의 고찰과 붉은 벽돌 성당, 현대적인 고층 빌딩을 함께 만날 수 있습니다.',
        photosLeft: [
          { hue: 12, caption: '응우옌후에 보행자 거리', src: '/images/home/intro-nguyen-hue.jpg', link: '/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y' },
          { hue: 30, caption: '출퇴근 시간 오토바이 행렬', src: '/images/home/intro-traffic.jpg', link: '/tin-tuc/hem-sai-gon-bao-tang-song-cua-doi-song-thi-dan' },
          { hue: 45, caption: '길거리 카페', src: '/images/home/intro-cafe.jpg', link: '/tin-tuc/ca-phe-vot-sai-gon-nep-song-dong-lai' },
        ],
        photoRight: { hue: 8, caption: '노트르담 대성당', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/tin-tuc/gach-do-nha-tho-duc-ba-dieu-that-va-noi-qua' },
      };
    default:
      return introContent;
  }
}

export interface CostumeData {
  title: string;
  paragraph: string;
  photoBig: { hue: number; caption: string; src: string; link: string };
  photosTwo: { hue: number; caption: string; src: string; link: string }[];
}

export function getCostumeContent(lang: SupportedLanguage = 'vi'): CostumeData {
  switch (lang) {
    case 'en':
      return {
        title: 'Traditional Attire',
        paragraph:
          'The Ao Dai and Ao Ba Ba are enduring symbols of Saigon\'s heritage. While the elegant Ao Dai graces festive celebrations and special occasions, the Ao Ba Ba embodies the humble, relaxed spirit of the southern waterways.',
        photoBig: { hue: 25, caption: 'Ao Dai', src: '/images/home/costume-ao-dai.jpg', link: '/tin-tuc/ao-dai-qua-hon-100-nam' },
        photosTwo: [
          { hue: 15, caption: 'Ao Dai', src: '/images/home/costume-ao-dai-2.jpg', link: '/tin-tuc/ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam' },
          { hue: 38, caption: 'Ao Ba Ba', src: '/images/home/costume-ao-ba-ba.jpg', link: '/tin-tuc/chiec-ao-ba-ba-va-van-hoa-nam-bo' },
        ],
      };
    case 'ja':
      return {
        title: '伝統衣装',
        paragraph:
          'アオザイとアオババは、サイゴンの人々に親しまれてきた伝統衣装です。優美なアオザイは祝祭や特別な儀式で着用され、アオババは南部水郷地帯の素朴で心地よい暮らしを象徴しています。',
        photoBig: { hue: 25, caption: 'アオザイ', src: '/images/home/costume-ao-dai.jpg', link: '/tin-tuc/ao-dai-qua-hon-100-nam' },
        photosTwo: [
          { hue: 15, caption: 'アオザイ', src: '/images/home/costume-ao-dai-2.jpg', link: '/tin-tuc/ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam' },
          { hue: 38, caption: 'アオババ', src: '/images/home/costume-ao-ba-ba.jpg', link: '/tin-tuc/chiec-ao-ba-ba-va-van-hoa-nam-bo' },
        ],
      };
    case 'ko':
      return {
        title: '전통 의상',
        paragraph:
          '아오자이와 아오바바는 사이공 사람들에게 가장 친숙한 전통 복식입니다. 우아한 아오자이는 명절과 특별한 행사에 주로 입으며, 아오바바는 남부 수변 지역의 소박하고 편안한 일상과 함께합니다.',
        photoBig: { hue: 25, caption: '아오자이', src: '/images/home/costume-ao-dai.jpg', link: '/tin-tuc/ao-dai-qua-hon-100-nam' },
        photosTwo: [
          { hue: 15, caption: '아오자이', src: '/images/home/costume-ao-dai-2.jpg', link: '/tin-tuc/ao-dai-ao-ba-ba-hon-cot-trang-phuc-phuong-nam' },
          { hue: 38, caption: '아오바바', src: '/images/home/costume-ao-ba-ba.jpg', link: '/tin-tuc/chiec-ao-ba-ba-va-van-hoa-nam-bo' },
        ],
      };
    default:
      return costumeContent;
  }
}

export interface TourismTeaserData {
  title: string;
  paragraph: string;
  cta: string;
  photos: { hue: number; caption: string; src: string; link: string }[];
}

export function getTourismTeaserContent(lang: SupportedLanguage = 'vi'): TourismTeaserData {
  switch (lang) {
    case 'en':
      return {
        title: 'Explore Saigon',
        paragraph:
          'Every landmark tells its own unique story: Independence Palace echoing history, Ben Thanh Market bustling with daily life, Saigon Central Post Office holding memories of handwritten letters, and Notre Dame Cathedral preserving French colonial architecture.',
        cta: 'Explore',
        photos: [
          { hue: 10, caption: 'Independence Palace', src: '/images/pois/dinh-doc-lap.jpg', link: '/diem-du-lich/dinh-doc-lap' },
          { hue: 30, caption: 'Ben Thanh Market', src: '/images/pois/cho-ben-thanh.jpg', link: '/diem-du-lich/cho-ben-thanh' },
          { hue: 16, caption: 'Saigon Central Post Office', src: '/images/pois/buu-dien-trung-tam.jpg', link: '/diem-du-lich/buu-dien-trung-tam' },
          { hue: 42, caption: 'Notre Dame Cathedral', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/diem-du-lich/nha-tho-duc-ba' },
        ],
      };
    case 'ja':
      return {
        title: 'サイゴン観光名所',
        paragraph:
          '歴史を刻む統一会堂、活気ある日常のベンタイン市場、昔の手紙の記憶を留めるサイゴン中央郵便局、そして優美なフランス建築のサイゴン大聖堂など、それぞれのスポットが独自の物語を伝えています。',
        cta: '探訪する',
        photos: [
          { hue: 10, caption: '統一会堂', src: '/images/pois/dinh-doc-lap.jpg', link: '/diem-du-lich/dinh-doc-lap' },
          { hue: 30, caption: 'ベンタイン市場', src: '/images/pois/cho-ben-thanh.jpg', link: '/diem-du-lich/cho-ben-thanh' },
          { hue: 16, caption: 'サイゴン中央郵便局', src: '/images/pois/buu-dien-trung-tam.jpg', link: '/diem-du-lich/buu-dien-trung-tam' },
          { hue: 42, caption: 'サイゴン大聖堂', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/diem-du-lich/nha-tho-duc-ba' },
        ],
      };
    case 'ko':
      return {
        title: '사이공 명소 탐방',
        paragraph:
          '역사의 숨결이 깃든 통일궁, 활기찬 일상이 살아있는 벤탄 시장, 오랜 손편지의 기억을 간직한 사이공 중앙우체국, 프랑스 고전 건축미를 지닌 노트르담 대성당까지 각 명소마다 고유한 이야기를 전합니다.',
        cta: '탐색하기',
        photos: [
          { hue: 10, caption: '통일궁', src: '/images/pois/dinh-doc-lap.jpg', link: '/diem-du-lich/dinh-doc-lap' },
          { hue: 30, caption: '벤탄 시장', src: '/images/pois/cho-ben-thanh.jpg', link: '/diem-du-lich/cho-ben-thanh' },
          { hue: 16, caption: '사이공 중앙우체국', src: '/images/pois/buu-dien-trung-tam.jpg', link: '/diem-du-lich/buu-dien-trung-tam' },
          { hue: 42, caption: '노트르담 대성당', src: '/images/pois/nha-tho-duc-ba.jpg', link: '/diem-du-lich/nha-tho-duc-ba' },
        ],
      };
    default:
      return {
        title: tourismTeaserContent.title,
        paragraph: tourismTeaserContent.paragraph,
        cta: 'Khám phá',
        photos: tourismTeaserContent.photos,
      };
  }
}

export interface FooterData {
  tagline: string;
  linksHeading: string;
  contactHeading: string;
  home: string;
  attractions: string;
  souvenirs: string;
  news: string;
  contact: string;
  copyright: string;
  privacyPolicy: string;
  backToTop: string;
}

export function getFooterContent(lang: SupportedLanguage = 'vi'): FooterData {
  switch (lang) {
    case 'en':
      return {
        tagline: 'Audio storytelling across Saigon landmarks and cultural souvenirs.',
        linksHeading: 'Quick Links',
        contactHeading: 'Contact',
        home: 'Home',
        attractions: 'Attractions',
        souvenirs: 'Souvenirs',
        news: 'News',
        contact: 'Contact',
        copyright: '© 2026 Echora, Saigon Heritage Tourism Audio Guide. Demo version.',
        privacyPolicy: 'Privacy Policy',
        backToTop: 'Back to top',
      };
    case 'ja':
      return {
        tagline: 'サイゴンの観光名所とお土産の物語を伝えるオーディオガイド。',
        linksHeading: 'リンク',
        contactHeading: 'お問い合わせ',
        home: 'ホーム',
        attractions: '観光名所',
        souvenirs: 'お土産',
        news: 'ニュース',
        contact: 'お問い合わせ',
        copyright: '© 2026 Echora, ホーチミン市観光文化オーディオガイド。デモ版。',
        privacyPolicy: 'プライバシーポリシー',
        backToTop: 'ページ上部へ',
      };
    case 'ko':
      return {
        tagline: '사이공의 주요 명소와 문화 기념품에 깃든 이야기를 들려드립니다.',
        linksHeading: '바로가기',
        contactHeading: '문의처',
        home: '홈',
        attractions: '관광 명소',
        souvenirs: '기념품',
        news: '뉴스',
        contact: '문의하기',
        copyright: '© 2026 Echora, 호찌민시 관광 문화 오디오 가이드. 데모 버전.',
        privacyPolicy: '개인정보 처리방침',
        backToTop: '맨 위로 이동',
      };
    default:
      return {
        tagline: 'Nghe kể chuyện Sài Gòn qua từng điểm đến và món quà lưu niệm.',
        linksHeading: 'Liên kết',
        contactHeading: 'Liên hệ',
        home: 'Trang chủ',
        attractions: 'Điểm du lịch',
        souvenirs: 'Quà lưu niệm',
        news: 'Tin tức',
        contact: 'Liên hệ',
        copyright: footerContent.copyright,
        privacyPolicy: 'Chính sách quyền riêng tư',
        backToTop: footerContent.backToTop,
      };
  }
}
