import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { NearbyResponse, Poi } from '../types/poi';
import { mockPois } from '../api/poiMock';
import { GuideMap } from '../components/guide/GuideMap';
import { AtmDetailModal } from '../components/guide/AtmDetailModal';
import { IncidentReportModal } from '../components/guide/IncidentReportModal';
import { useTranslation } from '../locales/i18n';
import { usePreferences } from '../context/PreferencesContext';
import { useSpeech } from '../hooks/useSpeech';
import {
  MapPin,
  Navigation,
  Volume2,
  VolumeX,
  CreditCard,
  Search,
  AlertTriangle,
  Compass,
  Clock,
  UserCheck,
  Filter,
  MoreHorizontal,
  X,
  Map,
  List,
} from 'lucide-react';

const BANK_CHIPS = [
  { id: '', label: 'Tất cả' },
  { id: 'BIDV', label: 'BIDV' },
  { id: 'Vietcombank', label: 'Vietcombank' },
  { id: 'Techcombank', label: 'Techcombank' },
  { id: 'VietinBank', label: 'VietinBank' },
  { id: 'Agribank', label: 'Agribank' },
  { id: 'MB Bank', label: 'MB Bank' },
  { id: 'ACB', label: 'ACB' },
  { id: 'Sacombank', label: 'Sacombank' },
];

const HCMC_LANDMARKS = [
  { name: 'Phố đi bộ Nguyễn Huệ, Quận 1', lat: 10.7743, lng: 106.7032 },
  { name: 'Chợ Bến Thành, Quận 1', lat: 10.7720, lng: 106.6983 },
  { name: 'Phố Tây Bùi Viện, Quận 1', lat: 10.7674, lng: 106.6934 },
  { name: 'Nhà thờ Đức Bà, Quận 1', lat: 10.7798, lng: 106.6990 },
  { name: 'Hồ Con Rùa, Quận 3', lat: 10.7828, lng: 106.6961 },
  { name: 'Chợ Lớn / Chợ Bình Tây, Quận 5', lat: 10.7554, lng: 106.6652 },
  { name: 'Chợ An Đông, Quận 5', lat: 10.7570, lng: 106.6690 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const GuidePage: React.FC = () => {
  const { t, language } = useTranslation();
  const { autoRead } = usePreferences();
  const location = useLocation();

  // Show demo buttons only if ?demo=1 is in URL
  const showDemo = location.search.includes('demo=1') || import.meta.env.VITE_SHOW_DEMO === 'true';

  // Location state (Default: Nguyen Hue, D1)
  const [lat, setLat] = useState<number | null>(10.7743);
  const [lng, setLng] = useState<number | null>(106.7032);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Search Bar
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Bank & Facility Filters
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [filterVisa, setFilterVisa] = useState<boolean>(false); // International first for tourists
  const [filterCrm, setFilterCrm] = useState<boolean>(false);
  const [filterGuard, setFilterGuard] = useState<boolean>(false);
  const [filter247, setFilter247] = useState<boolean>(false);
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);

  // Active view on mobile: 'list' or 'map'
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // Active action menu card ID
  const [activeMenuPoiId, setActiveMenuPoiId] = useState<string | number | null>(null);

  // Nearby results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nearbyResult, setNearbyResult] = useState<NearbyResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals & Active Route
  const [selectedPoiForDetail, setSelectedPoiForDetail] = useState<Poi | null>(null);
  const [selectedPoiForReport, setSelectedPoiForReport] = useState<Poi | null>(null);
  const [activeRouteTarget, setActiveRouteTarget] = useState<Poi | null>(null);
  const [incidentCounts, setIncidentCounts] = useState<Record<string | number, number>>({ 3: 3 });

  // TTS Speech hook
  const { isSpeaking, speakText, stopSpeaking } = useSpeech(language);
  const lastSpokenPoiIdRef = useRef<number | string | null>(null);

  // Filter count
  const activeFilterCount = (filterVisa ? 1 : 0) + (filterCrm ? 1 : 0) + (filterGuard ? 1 : 0) + (filter247 ? 1 : 0);

  // Fetch POI Data
  const fetchNearby = useCallback(
    async (targetLat: number, targetLng: number, lang: string, triggerSpeech = false, bankFilter?: string) => {
      setIsLoading(true);
      setApiError(null);
      const bankToQuery = bankFilter !== undefined ? bankFilter : selectedBank;

      try {
        const result = await api.getNearby({
          lat: targetLat,
          lng: targetLng,
          lang,
          radius: 1500,
          bank: bankToQuery || undefined,
        });

        setNearbyResult(result);

        if (result && result.poi) {
          if (triggerSpeech || (autoRead && lastSpokenPoiIdRef.current !== result.poi.id)) {
            lastSpokenPoiIdRef.current = result.poi.id;
            speakText(result.narration.text, result.narration.ttsLang);
          }
        }
      } catch (err: any) {
        setApiError(err?.message || 'Lỗi kết nối khi quét tìm điểm ngân hàng.');
        setNearbyResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [autoRead, selectedBank, speakText]
  );

  // Initial load
  useEffect(() => {
    fetchNearby(10.7743, 106.7032, language, false, selectedBank);
    return () => {
      stopSpeaking();
    };
  }, []);

  // Update language change
  useEffect(() => {
    if (lat !== null && lng !== null) {
      fetchNearby(lat, lng, language, false, selectedBank);
    }
  }, [language]);

  // Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        setIsLocating(false);
        fetchNearby(userLat, userLng, language, true, selectedBank);
      },
      (err) => {
        setIsLocating(false);
        setGeoError(`Không thể lấy vị trí (${err.message}).`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectDemo = (demoLat: number, demoLng: number) => {
    setLat(demoLat);
    setLng(demoLng);
    setGeoError(null);
    setActiveRouteTarget(null);
    fetchNearby(demoLat, demoLng, language, true, selectedBank);
  };

  // Landmark search
  const filteredLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return HCMC_LANDMARKS;
    const q = searchQuery.toLowerCase();
    return HCMC_LANDMARKS.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelectLandmark = (item: { name: string; lat: number; lng: number }) => {
    setSearchQuery(item.name);
    setShowSearchDropdown(false);
    handleSelectDemo(item.lat, item.lng);
  };

  // Filter bank
  const handleSelectBank = (bankId: string) => {
    setSelectedBank(bankId);
    if (lat !== null && lng !== null) {
      fetchNearby(lat, lng, language, false, bankId);
    }
  };

  const handleSubmitIncident = (poiId: number | string) => {
    setIncidentCounts((prev) => ({
      ...prev,
      [poiId]: (prev[poiId] || 0) + 1,
    }));
  };

  // POI calculation & sorting
  const basePois: Poi[] = useMemo(() => {
    if (nearbyResult?.nearbyPois && nearbyResult.nearbyPois.length > 0) {
      return nearbyResult.nearbyPois.map((item) => {
        const count = incidentCounts[item.poi.id] || item.poi.incidentReportsCount || 0;
        return {
          ...item.poi,
          incidentReportsCount: count,
        };
      });
    }
    return mockPois.map((p) => ({
      ...p,
      incidentReportsCount: incidentCounts[p.id] || p.incidentReportsCount || 0,
    }));
  }, [nearbyResult, incidentCounts]);

  // Apply facility filters
  const displayedPois = useMemo(() => {
    return basePois.filter((p) => {
      if (selectedBank && !p.bankName.toLowerCase().includes(selectedBank.toLowerCase())) {
        return false;
      }
      if (filterVisa && !p.acceptsInternationalCards) return false;
      if (filterCrm && !p.hasCrmDeposit) return false;
      if (filterGuard && !p.hasSecurityGuard) return false;
      if (filter247 && !p.isOpen247) return false;
      return true;
    });
  }, [basePois, selectedBank, filterVisa, filterCrm, filterGuard, filter247]);

  // Calculate route polyline
  const routePolyline = useMemo((): [number, number][] | null => {
    if (!activeRouteTarget || lat === null || lng === null) return null;
    return [
      [lat, lng],
      [lat + (activeRouteTarget.latitude - lat) * 0.5, lng],
      [activeRouteTarget.latitude, activeRouteTarget.longitude],
    ];
  }, [activeRouteTarget, lat, lng]);

  const nearestPoi = nearbyResult?.poi || displayedPois[0] || null;
  const nearestDistance =
    lat !== null && lng !== null && nearestPoi
      ? calculateDistance(lat, lng, nearestPoi.latitude, nearestPoi.longitude)
      : nearbyResult?.distanceMeters || null;

  return (
    <div className="app-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Standard Page Header */}
      <div style={{ marginBottom: '18px' }}>
        <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
          {t.guide.title}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          {t.guide.subtitle}
        </p>
      </div>

      {/* 2. Top Bar: Search Input + Location Button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 12px',
              height: '44px',
            }}
          >
            <Search size={17} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t.guide.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'transparent',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && filteredLandmarks.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: 0,
                right: 0,
                zIndex: 2000,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {filteredLandmarks.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleSelectLandmark(item)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '13px',
                    color: 'var(--text)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Location Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="btn-primary"
          style={{
            height: '44px',
            padding: '0 14px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Navigation size={15} className={isLocating ? 'spin-icon' : ''} />
          <span className="location-btn-text">{isLocating ? 'Đang dò vị trí…' : 'Vị trí của tôi'}</span>
        </button>

        {/* Demo buttons (only shown when ?demo=1 in URL) */}
        {showDemo && (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => handleSelectDemo(10.7743, 106.7032)}
              className="btn-secondary"
              style={{ height: '44px', padding: '0 10px', fontSize: '12px' }}
            >
              {t.guide.demoD1}
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo(10.7554, 106.6652)}
              className="btn-secondary"
              style={{ height: '44px', padding: '0 10px', fontSize: '12px' }}
            >
              {t.guide.demoD5}
            </button>
          </div>
        )}
      </div>

      {geoError && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', border: '1px solid rgba(179,38,30,0.2)', color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>
          {geoError}
        </div>
      )}

      {apiError && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', border: '1px solid rgba(179,38,30,0.2)', color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>
          {apiError}
        </div>
      )}

      {/* 3. Bank Filter Chips + Facility Filter Button (Single Row) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', position: 'relative' }}>
        {/* Horizontal scrolling bank chips */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            flex: 1,
            scrollbarWidth: 'none',
            paddingBottom: '2px',
          }}
        >
          {BANK_CHIPS.map((chip) => {
            const isSelected = selectedBank === chip.id;
            return (
              <button
                key={chip.id || 'all'}
                type="button"
                onClick={() => handleSelectBank(chip.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                  color: isSelected ? '#ffffff' : 'var(--text)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  minHeight: '34px',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Filter Popover Toggle */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setShowFilterPopover(!showFilterPopover)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              border: activeFilterCount > 0 ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: activeFilterCount > 0 ? 'var(--primary-light)' : 'var(--surface)',
              color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '34px',
            }}
          >
            <Filter size={14} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Popover Panel */}
          {showFilterPopover && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: 0,
                zIndex: 2100,
                width: '260px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Tiện ích cần tìm:
              </div>

              {/* 1. International Cards first */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterVisa}
                  onChange={(e) => setFilterVisa(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <Compass size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Thẻ quốc tế (Visa/Master)</span>
              </label>

              {/* 2. CRM Cash Deposit */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterCrm}
                  onChange={(e) => setFilterCrm(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Máy CRM nạp tiền</span>
              </label>

              {/* 3. Security Guard */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterGuard}
                  onChange={(e) => setFilterGuard(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <UserCheck size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Có bảo vệ túc trực</span>
              </label>

              {/* 4. Open 24/7 */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filter247}
                  onChange={(e) => setFilter247(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Mở cửa 24/7</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterVisa(false);
                    setFilterCrm(false);
                    setFilterGuard(false);
                    setFilter247(false);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', marginRight: 'auto' }}
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterPopover(false)}
                  className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '12px', minHeight: '30px' }}
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Slim Nearest Location Banner (1-2 lines, clean, no thick borders) */}
      {nearestPoi && (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(11, 79, 156, 0.2)',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Volume2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600 }}>{nearestPoi.name}</span>
              {nearestDistance !== null && (
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  · cách {nearestDistance} m
                </span>
              )}
              {isLoading && <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>(Đang tải…)</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else if (nearbyResult?.narration) {
                speakText(nearbyResult.narration.text, nearbyResult.narration.ttsLang);
              } else {
                speakText(`Bạn đang ở gần ${nearestPoi.name}, địa chỉ ${nearestPoi.address}. Chú ý quan sát khe thẻ.`);
              }
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isSpeaking ? 'var(--danger)' : 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              minHeight: '34px',
            }}
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? 'Dừng' : 'Nghe thuyết minh'}</span>
          </button>
        </div>
      )}

      {/* Mobile View Toggle: Segmented Control (Danh sách / Bản đồ) */}
      <div
        className="mobile-only"
        style={{
          display: 'flex',
          marginBottom: '14px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
          border: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileView('list')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: mobileView === 'list' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: mobileView === 'list' ? 'var(--surface)' : 'transparent',
            color: mobileView === 'list' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: mobileView === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <List size={15} />
          <span>Danh sách ({displayedPois.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('map')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: mobileView === 'map' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: mobileView === 'map' ? 'var(--surface)' : 'transparent',
            color: mobileView === 'map' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: mobileView === 'map' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Map size={15} />
          <span>Bản đồ</span>
        </button>
      </div>

      {/* 5. Main Split View: Left List 40% / Right Map 60% */}
      <div className="guide-split-layout">
        {/* Left Column: POI List (shown on desktop or when mobileView === 'list') */}
        <div
          className={`guide-list-col ${mobileView === 'map' ? 'mobile-hidden' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {displayedPois.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              {t.guide.splitEmpty}
            </div>
          ) : (
            displayedPois.map((p) => {
              const isSelected = p.id === (nearestPoi?.id ?? displayedPois[0]?.id);
              const isHighRisk = Boolean(p.incidentReportsCount && p.incidentReportsCount >= 3);
              const distance =
                lat !== null && lng !== null
                  ? calculateDistance(lat, lng, p.latitude, p.longitude)
                  : null;

              // Facility tags (max 3, extra as +N)
              const tags: string[] = [];
              if (p.acceptsInternationalCards) tags.push('Visa/Master');
              if (p.hasCrmDeposit) tags.push('CRM');
              if (p.hasSecurityGuard) tags.push('Bảo vệ');
              if (p.isOpen247) tags.push('24/7');
              const visibleTags = tags.slice(0, 3);
              const remainingCount = tags.length - visibleTags.length;

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: isSelected ? 'rgba(11, 79, 156, 0.04)' : 'var(--surface)',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    boxShadow: 'var(--shadow-card)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onClick={() => {
                    setLat(p.latitude);
                    setLng(p.longitude);
                    if (window.innerWidth < 768) {
                      setMobileView('map');
                    }
                  }}
                >
                  {/* Subtle top warning strip if high risk (NOT painting entire card red) */}
                  {isHighRisk && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        backgroundColor: 'var(--danger)',
                        borderTopLeftRadius: 'var(--radius-sm)',
                        borderTopRightRadius: 'var(--radius-sm)',
                      }}
                    />
                  )}

                  {/* Line 1: Bank badge (small) + Distance on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--primary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {p.bankName}
                      </span>
                      {isHighRisk && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={12} />
                          <span>Cảnh báo</span>
                        </span>
                      )}
                    </div>
                    {distance !== null && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {distance} m
                      </span>
                    )}
                  </div>

                  {/* Line 2: ATM Name (16px semi-bold) */}
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                    {p.name}
                  </div>

                  {/* Line 3: Single line address with ellipsis */}
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '8px',
                    }}
                  >
                    {p.address}
                  </div>

                  {/* Line 4: Max 3 tags (subtle background, no border) */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                    {visibleTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {remainingCount > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        +{remainingCount}
                      </span>
                    )}
                  </div>

                  {/* Actions: 1 Primary button ("Chỉ đường") + 1 Secondary Icon button ("Nghe") + Menu "⋯" */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRouteTarget(p);
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`, '_blank');
                      }}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        minHeight: '38px',
                        padding: '0 12px',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Compass size={14} />
                      <span>{t.guide.btnDirections}</span>
                    </button>

                    <button
                      type="button"
                      aria-label="Nghe hướng dẫn điểm này"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(
                          `Điểm ${p.name}, địa chỉ ${p.address}. ${
                            isHighRisk
                              ? 'Cảnh báo: Điểm này có nhiều báo cáo bất thường, vui lòng che tay khi nhập mã PIN.'
                              : 'Kiểm tra kỹ khe thẻ trước khi rút tiền.'
                          }`
                        );
                      }}
                      style={{
                        minHeight: '38px',
                        width: '38px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      <Volume2 size={15} />
                    </button>

                    {/* More Menu "⋯" for Flow & Report */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        aria-label="Tùy chọn khác"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuPoiId(activeMenuPoiId === p.id ? null : p.id);
                        }}
                        style={{
                          minHeight: '38px',
                          width: '38px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {activeMenuPoiId === p.id && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '42px',
                            right: 0,
                            zIndex: 100,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            width: '160px',
                            padding: '4px 0',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPoiId(null);
                              setSelectedPoiForDetail(p);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: '13px',
                              color: 'var(--text)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {t.guide.btnAtmFlow}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPoiId(null);
                              setSelectedPoiForReport(p);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: '13px',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              borderTop: '1px solid var(--border)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {t.guide.btnReportIncident}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Leaflet Map (Sticky, equal height) */}
        <div
          className={`guide-map-col ${mobileView === 'list' ? 'mobile-hidden' : ''}`}
          style={{
            height: 'calc(100vh - 280px)',
            minHeight: '380px',
            position: 'sticky',
            top: '76px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <GuideMap
            pois={displayedPois}
            selectedPoiId={nearestPoi?.id ?? null}
            lat={lat}
            lng={lng}
            onSelectLocation={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
            onMarkerClick={(p) => {
              setSelectedPoiForDetail(p);
            }}
            routeCoordinates={routePolyline}
          />
        </div>
      </div>

      {/* Modals */}
      <AtmDetailModal
        poi={selectedPoiForDetail}
        isOpen={Boolean(selectedPoiForDetail)}
        onClose={() => setSelectedPoiForDetail(null)}
        onSpeakText={(text, lang) => speakText(text, lang)}
      />

      <IncidentReportModal
        poi={selectedPoiForReport}
        isOpen={Boolean(selectedPoiForReport)}
        onClose={() => setSelectedPoiForReport(null)}
        onSubmitIncident={handleSubmitIncident}
      />
    </div>
  );
};
