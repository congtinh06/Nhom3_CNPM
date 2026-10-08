import React, { useState, useCallback, useMemo } from 'react';
import nearbyPoisData from '../content/nearbyPois.json';
import { useNavbarLanguage } from '../content/languages';
import { SupportedLanguage } from '../types';
import { useAutoNarration, haversine, formatDist } from '../hooks/useAutoNarration';
import { useNearbyAudio } from '../hooks/useNearbyAudio';

// Components
import { PoiHeader } from '../components/nearby/PoiHeader';
import { ToolbarControls } from '../components/nearby/ToolbarControls';
import { PoiMap } from '../components/nearby/PoiMap';
import { PoiList } from '../components/nearby/PoiList';
import { AudioPlayerBar } from '../components/nearby/AudioPlayerBar';
import '../styles/nearby.css';

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
  stopOrder?: number;
}

// Complete UI Translations for Nearby Page
export const NEARBY_I18N: Record<
  SupportedLanguage,
  {
    heroEyebrow: string;
    heroTitle: string;
    heroDesc: string;
    myLocationBtn: string;
    radiusLabel: string;
    autoNarration: string;
    languageLabel: string;
    noLocationStatus: string;
    nearestPrefix: string;
    nearestSuffix: (name: string, dist: string) => string;
    farNotice: string;
    gpsError: string;
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
    noLocationStatus: 'Chưa có vị trí của bạn. Danh sách xếp theo thứ tự tour, vẫn nghe được ngay.',
    nearestPrefix: 'điểm gần nhất là',
    nearestSuffix: (name, dist) => `điểm gần nhất là <b>${name}</b>, cách ${dist}.`,
    farNotice: 'Bạn đang ở khá xa tour nhưng danh sách vẫn hiện đủ 5 điểm.',
    gpsError:
      'Không lấy được vị trí. Hãy cho phép truy cập vị trí trong trình duyệt. Danh sách vẫn hiện đủ 5 điểm.',
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
    fallbackNotice: (lang) => `Chưa có bản ${lang}, đang phát tiếng Việt.`,
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
    noLocationStatus:
      'Location not detected yet. Attractions are ordered by tour itinerary and ready to play.',
    nearestPrefix: 'nearest spot is',
    nearestSuffix: (name, dist) => `nearest spot is <b>${name}</b>, ${dist} away.`,
    farNotice: 'You are currently far from the tour, but all 5 landmarks remain accessible.',
    gpsError:
      'Could not retrieve GPS position. Please allow location permissions in your browser.',
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
      `No ${lang} version available, playing Vietnamese version.`,
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
    noLocationStatus: '위치가 설정되지 않았습니다. 투어 순서대로 정렬되며 바로 청취 가능합니다.',
    nearestPrefix: '가장 가까운 명소는',
    nearestSuffix: (name, dist) => `가장 가까운 명소는 <b>${name}</b> (${dist} 거리)입니다.`,
    farNotice: '투어 코스에서 다소 멀리 떨어져 있지만 5개 명소 모두 확인 가능합니다.',
    gpsError: '위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 허용해 주세요.',
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
    fallbackNotice: (lang) =>
      `이 명소는 ${lang} 음성이 지원되지 않아 베트남어로 재생됩니다.`,
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
    noLocationStatus:
      '位置情報が未設定です。ツアー推奨順に並んでおり、いつでも音声を再生できます。',
    nearestPrefix: '最寄りのスポットは',
    nearestSuffix: (name, dist) => `最寄りのスポットは<b>${name}</b>（距離 ${dist}）です。`,
    farNotice: '現在ツアーエリアから離れていますが、5か所すべて閲覧できます。',
    gpsError: '現在地を取得できませんでした。ブラウザの位置情報アクセスを許可してください。',
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
      `${lang}版がないため、ベトナム語版を再生しています。`,
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
    noLocationStatus: '尚未获取您的位置。列表按行程顺序展示，可立即点击收听。',
    nearestPrefix: '最近的景点是',
    nearestSuffix: (name, dist) => `最近的景点是 <b>${name}</b>，距离 ${dist}。`,
    farNotice: '您当前距离游览路线较远，但 5 处景点均正常展示。',
    gpsError: '无法获取地理位置，请在浏览器中允许位置访问权限。',
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
    fallbackNotice: (lang) => `暂无${lang}版本，正在播放越南语解说。`,
    autoTriggerNotice: (name) => `您已抵达 ${name} 附近，自动为您播放语音讲解。`,
    viewTextBtn: '查看文本',
    hideTextBtn: '隐藏文本',
    speedLabel: '倍速',
    fallbackTxNotice: (lang) => `暂无${lang}文本，正在显示越南语原文。`,
    increaseRadiusBtn: '扩大半径',
    noPoiInRadius: '所选半径范围内暂无景点。',
  },
};

export const NearbyPage: React.FC = () => {
  const { lang, changeLanguage } = useNavbarLanguage();
  const currentLang = (lang as SupportedLanguage) || 'vi';
  const t = NEARBY_I18N[currentLang] || NEARBY_I18N.vi;

  const pois: GeoPoi[] = nearbyPoisData as GeoPoi[];

  // Toolbar & map states
  const [radius, setRadius] = useState<number>(1000);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Helper getters
  const getPoiName = useCallback(
    (poi: GeoPoi) => poi.name[currentLang] || poi.name.vi,
    [currentLang]
  );

  const getPoiCategory = useCallback(
    (poi: GeoPoi) => poi.category[currentLang] || poi.category.vi,
    [currentLang]
  );

  // Audio Hook
  const {
    currentId,
    isPlaying,
    currentTime,
    duration,
    speed,
    showTranscript,
    setShowTranscript,
    notice,
    noticeWarn,
    resolveAudio,
    playPoi,
    togglePlay,
    changeSpeed,
    seekTime,
  } = useNearbyAudio({
    pois,
    currentLang,
    fallbackNoticeText: t.fallbackNotice,
    autoTriggerNoticeText: t.autoTriggerNotice,
    getPoiName,
  });

  // Auto Narration & GPS Hook
  const {
    userPos,
    gpsError,
    requestGps,
    checkAutoTrigger,
    setAutoDirect,
  } = useAutoNarration({
    pois,
    isAutoEnabled,
    currentPlayingId: currentId,
    isPlaying,
    playPoi: (poiId, isAuto) => {
      setSelectedId(poiId);
      playPoi(poiId, isAuto);
    },
    gpsErrorMessage: t.gpsError,
  });

  // Calculate sorted POIs (Closest first if userPos exists; otherwise tour order by stopOrder)
  const sortedPois = useMemo(() => {
    const list = pois.map((p, index) => {
      const dist = userPos ? haversine(userPos.lat, userPos.lng, p.lat, p.lng) : null;
      return { poi: p, originalIndex: index, dist };
    });
    if (userPos) {
      list.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
    } else {
      list.sort(
        (a, b) =>
          (a.poi.stopOrder ?? (a.originalIndex + 1)) -
          (b.poi.stopOrder ?? (b.originalIndex + 1))
      );
    }
    return list;
  }, [pois, userPos]);

  // Active playing or selected POI
  const activeSelectedPoi = useMemo(
    () => pois.find((p) => p.id === (currentId || selectedId)) || null,
    [pois, currentId, selectedId]
  );

  // Single Status message above list
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
  }, [gpsError, userPos, sortedPois, t, getPoiName]);

  const handleSelectPoiAndScroll = useCallback((poiId: string) => {
    setSelectedId(poiId);
    const container = document.querySelector('.poi-cards-scroll');
    const el = document.querySelector(`.poi-card-item[data-id="${poiId}"]`) as HTMLElement | null;
    if (container && el) {
      const topPos = el.offsetTop - (container as HTMLElement).offsetTop;
      container.scrollTo({ top: Math.max(0, topPos - 12), behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="nearby-sv-root">
      {/* 1. COMPACT HEADER (<= 160px height) */}
      <PoiHeader
        eyebrow={t.heroEyebrow}
        title={t.heroTitle}
        description={t.heroDesc}
      />

      {/* 2. MAIN WORKSPACE */}
      <main className="wrap nearby-main-wrap">
        {/* TOOLBAR (1 ROW) */}
        <ToolbarControls
          myLocationBtnText={t.myLocationBtn}
          autoNarrationText={t.autoNarration}
          languageLabelText={t.languageLabel}
          radiusLabelText={t.radiusLabel}
          isAutoEnabled={isAutoEnabled}
          onToggleAuto={() => {
            const nextVal = !isAutoEnabled;
            setIsAutoEnabled(nextVal);
            setAutoDirect(nextVal);
            if (nextVal && userPos) {
              checkAutoTrigger(userPos.lat, userPos.lng);
            }
          }}
          onRequestGps={requestGps}
          currentLang={currentLang}
          onChangeLanguage={changeLanguage}
          radius={radius}
          onChangeRadius={setRadius}
        />

        {/* 2-COLUMN FIRST-SCREEN LAYOUT: Map (~60%) & List (~40%) */}
        <div className="grid nearby-2col-layout">
          {/* MAP COLUMN */}
          <section className="mapcol" aria-label="Bản đồ các điểm du lịch">
            <PoiMap
              pois={pois}
              selectedPoiId={selectedId}
              currentPlayingId={currentId}
              isPlaying={isPlaying}
              userPos={userPos}
              radius={radius}
              isAutoEnabled={isAutoEnabled}
              onSelectPoi={handleSelectPoiAndScroll}
              onPlayPoi={(poiId) => {
                setSelectedId(poiId);
                playPoi(poiId, false);
              }}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              listenBtnText={t.listenBtn}
              pauseBtnText={t.pauseBtn}
              radiusLabelText={t.radiusLabel}
              mapCaptionText={t.mapCaption}
            />
          </section>

          {/* LIST COLUMN */}
          <PoiList
            sortedPois={sortedPois}
            selectedPoiId={selectedId}
            currentPlayingId={currentId}
            isPlaying={isPlaying}
            currentLang={currentLang}
            radius={radius}
            statusMessage={statusMessage}
            listTitle={t.listTitle}
            sortNoteText={userPos ? t.sortNearest : t.sortTour}
            onSelectPoi={setSelectedId}
            onTogglePlay={(poiId) => {
              setSelectedId(poiId);
              if (currentId === poiId) {
                togglePlay();
              } else {
                playPoi(poiId, false);
              }
            }}
            getPoiName={getPoiName}
            getPoiCategory={getPoiCategory}
            inZoneBadgeText={t.inZoneBadge}
            nearBadgeText={t.nearBadge}
            distFormatText={t.distFormat}
            langVoiceAriaText={t.langVoiceAria}
            listenBtnText={t.listenBtn}
            pauseBtnText={t.pauseBtn}
            resumeBtnText={t.resumeBtn}
          />
        </div>
      </main>

      {/* 3. STICKY MINI AUDIO PLAYER */}
      <AudioPlayerBar
        activePoi={activeSelectedPoi}
        currentLang={currentLang}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        speed={speed}
        showTranscript={showTranscript}
        notice={notice}
        noticeWarn={noticeWarn}
        onTogglePlay={togglePlay}
        onSeek={seekTime}
        onChangeSpeed={changeSpeed}
        onToggleTranscript={() => setShowTranscript((prev) => !prev)}
        resolveAudio={resolveAudio}
        getPoiName={getPoiName}
        noPoiSelectedText={t.noPoiSelected}
        playingInLangText={t.playingInLang}
        pausedStatusText={t.pausedStatus}
        clickToStartText={t.clickToStart}
        speedLabelText={t.speedLabel}
        viewTextBtnText={t.viewTextBtn}
        hideTextBtnText={t.hideTextBtn}
        fallbackTxNoticeText={t.fallbackTxNotice}
      />
    </div>
  );
};

export default NearbyPage;
