import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';
import { normalizeApiError } from '../../api/errors';
import { samplePlaces, sampleGroups } from '../../content/samplePlaces';
import { matchesSearch } from '../../content/searchUtils';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { Category, PoiDetail, PoiSummary, SupportedLanguage, Zone } from '../../types';
import { PlaceCard } from './PlaceCard';
import { PlaceDetailDialog } from './PlaceDetailDialog';
import { PlacesToolbar } from './PlacesToolbar';

export const PlacesSection: React.FC = () => {
  const isSampleMode = import.meta.env.VITE_USE_SAMPLE_DATA === 'true';

  const [lang, setLang] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('sv:lang');
      if (saved && ['vi', 'en', 'ja', 'ko'].includes(saved)) {
        return saved as SupportedLanguage;
      }
    } catch {
      // Ignore
    }
    return 'vi';
  });

  const handleLangChange = useCallback((newLang: SupportedLanguage) => {
    setLang(newLang);
    try {
      localStorage.setItem('sv:lang', newLang);
    } catch {
      // Ignore
    }
  }, []);

  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [detailModalPoiId, setDetailModalPoiId] = useState<number | null>(null);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  const fetchData = useCallback(() => {
    if (isSampleMode) {
      const syntheticPois: PoiSummary[] = samplePlaces.map((sp) => ({
        id: sp.id,
        code: `SAMPLE_${sp.id}`,
        qrToken: `sample_qr_${sp.id}`,
        name: sp.name,
        latitude: 10.77,
        longitude: 106.69,
        triggerRadiusMeters: 50,
        address: sp.description,
        thumbnailUrl: null,
        zoneId: 1,
        zoneCode: 'D1',
        categoryCode: sp.group,
        categoryNameVi: sampleGroups[sp.group],
      }));
      setPois(syntheticPois);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);
    setErrorMessage(null);

    Promise.all([
      api.getPois(undefined, abortController.signal),
      api.getCategories(abortController.signal),
      api.getZones(abortController.signal),
    ])
      .then(([poisData, categoriesData, zonesData]) => {
        setPois(poisData);
        setCategories(categoriesData);
        setZones(zonesData);
      })
      .catch((err: unknown) => {
        const norm = normalizeApiError(err);
        if (!norm.isAborted) {
          setErrorMessage(norm.message);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [isSampleMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const zoneMap = useMemo(() => {
    const map = new Map<number, string>();
    zones.forEach((z) => map.set(z.id, z.name));
    return map;
  }, [zones]);

  const filterChips = useMemo(() => {
    if (isSampleMode) {
      return Object.entries(sampleGroups).map(([k, label]) => ({
        key: k,
        label,
      }));
    }

    const chips = [{ key: 'all', label: 'TẤT CẢ' }];
    categories.forEach((cat) => {
      chips.push({ key: cat.code, label: cat.nameVi.toUpperCase() });
    });
    chips.push({ key: 'fav', label: 'YÊU THÍCH' });
    return chips;
  }, [isSampleMode, categories]);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      const inFav = favorites.includes(poi.id);
      let matchCategory = true;

      if (selectedCategory === 'fav') {
        matchCategory = inFav;
      } else if (selectedCategory !== 'all') {
        matchCategory = poi.categoryCode === selectedCategory;
      }

      if (!matchCategory) return false;

      const zoneName = zoneMap.get(poi.zoneId) || '';
      const textToSearch = `${poi.name} ${poi.address || ''} ${poi.categoryNameVi || ''} ${zoneName}`;
      return matchesSearch(textToSearch, searchQuery);
    });
  }, [pois, selectedCategory, favorites, zoneMap, searchQuery]);

  useEffect(() => {
    const runCardsAnim = (window as unknown as { __cards?: () => void }).__cards;
    if (typeof runCardsAnim === 'function') {
      runCardsAnim();
    }
  }, [filteredPois, selectedCategory, searchQuery, lang]);

  const selectedSamplePlace = useMemo(() => {
    if (!isSampleMode || !detailModalPoiId) return null;
    return samplePlaces.find((s) => s.id === detailModalPoiId) || null;
  }, [isSampleMode, detailModalPoiId]);

  const handleToggleCardAudio = (poi: PoiSummary) => {
    const zoneName = zoneMap.get(poi.zoneId) || '';
    playAudio({
      poiId: poi.id,
      title: poi.name,
      textToSpeak: poi.address ? `${poi.address}. Khu vực ${zoneName}.` : `Khu vực ${zoneName}.`,
      lang,
    });
  };

  const handleToggleDetailAudio = (detail: PoiDetail) => {
    playAudio({
      poiId: detail.id,
      audioUrl: detail.audioUrl,
      audioStatus: detail.audioStatus,
      title: detail.title || detail.name,
      textToSpeak: detail.description || detail.summary,
      lang,
    });
  };

  const handleCloseDetail = () => {
    setDetailModalPoiId(null);
    stopAudio();
  };

  return (
    <section className="s sp" id="diem-den">
      <h2>Điểm du lịch</h2>

      <PlacesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={filterChips}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        lang={lang}
        onLangChange={handleLangChange}
      />

      {loading && <div className="cn">Đang tải danh sách điểm du lịch...</div>}

      {errorMessage && (
        <div className="cn" style={{ color: '#c0392b' }}>
          {errorMessage}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="tb" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {!loading && !errorMessage && (
        <>
          <div className="cn" id="cn" role="status" aria-live="polite">
            {filteredPois.length
              ? `${filteredPois.length} địa điểm`
              : 'Không có địa điểm phù hợp. Thử từ khóa hoặc nhóm khác.'}
          </div>

          <div className="cg" id="cg">
            {filteredPois.map((poi, idx) => {
              const zoneName = zoneMap.get(poi.zoneId) || poi.zoneCode;
              const sample = isSampleMode ? samplePlaces.find((s) => s.id === poi.id) : null;
              const desc = sample ? sample.description : poi.address || `Khu vực: ${zoneName}`;
              const hue = sample ? sample.hue : [16, 22, 8, 38, 28, 16, 45, 205][idx % 8] ?? 20;
              const catLabel = sample
                ? sampleGroups[sample.group] || 'ĐIỂM ĐẾN'
                : poi.categoryNameVi || 'ĐIỂM ĐẾN';

              return (
                <PlaceCard
                  key={poi.id}
                  poi={poi}
                  hue={hue}
                  index={idx}
                  categoryLabel={catLabel}
                  descriptionText={desc}
                  isFavorite={isFavorite(poi.id)}
                  isPlaying={isPlaying(poi.id)}
                  onOpenDetail={() => setDetailModalPoiId(poi.id)}
                  onToggleAudio={() => handleToggleCardAudio(poi)}
                  onToggleFavorite={() => toggleFavorite(poi.id)}
                />
              );
            })}
          </div>
        </>
      )}

      <PlaceDetailDialog
        isOpen={detailModalPoiId !== null}
        onClose={handleCloseDetail}
        poiId={detailModalPoiId}
        lang={lang}
        onLangChange={handleLangChange}
        isPlaying={detailModalPoiId !== null ? isPlaying(detailModalPoiId) : false}
        onToggleAudio={handleToggleDetailAudio}
        sampleTip={selectedSamplePlace ? selectedSamplePlace.tip : undefined}
        sampleDetail={
          selectedSamplePlace
            ? {
                name: selectedSamplePlace.name,
                description: selectedSamplePlace.description,
                tip: selectedSamplePlace.tip,
              }
            : undefined
        }
      />
    </section>
  );
};
