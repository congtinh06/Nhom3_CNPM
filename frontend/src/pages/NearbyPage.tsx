import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LocateFixed,
  Play,
  Pause,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import nearbyPoisData from '../content/nearbyPois.json';
import { useNavbarLanguage, SUPPORTED_LANGUAGES } from '../content/languages';
import { SupportedLanguage } from '../types';

export interface GeoPoi {
  id: string;
  name: Record<SupportedLanguage, string>;
  lat: number;
  lng: number;
  triggerRadius: number;
  category: Record<SupportedLanguage, string>;
  image: string;
  audio: Record<SupportedLanguage, string | number>;
  transcript: Record<SupportedLanguage, string>;
}

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

const LANG_DISPLAY_NAMES: Record<SupportedLanguage, Record<SupportedLanguage, string>> = {
  vi: { vi: 'tiếng Việt', en: 'tiếng Anh', ko: 'tiếng Hàn', ja: 'tiếng Nhật', zh: 'tiếng Trung' },
  en: { vi: 'Vietnamese', en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese' },
  ko: { vi: '베트남어', en: '영어', ko: '한국어', ja: '일본어', zh: '중국어' },
  ja: { vi: 'ベトナム語', en: '英語', ko: '韓国語', ja: '日本語', zh: '中国語' },
  zh: { vi: '越南语', en: '英语', ko: '韩语', ja: '日语', zh: '中文' },
};

// Complete UI Translations for Nearby Page
const NEARBY_I18N: Record<
  SupportedLanguage,
  {
    heroEyebrow: string;
    heroTitle: string;
    heroDesc: string;
    myLocationBtn: string;
    radiusLabel: string;
    autoNarration: string;
    languageLabel: string;
    testModeTitle: string;
    testModeSub: string;
    latLabel: string;
    lngLabel: string;
    applyCoordsBtn: string;
    presets: { label: string; lat: number; lng: number }[];
    noLocationStatus: string;
    nearestPrefix: string;
    nearestSuffix: (name: string, dist: string) => string;
    farNotice: string;
    gpsError: string;
    invalidCoords: string;
    mapCaption: string;
    mapUserOutside: string;
    listTitle: string;
    sortNearest: string;
    sortTour: string;
    inZoneBadge: string;
    nearBadge: string;
    distFormat: (dist: string) => string;
    turnOnGpsDist: string;
    langVoiceAria: string;
    listenBtn: string;
    pauseBtn: string;
    resumeBtn: string;
    noPoiSelected: string;
    clickToStart: string;
    playingInLang: (lang: string) => string;
    pausedStatus: string;
    fallbackNotice: (lang: string) => string;
    autoTriggerNotice: (name: string) => string;
    viewTextBtn: string;
    hideTextBtn: string;
    speedLabel: string;
    fallbackTxNotice: (lang: string) => string;
    increaseRadiusBtn: string;
    noPoiInRadius: string;
  }
> = {
  vi: {
    heroEyebrow: 'SaigonVoice',
    heroTitle: 'Điểm du lịch Sài Gòn',
    heroDesc:
      '5 điểm có thuyết minh. Bấm Nghe ở bất kỳ điểm nào để phát ngay, hoặc bật thuyết minh tự động để app tự phát khi bạn đi tới gần.',
    myLocationBtn: 'Vị trí của tôi',
    radiusLabel: 'Bán kính gần bạn',
    autoNarration: 'Thuyết minh tự động',
    languageLabel: 'Ngôn ngữ',
    testModeTitle: 'Chế độ thử nghiệm',
    testModeSub: '(ẩn khi triển khai thật)',
    latLabel: 'Vĩ độ',
    lngLabel: 'Kinh độ',
    applyCoordsBtn: 'Áp dụng tọa độ',
    presets: [
      { label: 'Sát Dinh Độc Lập (≈10 m)', lat: 10.77709, lng: 106.6954 },
      { label: 'Sát Nhà thờ Đức Bà (≈10 m)', lat: 10.77985, lng: 106.69905 },
      { label: 'Giữa tour, chưa tới điểm nào', lat: 10.776, lng: 106.6945 },
      { label: 'Xa tour (vị trí thử nghiệm)', lat: 10.759851, lng: 106.67896 },
    ],
    noLocationStatus: 'Chưa có vị trí của bạn. Danh sách xếp theo thứ tự tour, vẫn nghe được ngay.',
    nearestPrefix: 'điểm gần nhất là',
    nearestSuffix: (name, dist) => `điểm gần nhất là <b>${name}</b>, cách ${dist}.`,
    farNotice: 'Bạn đang ở khá xa tour nhưng danh sách vẫn hiện đủ 5 điểm.',
    gpsError:
      'Không lấy được vị trí. Hãy cho phép truy cập vị trí trong trình duyệt, hoặc dùng chế độ thử nghiệm bên dưới. Danh sách vẫn hiện đủ 5 điểm.',
    invalidCoords: 'Tọa độ chưa hợp lệ. Nhập dạng 10.7770 và 106.6954.',
    mapCaption: 'Bản đồ tương tác OpenStreetMap hiển thị vị trí 5 điểm di sản văn hóa Sài Gòn.',
    mapUserOutside: 'Vị trí của bạn nằm ngoài khung sơ đồ',
    listTitle: '5 điểm thuyết minh',
    sortNearest: 'Gần nhất lên trước',
    sortTour: 'Theo thứ tự tour',
    inZoneBadge: 'Đã vào vùng thuyết minh',
    nearBadge: 'Gần bạn',
    distFormat: (dist) => `Cách bạn ${dist}`,
    turnOnGpsDist: 'Bật vị trí để xem khoảng cách',
    langVoiceAria: 'Ngôn ngữ có giọng đọc',
    listenBtn: '▶ Nghe',
    pauseBtn: '❚❚ Tạm dừng',
    resumeBtn: '▶ Tiếp tục',
    noPoiSelected: 'Chưa chọn điểm nào',
    clickToStart: 'Bấm Nghe ở một điểm để bắt đầu.',
    playingInLang: (lang) => `Đang phát bằng ${lang}`,
    pausedStatus: 'Đã tạm dừng',
    fallbackNotice: (lang) => `Chưa có giọng đọc ${lang} cho điểm này, đang dùng tiếng Việt.`,
    autoTriggerNotice: (name) => `Bạn đã tới gần ${name}, tự động phát thuyết minh.`,
    viewTextBtn: 'Xem văn bản',
    hideTextBtn: 'Ẩn văn bản',
    speedLabel: 'Tốc độ',
    fallbackTxNotice: (lang) => `Chưa có văn bản ${lang}, đang hiện tiếng Việt.`,
    increaseRadiusBtn: 'Tăng bán kính',
    noPoiInRadius: 'Không có điểm nào trong bán kính đã chọn.',
  },
  en: {
    heroEyebrow: 'SaigonVoice',
    heroTitle: 'Saigon Attractions',
    heroDesc:
      '5 historic landmarks with audio tours. Click Listen on any spot to play immediately, or enable auto narration so the guide plays as you walk near.',
    myLocationBtn: 'My location',
    radiusLabel: 'Radius near you',
    autoNarration: 'Auto narration',
    languageLabel: 'Language',
    testModeTitle: 'Testing mode',
    testModeSub: '(hidden in production)',
    latLabel: 'Latitude',
    lngLabel: 'Longitude',
    applyCoordsBtn: 'Apply coordinates',
    presets: [
      { label: 'Near Independence Palace (≈10 m)', lat: 10.77709, lng: 106.6954 },
      { label: 'Near Notre Dame Cathedral (≈10 m)', lat: 10.77985, lng: 106.69905 },
      { label: 'Mid-tour, no spot reached', lat: 10.776, lng: 106.6945 },
      { label: 'Far from tour (sample coords)', lat: 10.759851, lng: 106.67896 },
    ],
    noLocationStatus:
      'Location not detected yet. Attractions are ordered by tour itinerary and ready to play.',
    nearestPrefix: 'nearest spot is',
    nearestSuffix: (name, dist) => `nearest spot is <b>${name}</b>, ${dist} away.`,
    farNotice: 'You are currently far from the tour, but all 5 landmarks remain accessible.',
    gpsError:
      'Could not retrieve GPS position. Please allow location permissions or test coordinates below.',
    invalidCoords: 'Invalid coordinates format. Please enter numbers like 10.7770 and 106.6954.',
    mapCaption: 'Interactive OpenStreetMap displaying 5 landmark cultural heritage spots of Saigon.',
    mapUserOutside: 'Your position is currently outside the map viewport',
    listTitle: '5 Audio Tour Spots',
    sortNearest: 'Closest first',
    sortTour: 'Tour itinerary order',
    inZoneBadge: 'In narration zone',
    nearBadge: 'Near you',
    distFormat: (dist) => `${dist} away`,
    turnOnGpsDist: 'Turn on GPS to see distance',
    langVoiceAria: 'Available audio languages',
    listenBtn: '▶ Listen',
    pauseBtn: '❚❚ Pause',
    resumeBtn: '▶ Resume',
    noPoiSelected: 'No attraction selected',
    clickToStart: 'Click Listen on any landmark to start playback.',
    playingInLang: (lang) => `Playing in ${lang}`,
    pausedStatus: 'Paused',
    fallbackNotice: (lang) =>
      `${lang} audio is not available for this landmark, playing Vietnamese version.`,
    autoTriggerNotice: (name) => `You have arrived near ${name}, auto narration started.`,
    viewTextBtn: 'View transcript',
    hideTextBtn: 'Hide transcript',
    speedLabel: 'Speed',
    fallbackTxNotice: (lang) => `${lang} transcript unavailable, displaying Vietnamese.`,
    increaseRadiusBtn: 'Increase radius',
    noPoiInRadius: 'No attractions found within the selected radius.',
  },
  ko: {
    heroEyebrow: 'SaigonVoice',
    heroTitle: '사이공 명소 가이드',
    heroDesc:
      '5개 오디오 해설 명소. 아무 곳이나 듣기를 누르면 바로 재생되거나, 자동 해설을 켜면 근처 도착 시 자동 재생됩니다.',
    myLocationBtn: '내 위치 찾기',
    radiusLabel: '탐색 반경',
    autoNarration: '자동 오디오 해설',
    languageLabel: '언어',
    testModeTitle: '테스트 모드',
    testModeSub: '(실제 배포 시 숨김)',
    latLabel: '위도',
    lngLabel: '경도',
    applyCoordsBtn: '좌표 적용',
    presets: [
      { label: '통일궁 바로 앞 (≈10 m)', lat: 10.77709, lng: 106.6954 },
      { label: '노트르담 성당 바로 앞 (≈10 m)', lat: 10.77985, lng: 106.69905 },
      { label: '투어 중간 (미도착)', lat: 10.776, lng: 106.6945 },
      { label: '투어 외곽 (테스트 좌표)', lat: 10.759851, lng: 106.67896 },
    ],
    noLocationStatus: '위치가 설정되지 않았습니다. 투어 순서대로 정렬되며 바로 청취 가능합니다.',
    nearestPrefix: '가장 가까운 명소는',
    nearestSuffix: (name, dist) => `가장 가까운 명소는 <b>${name}</b> (${dist} 거리)입니다.`,
    farNotice: '투어 코스에서 다소 멀리 떨어져 있지만 5개 명소 모두 확인 가능합니다.',
    gpsError: '위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 허용해 주세요.',
    invalidCoords: '좌표 형식이 올바르지 않습니다. (예: 10.7770 및 106.6954)',
    mapCaption: '사이공 5대 문화유산을 표시하는 대화형 오픈스트리트맵.',
    mapUserOutside: '현재 위치가 지도 화면 밖에 있습니다',
    listTitle: '5개 오디오 해설 명소',
    sortNearest: '가까운 순',
    sortTour: '투어 추천 순',
    inZoneBadge: '해설 구역 진입',
    nearBadge: '가까운 위치',
    distFormat: (dist) => `${dist} 거리`,
    turnOnGpsDist: '거리를 보려면 위치를 켜세요',
    langVoiceAria: '지원 언어',
    listenBtn: '▶ 듣기',
    pauseBtn: '❚❚ 일시정지',
    resumeBtn: '▶ 이어듣기',
    noPoiSelected: '선택된 명소 없음',
    clickToStart: '명소의 듣기 버튼을 눌러 시작하세요.',
    playingInLang: (lang) => `${lang} 오디오 재생 중`,
    pausedStatus: '일시정지됨',
    fallbackNotice: (lang) => `이 명소는 ${lang} 음성이 지원되지 않아 베트남어로 재생됩니다.`,
    autoTriggerNotice: (name) => `${name} 근처에 도착하여 자동 해설을 시작합니다.`,
    viewTextBtn: '텍스트 보기',
    hideTextBtn: '텍스트 숨기기',
    speedLabel: '속도',
    fallbackTxNotice: (lang) => `${lang} 텍스트가 없어 베트남어로 표시됩니다.`,
    increaseRadiusBtn: '반경 늘리기',
    noPoiInRadius: '선택한 반경 내에 명소가 없습니다.',
  },
  ja: {
    heroEyebrow: 'SaigonVoice',
    heroTitle: 'サイゴン観光スポット',
    heroDesc:
      '音声ガイド付き5か所の名所。「聴く」を押してすぐ再生するか、自動ガイドをオンにして近づいた際に自動再生できます。',
    myLocationBtn: '現在地を取得',
    radiusLabel: '検索半径',
    autoNarration: '自動音声ガイド',
    languageLabel: '言語',
    testModeTitle: 'テストモード',
    testModeSub: '(本番時は非表示)',
    latLabel: '緯度',
    lngLabel: '経度',
    applyCoordsBtn: '座標を適用',
    presets: [
      { label: '統一会堂の至近 (≈10 m)', lat: 10.77709, lng: 106.6954 },
      { label: '大聖堂の至近 (≈10 m)', lat: 10.77985, lng: 106.69905 },
      { label: 'ツアー中間地点', lat: 10.776, lng: 106.6945 },
      { label: 'ツアー圏外 (テスト用)', lat: 10.759851, lng: 106.67896 },
    ],
    noLocationStatus:
      '位置情報が未設定です。ツアー推奨順に並んでおり、いつでも音声を再生できます。',
    nearestPrefix: '最寄りのスポットは',
    nearestSuffix: (name, dist) => `最寄りのスポットは<b>${name}</b>（距離 ${dist}）です。`,
    farNotice: '現在ツアーエリアから離れていますが、5か所すべて閲覧できます。',
    gpsError: '現在地を取得できませんでした。ブラウザの位置情報アクセスを許可してください。',
    invalidCoords: '座標が無効です。10.7770 および 106.6954 の形式で入力してください。',
    mapCaption: 'サイゴンの5大歴史遺産を表示するインタラクティブ地図。',
    mapUserOutside: '現在地が地図の表示枠外にあります',
    listTitle: '音声ガイド 5名所',
    sortNearest: '近い順',
    sortTour: 'ツアー順',
    inZoneBadge: 'ガイド範囲内',
    nearBadge: '周辺',
    distFormat: (dist) => `${dist}`,
    turnOnGpsDist: '位置をオンにして距離を表示',
    langVoiceAria: '対応音声言語',
    listenBtn: '▶ 聴く',
    pauseBtn: '❚❚ 一時停止',
    resumeBtn: '▶ 再開',
    noPoiSelected: 'スポットが選択されていません',
    clickToStart: 'スポットの「聴く」ボタンを押して開始します。',
    playingInLang: (lang) => `${lang}で再生中`,
    pausedStatus: '一時停止中',
    fallbackNotice: (lang) =>
      `このスポットは${lang}の音声がないため、ベトナム語版を再生します。`,
    autoTriggerNotice: (name) => `${name}の近くに到着しました。自動音声ガイドを開始します。`,
    viewTextBtn: 'テキスト表示',
    hideTextBtn: 'テキスト非表示',
    speedLabel: '速度',
    fallbackTxNotice: (lang) => `${lang}のテキストがないためベトナム語で表示しています。`,
    increaseRadiusBtn: '半径を拡大',
    noPoiInRadius: '選択した半径内にスポットが見つかりません。',
  },
  zh: {
    heroEyebrow: 'SaigonVoice',
    heroTitle: '西贡旅游景点',
    heroDesc:
      '精选 5 处带语音导览的历史名胜。点击任意景点的“收听”即可播放，或开启自动导览让应用在您靠近时自动播放。',
    myLocationBtn: '我的当前位置',
    radiusLabel: '附近搜索半径',
    autoNarration: '自动语音导览',
    languageLabel: '语言选择',
    testModeTitle: '测试模式',
    testModeSub: '(正式发布时隐藏)',
    latLabel: '纬度',
    lngLabel: '经度',
    applyCoordsBtn: '应用坐标',
    presets: [
      { label: '统一宫门前 (≈10 米)', lat: 10.77709, lng: 106.6954 },
      { label: '红教堂门前 (≈10 米)', lat: 10.77985, lng: 106.69905 },
      { label: '行程中段 (尚未抵达)', lat: 10.776, lng: 106.6945 },
      { label: '远离行程 (测试坐标)', lat: 10.759851, lng: 106.67896 },
    ],
    noLocationStatus: '尚未获取您的位置。列表按行程顺序展示，可立即点击收听。',
    nearestPrefix: '最近的景点是',
    nearestSuffix: (name, dist) => `最近的景点是 <b>${name}</b>，距离 ${dist}。`,
    farNotice: '您当前距离游览路线较远，但 5 处景点均正常展示。',
    gpsError: '无法获取地理位置，请在浏览器中允许位置访问权限，或使用下方的测试模式。',
    invalidCoords: '坐标格式有误，请输入如 10.7770 和 106.6954。',
    mapCaption: '基于 OpenStreetMap 的西贡 5 处核心历史文化景点交互地图。',
    mapUserOutside: '您的当前位置位于地图视口范围外',
    listTitle: '5 处语音导览景点',
    sortNearest: '距离最近优先',
    sortTour: '推荐游览顺序',
    inZoneBadge: '已进入导览范围',
    nearBadge: '靠近您',
    distFormat: (dist) => `距您 ${dist}`,
    turnOnGpsDist: '开启定位以查看距离',
    langVoiceAria: '支持的语音语言',
    listenBtn: '▶ 收听',
    pauseBtn: '❚❚ 暂停',
    resumeBtn: '▶ 继续',
    noPoiSelected: '尚未选择景点',
    clickToStart: '点击景点的“收听”按钮开始导览。',
    playingInLang: (lang) => `正在以${lang}播放`,
    pausedStatus: '已暂停',
    fallbackNotice: (lang) => `该景点暂无${lang}语音，已为您自动切换为越南语。`,
    autoTriggerNotice: (name) => `您已抵达 ${name} 附近，自动为您播放语音讲解。`,
    viewTextBtn: '查看文本',
    hideTextBtn: '隐藏文本',
    speedLabel: '倍速',
    fallbackTxNotice: (lang) => `暂无${lang}文本，正在显示越南语原文。`,
    increaseRadiusBtn: '扩大半径',
    noPoiInRadius: '所选半径范围内暂无景点。',
  },
};

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDist(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatMmSs(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Custom Leaflet Controller
const MapController: React.FC<{
  userPos: { lat: number; lng: number } | null;
  radius: number;
  selectedPoi: GeoPoi | null;
  pois: GeoPoi[];
}> = ({ userPos, radius, selectedPoi, pois }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    try {
      if (userPos) {
        const circle = L.circle([userPos.lat, userPos.lng], { radius });
        map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 17 });
      } else if (pois.length > 0) {
        const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } catch {
      // Ignore bounds error
    }
  }, [userPos, radius, pois, map]);

  useEffect(() => {
    if (selectedPoi) {
      map.panTo([selectedPoi.lat, selectedPoi.lng], { animate: true });
    }
  }, [selectedPoi, map]);

  return null;
};

export const NearbyPage: React.FC = () => {
  const { lang, changeLanguage } = useNavbarLanguage();
  const currentLang = (lang as SupportedLanguage) || 'vi';
  const t = NEARBY_I18N[currentLang] || NEARBY_I18N.vi;

  const pois: GeoPoi[] = nearbyPoisData as GeoPoi[];

  // User position states
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [userLabel, setUserLabel] = useState<string>('');
  const [gpsError, setGpsError] = useState<string>('');

  // Toolbar settings
  const [radius, setRadius] = useState<number>(1000);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [testLat, setTestLat] = useState<string>('10.759851');
  const [testLng, setTestLng] = useState<string>('106.678960');

  // Selected & audio states
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [noticeWarn, setNoticeWarn] = useState<boolean>(false);

  // References
  const isAutoRef = useRef<boolean>(false);
  const lastPlayedMapRef = useRef<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const prevLangRef = useRef<SupportedLanguage>(currentLang);

  useEffect(() => {
    isAutoRef.current = isAutoEnabled;
  }, [isAutoEnabled]);

  // Helper getters
  const getPoiName = useCallback(
    (poi: GeoPoi) => poi.name[currentLang] || poi.name.vi,
    [currentLang]
  );

  const getPoiCategory = useCallback(
    (poi: GeoPoi) => poi.category[currentLang] || poi.category.vi,
    [currentLang]
  );

  // Resolve audio & transcript for a POI according to current language
  const resolveAudio = useCallback(
    (poi: GeoPoi) => {
      const hasAudioInLang =
        poi.audio[currentLang] !== undefined &&
        poi.audio[currentLang] !== 0 &&
        poi.audio[currentLang] !== '';
      const actualLang: SupportedLanguage = hasAudioInLang ? currentLang : 'vi';
      const hasTxInLang = Boolean(poi.transcript[currentLang]);
      const actualTxLang: SupportedLanguage = hasTxInLang ? currentLang : 'vi';
      const text = poi.transcript[actualTxLang] || poi.transcript.vi || '';

      return {
        hasAudioInLang,
        actualLang,
        actualTxLang,
        text,
      };
    },
    [currentLang]
  );

  // Speech synthesis implementation
  const stopAudioTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const speakText = useCallback(
    (text: string, langCode: SupportedLanguage, playbackRate: number) => {
      try {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = SPEECH_LANG_MAP[langCode] || 'vi-VN';
        utterance.rate = playbackRate;

        utterance.onend = () => {
          stopAudioTimer();
          setIsPlaying(false);
          setCurrentTime((prevDur) => prevDur);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback gracefully
      }
    },
    []
  );

  // Play audio function
  const playPoi = useCallback(
    (poiId: string, isAuto: boolean = false) => {
      const targetPoi = pois.find((p) => p.id === poiId);
      if (!targetPoi) return;

      const res = resolveAudio(targetPoi);
      const estDuration = Math.max(14, Math.round(res.text.length / 10));

      setCurrentId(poiId);
      setSelectedId(poiId);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(estDuration);

      if (!res.hasAudioInLang) {
        const langName = LANG_DISPLAY_NAMES[currentLang][currentLang];
        setNotice(t.fallbackNotice(langName));
        setNoticeWarn(true);
      } else if (isAuto) {
        setNotice(t.autoTriggerNotice(getPoiName(targetPoi)));
        setNoticeWarn(false);
      } else {
        setNotice('');
        setNoticeWarn(false);
      }

      lastPlayedMapRef.current[poiId] = Date.now();
      speakText(res.text, res.actualLang, speed);

      stopAudioTimer();
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.25 * speed;
          if (next >= estDuration) {
            stopAudioTimer();
            setIsPlaying(false);
            setNotice('');
            return estDuration;
          }
          return next;
        });
      }, 250);
    },
    [pois, resolveAudio, currentLang, t, getPoiName, speakText, speed]
  );

  // Toggle play/pause
  const togglePlay = () => {
    if (!currentId) return;
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioTimer();
      try {
        window.speechSynthesis.pause();
      } catch {
        // Ignore
      }
    } else {
      if (currentTime >= duration) {
        playPoi(currentId, false);
      } else {
        setIsPlaying(true);
        try {
          window.speechSynthesis.resume();
        } catch {
          // Ignore
        }
        stopAudioTimer();
        timerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + 0.25 * speed;
            if (next >= duration) {
              stopAudioTimer();
              setIsPlaying(false);
              setNotice('');
              return duration;
            }
            return next;
          });
        }, 250);
      }
    }
  };

  // Switch language synchronized: when navbar language changes or player updates
  useEffect(() => {
    if (prevLangRef.current !== currentLang) {
      prevLangRef.current = currentLang;
      if (currentId) {
        const activePoi = pois.find((p) => p.id === currentId);
        if (activePoi) {
          const res = resolveAudio(activePoi);
          if (!res.hasAudioInLang) {
            const langName = LANG_DISPLAY_NAMES[currentLang][currentLang];
            setNotice(t.fallbackNotice(langName));
            setNoticeWarn(true);
          } else {
            setNotice('');
            setNoticeWarn(false);
          }
          // If actively playing, seamlessly transition narration to new language
          if (isPlaying) {
            playPoi(currentId, false);
          }
        }
      }
    }
  }, [currentLang, currentId, pois, resolveAudio, t, isPlaying, playPoi]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudioTimer();
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Check auto-narration trigger
  const checkAutoNarration = useCallback(
    (lat: number, lng: number) => {
      if (!isAutoRef.current) return;
      const hits = pois
        .map((p) => ({
          poi: p,
          dist: haversine(lat, lng, p.lat, p.lng),
        }))
        .filter((item) => {
          const lastPlayed = lastPlayedMapRef.current[item.poi.id];
          return (
            item.dist <= item.poi.triggerRadius &&
            (!lastPlayed || Date.now() - lastPlayed > 600000)
          );
        })
        .sort((a, b) => a.dist - b.dist);

      const firstHit = hits[0];
      if (firstHit && !(isPlaying && currentId === firstHit.poi.id)) {
        playPoi(firstHit.poi.id, true);
      }
    },
    [isAutoEnabled, pois, isPlaying, currentId, playPoi]
  );

  // Position applying
  const applyPosition = useCallback(
    (lat: number, lng: number, label: string) => {
      setUserPos({ lat, lng });
      setUserLabel(label);
      setGpsError('');
      checkAutoNarration(lat, lng);
    },
    [checkAutoNarration]
  );

  // Handle GPS location
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError(t.gpsError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude, 'Vị trí GPS');
      },
      () => {
        setGpsError(t.gpsError);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Watch position if auto-narration is on and real GPS exists
  useEffect(() => {
    if (isAutoEnabled && userLabel === 'Vị trí GPS' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          applyPosition(pos.coords.latitude, pos.coords.longitude, 'Vị trí GPS');
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, [isAutoEnabled, userLabel, applyPosition]);

  // Handle test coordinates form
  const handleApplyCustomCoords = () => {
    const lat = parseFloat(testLat.replace(',', '.'));
    const lng = parseFloat(testLng.replace(',', '.'));
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setGpsError(t.invalidCoords);
      return;
    }
    applyPosition(lat, lng, 'Vị trí thử nghiệm');
  };

  // Calculate sorted POIs
  const sortedPois = useMemo(() => {
    const list = pois.map((p, index) => {
      const dist = userPos ? haversine(userPos.lat, userPos.lng, p.lat, p.lng) : null;
      return { poi: p, originalIndex: index, dist };
    });
    if (userPos) {
      list.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
    }
    return list;
  }, [pois, userPos]);

  // Active playing POI
  const activePlayingPoi = useMemo(
    () => pois.find((p) => p.id === currentId) || null,
    [pois, currentId]
  );
  const activeSelectedPoi = useMemo(
    () => pois.find((p) => p.id === selectedId) || null,
    [pois, selectedId]
  );

  // Status message computation
  const statusMessage = useMemo(() => {
    if (gpsError) {
      return <span style={{ color: '#b91c1c' }}>{gpsError}</span>;
    }
    if (!userPos) {
      return <span>{t.noLocationStatus}</span>;
    }
    const nearest = sortedPois[0];
    if (nearest && typeof nearest.dist === 'number') {
      const isFar = nearest.dist > 3000;
      return (
        <span>
          {userLabel}:{' '}
          <span
            dangerouslySetInnerHTML={{
              __html: t.nearestSuffix(getPoiName(nearest.poi), formatDist(nearest.dist)),
            }}
          />{' '}
          {isFar ? <span style={{ opacity: 0.85 }}>{t.farNotice}</span> : null}
        </span>
      );
    }
    return null;
  }, [gpsError, userPos, sortedPois, userLabel, t, getPoiName]);

  // Check if user location is outside viewport
  const isUserOutside = useMemo(() => {
    if (!userPos) return false;
    // Bounding box of Saigon tour center
    return (
      userPos.lat < 10.765 ||
      userPos.lat > 10.79 ||
      userPos.lng < 10.685 ||
      userPos.lng > 10.71
    );
  }, [userPos]);

  // Custom numbered Leaflet icons
  const createMarkerIcon = (num: number, isSelected: boolean, isCurPlaying: boolean) => {
    return L.divIcon({
      className: 'custom-poi-marker',
      html: `
        <div class="mk ${isSelected ? 'sel' : ''} ${isCurPlaying ? 'playing' : ''}">
          <div class="ring"></div>
          <div class="dot">${num}</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const userGpsIcon = L.divIcon({
    className: 'custom-user-gps-marker',
    html: `
      <div class="you-dot-pulse">
        <div class="you-dot"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  return (
    <div className="nearby-sv-root">
      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-in">
          <div className="eyebrow">{t.heroEyebrow}</div>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroDesc}</p>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="wrap">
        {/* TOOLBAR */}
        <section className="toolbar" aria-label="Điều khiển vị trí và thuyết minh">
          <div className="row">
            <button className="btn solid" id="btnGps" type="button" onClick={handleGetGps}>
              <LocateFixed size={18} />
              {t.myLocationBtn}
            </button>

            <label className="field" htmlFor="selRadius">
              {t.radiusLabel}
              <select
                className="sel"
                id="selRadius"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              >
                <option value={500}>500 m</option>
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
              </select>
            </label>

            <button
              type="button"
              role="switch"
              aria-checked={isAutoEnabled}
              className={`switch ${isAutoEnabled ? 'on' : ''}`}
              id="chkAuto"
              onClick={() => {
                const nextVal = !isAutoEnabled;
                setIsAutoEnabled(nextVal);
                isAutoRef.current = nextVal;
                if (nextVal && userPos) {
                  checkAutoNarration(userPos.lat, userPos.lng);
                }
              }}
            >
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              {t.autoNarration}
            </button>

            <span className="sp" />

            <label className="field" htmlFor="selLang">
              {t.languageLabel}
              <select
                className="sel"
                id="selLang"
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
              >
                {SUPPORTED_LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* TESTING MODE */}
          <details className="test" open>
            <summary>
              {t.testModeTitle} <small>{t.testModeSub}</small>
            </summary>
            <div className="test-body">
              <div className="row">
                <label className="field" htmlFor="inLat">
                  {t.latLabel}
                  <input
                    className="inp"
                    id="inLat"
                    inputMode="decimal"
                    value={testLat}
                    onChange={(e) => setTestLat(e.target.value)}
                  />
                </label>
                <label className="field" htmlFor="inLng">
                  {t.lngLabel}
                  <input
                    className="inp"
                    id="inLng"
                    inputMode="decimal"
                    value={testLng}
                    onChange={(e) => setTestLng(e.target.value)}
                  />
                </label>
                <button
                  className="btn"
                  id="btnApply"
                  type="button"
                  onClick={handleApplyCustomCoords}
                >
                  {t.applyCoordsBtn}
                </button>
              </div>

              <div className="presets" id="presets" aria-label="Vị trí mẫu">
                {t.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    className="chip"
                    type="button"
                    onClick={() => {
                      setTestLat(String(preset.lat));
                      setTestLng(String(preset.lng));
                      applyPosition(preset.lat, preset.lng, 'Vị trí thử nghiệm');
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </details>
        </section>

        {/* STATUS BAR */}
        <p className="status" id="status" role="status">
          {statusMessage}
        </p>

        {/* 2-COLUMN GRID (Map ~65% / POI List ~35%) */}
        <div className="grid">
          {/* MAP COLUMN */}
          <section className="mapcol" aria-label="Bản đồ">
            <div className="mapbox">
              <MapContainer
                center={[10.7769, 106.6954]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '100%', minHeight: '560px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                  userPos={userPos}
                  radius={radius}
                  selectedPoi={activeSelectedPoi}
                  pois={pois}
                />

                {/* Tour itinerary Polyline */}
                <Polyline
                  positions={pois.map((p) => [p.lat, p.lng])}
                  color="#E9A23B"
                  weight={3}
                  dashArray="4, 8"
                  opacity={0.8}
                />

                {/* User GPS & Radius Circle */}
                {userPos && (
                  <>
                    <Circle
                      center={[userPos.lat, userPos.lng]}
                      radius={radius}
                      pathOptions={{
                        color: '#1F6FEB',
                        fillColor: '#1F6FEB',
                        fillOpacity: 0.12,
                        weight: 1.5,
                      }}
                    />
                    <Marker position={[userPos.lat, userPos.lng]} icon={userGpsIcon}>
                      <Popup>
                        <div style={{ padding: '4px', textAlign: 'center', fontSize: '13px' }}>
                          <b>{userLabel}</b>
                          <div>{t.radiusLabel}: {radius} m</div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* 5 Numbered POI Markers */}
                {pois.map((p, idx) => {
                  const isSelected = p.id === selectedId;
                  const isCurPlaying = p.id === currentId && isPlaying;
                  return (
                    <Marker
                      key={p.id}
                      position={[p.lat, p.lng]}
                      icon={createMarkerIcon(idx + 1, isSelected, isCurPlaying)}
                      eventHandlers={{
                        click: () => {
                          setSelectedId(p.id);
                          const el = document.querySelector(`.card[data-id="${p.id}"]`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        },
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '180px', padding: '4px' }}>
                          <h4 style={{ margin: '0 0 4px', color: '#8B2E16', fontSize: '14px' }}>
                            {idx + 1}. {getPoiName(p)}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#6A584D', marginBottom: '8px' }}>
                            {getPoiCategory(p)}
                          </div>
                          <button
                            type="button"
                            className="listen"
                            style={{ width: '100%', minHeight: '34px', fontSize: '12px' }}
                            onClick={() => playPoi(p.id, false)}
                          >
                            {isCurPlaying ? t.pauseBtn : t.listenBtn}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {userPos && isUserOutside && (
                <div className="userchip">{t.mapUserOutside}</div>
              )}
            </div>
            <p className="cap">{t.mapCaption}</p>
          </section>

          {/* LIST COLUMN */}
          <section aria-label="Danh sách điểm">
            <div className="listhead">
              <h2>{t.listTitle}</h2>
              <span id="sortnote">{userPos ? t.sortNearest : t.sortTour}</span>
            </div>

            <ol className="list" id="list">
              {sortedPois.map(({ poi, originalIndex, dist }) => {
                const isSelected = selectedId === poi.id;
                const isCur = currentId === poi.id;
                const isItemPlaying = isCur && isPlaying;
                const inTrigger = dist !== null && dist <= poi.triggerRadius;
                const inRadius = dist !== null && dist <= radius;

                return (
                  <li
                    key={poi.id}
                    className={`card ${isSelected ? 'sel' : ''} ${isItemPlaying ? 'playing' : ''}`}
                    data-id={poi.id}
                    onClick={() => setSelectedId(poi.id)}
                  >
                    <div className="idx">{originalIndex + 1}</div>

                    <div className="thumb">
                      <img
                        alt={getPoiName(poi)}
                        loading="lazy"
                        src={poi.image}
                        onError={(e) => {
                          // Hide broken image so clean gradient remains visible
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="body">
                      <div className="tags">
                        <span className="tag">{getPoiCategory(poi)}</span>
                        {inTrigger && <span className="tag in">{t.inZoneBadge}</span>}
                        {!inTrigger && inRadius && <span className="tag near">{t.nearBadge}</span>}
                      </div>

                      <h3>{getPoiName(poi)}</h3>

                      <div className="meta">
                        {dist !== null ? (
                          <span className="dist">{t.distFormat(formatDist(dist))}</span>
                        ) : (
                          <span>{t.turnOnGpsDist}</span>
                        )}

                        <span className="lg" aria-label={t.langVoiceAria}>
                          {(['vi', 'en', 'ko', 'ja', 'zh'] as SupportedLanguage[]).map((l) => {
                            const isAvailable =
                              poi.audio[l] !== undefined &&
                              poi.audio[l] !== 0 &&
                              poi.audio[l] !== '';
                            return (
                              <i
                                key={l}
                                className={isAvailable ? '' : 'off'}
                                title={
                                  isAvailable
                                    ? `Có giọng đọc ${LANG_DISPLAY_NAMES[currentLang][l]}`
                                    : `Chưa có giọng đọc ${LANG_DISPLAY_NAMES[currentLang][l]}`
                                }
                              >
                                {l.toUpperCase()}
                              </i>
                            );
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      className="listen"
                      type="button"
                      data-id={poi.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCur) {
                          togglePlay();
                        } else {
                          playPoi(poi.id, false);
                        }
                      }}
                    >
                      {isItemPlaying ? (
                        <>
                          <span className="wave" aria-hidden="true">
                            <b />
                            <b />
                            <b />
                          </span>
                          {t.pauseBtn.replace('❚❚ ', '')}
                        </>
                      ) : isCur && !isItemPlaying && currentTime > 0 ? (
                        t.resumeBtn
                      ) : (
                        t.listenBtn
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>

      {/* STICKY BOTTOM AUDIO PLAYER */}
      <footer className="player" aria-label="Trình phát thuyết minh">
        <div className="p-in">
          {/* Transcript view box */}
          {showTranscript && activePlayingPoi && (
            <div className="tx" id="tx">
              {(() => {
                const res = resolveAudio(activePlayingPoi);
                return (
                  <>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>{res.text}</p>
                    {res.actualTxLang !== currentLang && (
                      <small style={{ color: '#E9A23B', display: 'block', marginTop: '6px' }}>
                        {t.fallbackTxNotice(LANG_DISPLAY_NAMES[currentLang][currentLang])}
                      </small>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="p-row">
            {/* Title & Status */}
            <div>
              <div className="p-title" id="pTitle">
                {activePlayingPoi ? getPoiName(activePlayingPoi) : t.noPoiSelected}
              </div>
              <div className={`p-sub ${noticeWarn ? 'warn' : ''}`} id="pSub">
                {notice ||
                  (activePlayingPoi
                    ? isPlaying
                      ? t.playingInLang(LANG_DISPLAY_NAMES[currentLang][currentLang])
                      : t.pausedStatus
                    : t.clickToStart)}
              </div>
            </div>

            {/* Controls: Play/Pause, Progress Bar, Duration */}
            <div className="p-mid">
              <button
                className="pp"
                id="pPlay"
                type="button"
                disabled={!activePlayingPoi}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
              </button>

              <div
                className="bar"
                id="pBar"
                role="progressbar"
                aria-label="Tiến trình"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={duration > 0 ? Math.round((currentTime / duration) * 100) : 0}
                onClick={(e) => {
                  if (!duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setCurrentTime(fraction * duration);
                  if (activePlayingPoi && isPlaying) {
                    playPoi(activePlayingPoi.id, false);
                  }
                }}
              >
                <i
                  id="pFill"
                  style={{
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  }}
                />
              </div>

              <span className="time" id="pTime">
                {formatMmSs(currentTime)} / {formatMmSs(duration)}
              </span>
            </div>

            {/* Extras: Speed, Transcript Toggle, Language dropdown */}
            <div className="p-r">
              <label htmlFor="selSpeed" style={{ position: 'absolute', left: '-9999px' }}>
                {t.speedLabel}
              </label>
              <select
                className="sel"
                id="selSpeed"
                value={speed}
                onChange={(e) => {
                  const spd = parseFloat(e.target.value);
                  setSpeed(spd);
                  if (isPlaying && activePlayingPoi) {
                    playPoi(activePlayingPoi.id, false);
                  }
                }}
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
              </select>

              <button
                className="btn"
                id="btnTx"
                type="button"
                aria-pressed={showTranscript}
                disabled={!activePlayingPoi}
                onClick={() => setShowTranscript((prev) => !prev)}
              >
                {showTranscript ? t.hideTextBtn : t.viewTextBtn}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NearbyPage;
