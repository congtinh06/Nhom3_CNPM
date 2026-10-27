export interface PremiumDestinationVideo {
  slug: string;
  name: string;
  videoId: string;
  title: string;
  channel: string;
  sourceUrl: string;
}

export const PREMIUM_DESTINATION_VIDEOS: PremiumDestinationVideo[] = [
  {
    slug: 'buu-dien-trung-tam',
    name: 'Bưu điện Trung tâm Sài Gòn',
    videoId: 'i-85hRDWfcs',
    title:
      'Saigon Central Post Office | 130-Year-Old Post Office in Ho Chi Minh City',
    channel: 'Travel Vibes',
    sourceUrl: 'https://www.youtube.com/watch?v=i-85hRDWfcs',
  },
  {
    slug: 'nha-tho-duc-ba',
    name: 'Nhà thờ Đức Bà Sài Gòn',
    videoId: '3lGfz1l_8vM',
    title:
      'Trùng tu Nhà thờ Đức Bà Sài Gòn: Đã làm gì trong năm 2025, dự kiến 2026',
    channel: 'Tổng Giáo phận Sài Gòn',
    sourceUrl: 'https://www.youtube.com/watch?v=3lGfz1l_8vM',
  },
  {
    slug: 'cho-ben-thanh',
    name: 'Chợ Bến Thành',
    videoId: 'cUFUu5CCj5Q',
    title:
      'Khám Phá Chợ Bến Thành - ngôi chợ 100 năm, thiên đường ẩm thực và mua sắm',
    channel: 'Đi Đâu Ăn Gì',
    sourceUrl: 'https://www.youtube.com/watch?v=cUFUu5CCj5Q',
  },
  {
    slug: 'chua-ba-thien-hau',
    name: 'Chùa Bà Thiên Hậu (Hội quán Tuệ Thành)',
    videoId: '8pT3xf9g2Cs',
    title:
      'Chùa Bà Thiên Hậu Quận 5 | Ngôi chùa cổ nhất người Hoa tại Sài Gòn',
    channel: 'Võ Thanh Mẫn Official',
    sourceUrl: 'https://www.youtube.com/watch?v=8pT3xf9g2Cs',
  },
  {
    slug: 'cau-ba-son',
    name: 'Cầu Ba Son',
    videoId: 'V6vEcsabVqk',
    title: 'Cầu Ba Son: Biểu tượng mới lung linh của TP.HCM về đêm',
    channel: 'HTV Tin Tức',
    sourceUrl: 'https://www.youtube.com/watch?v=V6vEcsabVqk',
  },
  {
    slug: 'bao-tang-chung-tich-chien-tranh',
    name: 'Bảo tàng Chứng tích Chiến tranh',
    videoId: 't7b0-QrD6PU',
    title: 'Bảo tàng Chứng tích Chiến tranh - Nơi lịch sử lên tiếng vì hòa bình',
    channel: 'HTV Chuyên đề',
    sourceUrl: 'https://www.youtube.com/watch?v=t7b0-QrD6PU',
  },
  {
    slug: 'dinh-doc-lap',
    name: 'Dinh Độc Lập',
    videoId: 'eZ3wSmu82sk',
    title: 'Dinh Độc Lập - Biểu tượng chủ quyền, thống nhất đất nước',
    channel: 'THVL 24News',
    sourceUrl: 'https://www.youtube.com/watch?v=eZ3wSmu82sk',
  },
];

export function getPremiumVideo(slug?: string | null): PremiumDestinationVideo | null {
  if (!slug) return null;
  return PREMIUM_DESTINATION_VIDEOS.find((video) => video.slug === slug) ?? null;
}

export function youtubePosterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}
