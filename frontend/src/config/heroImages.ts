export interface HeroImageConfig {
  src: string;
  srcMobile: string;
  position: string;
  credit: string;
  subject: string;
  expectedSize: string;
}

export type HeroPageKey = 'diemDuLich' | 'tinTuc' | 'lienHe';

/**
 * Single source of truth for Hero images and credits across all pages.
 * Uses high-resolution Pinterest & editorial photography of Saigon.
 */
export const HERO_CONFIG: Record<HeroPageKey, HeroImageConfig> = {
  diemDuLich: {
    src: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=2400&q=80',
    srcMobile: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    position: 'center right',
    credit: 'Saigon Heritage',
    subject: 'Notre-Dame Cathedral & Central Post Office area in warm golden light',
    expectedSize: '2400x1200 high-res landscape',
  },
  tinTuc: {
    src: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=2400&q=80',
    srcMobile: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=1200&q=80',
    position: 'center right',
    credit: 'Saigon Editorial Photography',
    subject: 'Saigon heritage street life & classic architecture',
    expectedSize: '2400x1200 high-res landscape',
  },
  lienHe: {
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2400&q=80',
    srcMobile: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    position: 'center right',
    credit: 'Echora Studio',
    subject: 'Classic architecture and vibrant Saigon streetscape',
    expectedSize: '2400x1200 high-res landscape',
  },
};
