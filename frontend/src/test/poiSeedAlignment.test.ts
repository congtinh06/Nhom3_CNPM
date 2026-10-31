import { describe, it, expect } from 'vitest';
import nearbyPoisData from '../content/nearbyPois.json';
import { SOUVENIR_SPOTS } from '../content/souvenirSpots';
import { PREMIUM_DESTINATION_VIDEOS } from '../content/premiumVideos';

/**
 * T2.5 Seed vs Frontend Alignment Contract Test
 * 
 * Verifies that the POIs in the backend seed (R__seed_demo.sql) match
 * the POIs presented across the frontend (slug, name, coordinates, radius, order).
 * If any slug differs or is missing between the sources, this test fails.
 */

// Source of truth from R__seed_demo.sql
const BACKEND_SEED_POIS = [
  {
    code: 'POI_DINH_DOC_LAP_01',
    slug: 'dinh-doc-lap',
    nameVi: 'Dinh Độc Lập',
    nameEn: 'Independence Palace',
    lat: 10.77695,
    lng: 106.69537,
    triggerRadius: 50,
    stopOrder: 1,
  },
  {
    code: 'POI_DUC_BA_01',
    slug: 'nha-tho-duc-ba',
    nameVi: 'Nhà thờ Đức Bà Sài Gòn',
    nameEn: 'Notre Dame Cathedral of Saigon',
    lat: 10.77972,
    lng: 106.69908,
    triggerRadius: 60,
    stopOrder: 2,
  },
  {
    code: 'POI_BUU_DIEN_01',
    slug: 'buu-dien-trung-tam',
    nameVi: 'Bưu điện Trung tâm Sài Gòn',
    nameEn: 'Saigon Central Post Office',
    lat: 10.77995,
    lng: 106.69971,
    triggerRadius: 40,
    stopOrder: 3,
  },
  {
    code: 'POI_BEN_THANH_01',
    slug: 'cho-ben-thanh',
    nameVi: 'Chợ Bến Thành',
    nameEn: 'Ben Thanh Market',
    lat: 10.77232,
    lng: 106.69811,
    triggerRadius: 55,
    stopOrder: 4,
  },
  {
    code: 'POI_BAO_TANG_CHUNG_TICH_01',
    slug: 'bao-tang-chung-tich-chien-tranh',
    nameVi: 'Bảo tàng Chứng tích Chiến tranh',
    nameEn: 'War Remnants Museum',
    lat: 10.77926,
    lng: 106.69247,
    triggerRadius: 45,
    stopOrder: 5,
  },
  {
    code: 'POI_THIEN_HAU_01',
    slug: 'chua-ba-thien-hau',
    nameVi: 'Chùa Bà Thiên Hậu',
    nameEn: 'Ba Thien Hau Pagoda',
    lat: 10.7538,
    lng: 106.6601,
    triggerRadius: 35,
    stopOrder: 1, // Route 2 (Cho Lon) stop 1
  },
  {
    code: 'POI_CAU_BA_SON_01',
    slug: 'cau-ba-son',
    nameVi: 'Cầu Ba Son',
    nameEn: 'Ba Son Bridge',
    lat: 10.7818,
    lng: 106.7092,
    triggerRadius: 50,
    stopOrder: 1, // Route 4 (Ba Son) stop 1
  },
];

describe('T2.5 POI Seed vs Frontend Alignment Contract', () => {
  it('backend seed contains exactly 7 POIs', () => {
    expect(BACKEND_SEED_POIS).toHaveLength(7);
  });

  it('all 7 backend seed slugs exist in frontend souvenir spots', () => {
    const frontendSlugs = SOUVENIR_SPOTS.map((s) => s.slug);
    for (const seedPoi of BACKEND_SEED_POIS) {
      expect(
        frontendSlugs,
        `Backend slug ${seedPoi.slug} missing from SOUVENIR_SPOTS`
      ).toContain(seedPoi.slug);
    }
    expect(frontendSlugs).toHaveLength(7);
  });

  it('all 7 backend seed slugs exist in frontend premium destination videos', () => {
    const videoSlugs = PREMIUM_DESTINATION_VIDEOS.map((v) => v.slug);
    for (const seedPoi of BACKEND_SEED_POIS) {
      expect(
        videoSlugs,
        `Backend slug ${seedPoi.slug} missing from PREMIUM_DESTINATION_VIDEOS`
      ).toContain(seedPoi.slug);
    }
    expect(videoSlugs).toHaveLength(7);
  });

  it('nearby walking tour fixtures match backend seed for the 5 historic core stops', () => {
    const coreSeedPois = BACKEND_SEED_POIS.slice(0, 5);

    expect(nearbyPoisData).toHaveLength(5);
    for (let i = 0; i < coreSeedPois.length; i++) {
      const seed = coreSeedPois[i]!;
      const fe = nearbyPoisData[i]!;
      expect(fe.slug).toBe(seed.slug);
      expect(fe.stopOrder).toBe(seed.stopOrder);
      expect(fe.lat).toBeCloseTo(seed.lat, 4);
      expect(fe.lng).toBeCloseTo(seed.lng, 4);
      expect(fe.triggerRadius).toBe(seed.triggerRadius);
    }
  });

  it('fails if any slug differs between sources', () => {
    const seedSlugs = new Set(BACKEND_SEED_POIS.map((p) => p.slug));
    const souvenirSlugs = new Set(SOUVENIR_SPOTS.map((s) => s.slug));
    const videoSlugs = new Set(PREMIUM_DESTINATION_VIDEOS.map((v) => v.slug));

    // Contract: seedSlugs and souvenirSlugs must be identical sets
    expect(seedSlugs).toEqual(souvenirSlugs);
    expect(seedSlugs).toEqual(videoSlugs);
  });
});
