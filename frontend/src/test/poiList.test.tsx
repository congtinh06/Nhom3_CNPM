import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoiList, SortedPoiItem } from '../components/nearby/PoiList';
import { GeoPoi } from '../pages/NearbyPage';

function makePoi(id: string, name: string): GeoPoi {
  return {
    id,
    numericId: Number(id.replace(/\D/g, '')) || null,
    name: { vi: name, en: name, ja: name, ko: name },
    lat: 0,
    lng: 0,
    triggerRadius: 50,
    category: { vi: 'Di tich', en: 'Heritage', ja: '遺跡', ko: '유적' },
    image: '',
    audio: { vi: '', en: '', ja: '', ko: '' },
    transcript: { vi: '', en: '', ja: '', ko: '' },
  };
}

function makeItem(poi: GeoPoi, index: number): SortedPoiItem {
  return { poi, originalIndex: index, stopNumber: index + 1, dist: null };
}

describe('PoiList premium lock badge', () => {
  it('shows a Premium badge only for locked foreign-language POIs', () => {
    const locked = makePoi('poi-1', 'Ben Thanh Market');
    const unlocked = makePoi('poi-2', 'Independence Palace');

    render(
      <PoiList
        sortedPois={[makeItem(locked, 0), makeItem(unlocked, 1)]}
        selectedPoiId={locked.id}
        activePoiId={locked.id}
        currentLang="en"
        lockedPoiIds={[locked.id]}
        listTitle="7 Audio Tour Spots"
        sortNoteText="Tour order"
        onSelectPoi={() => undefined}
        getPoiName={(poi) => poi.name.en}
        getPoiCategory={(poi) => poi.category.en}
      />
    );

    expect(
      screen.getByLabelText('Premium required to unlock foreign-language content')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Premium')).toHaveLength(1);
  });
});
