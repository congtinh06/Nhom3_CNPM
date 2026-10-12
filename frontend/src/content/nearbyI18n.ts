import { SupportedLanguage } from '../types';

export type NearbyKey =
  | 'heroEyebrow'
  | 'pageTitle'
  | 'pageSubtitle'
  | 'breadcrumbHome'
  | 'breadcrumbTour'
  | 'headerAriaLabel'
  | 'breadcrumbAriaLabel'
  | 'statsAriaLabel'
  | 'statStops'
  | 'statLanguages'
  | 'statTotalDistance'
  | 'statProgress'
  | 'statProgressTitle'
  | 'toolbarAriaLabel'
  | 'languageSelectLabel'
  | 'autoNarration'
  | 'myLocation'
  | 'simMode'
  | 'simModeActive'
  | 'simModeStartTitle'
  | 'simModeStopTitle'
  | 'gpsDisabledInSimTitle'
  | 'settingsBtnTitle'
  | 'settingsDialogAriaLabel'
  | 'radiusLabel'
  | 'radiusOptionDefault'
  | 'radiusOption50m'
  | 'progressSectionTitle'
  | 'resetProgressBtn'
  | 'statusTrackingGps'
  | 'statusSimActive'
  | 'statusNearestSummary'
  | 'noLocationStatus'
  | 'farNotice'
  | 'nearestPrefix'
  | 'nearestSuffix'
  | 'mapAriaLabel'
  | 'mapCaption'
  | 'simBannerLabel'
  | 'simBannerDesc'
  | 'simBannerExit'
  | 'simBannerExitTitle'
  | 'simTag'
  | 'mapLocateBtnTitle'
  | 'mapLocateBtnNoGps'
  | 'mapLocateBtnAria'
  | 'mapFitTourTitle'
  | 'mapZoomIn'
  | 'mapZoomOut'
  | 'tileErrorBanner'
  | 'retryBtn'
  | 'selectedCardAria'
  | 'selectedCardClose'
  | 'popupListenedTag'
  | 'chaptersAriaLabel'
  | 'listTitle'
  | 'sortNearest'
  | 'sortTour'
  | 'inZoneBadge'
  | 'nearBadge'
  | 'distFormat'
  | 'turnOnGpsDist'
  | 'listenedTitle'
  | 'readerBoxAria'
  | 'localNameLabel'
  | 'vietnameseContentNote'
  | 'fallbackTxNotice'
  | 'langVoiceAria'
  | 'langChipAvailable'
  | 'langChipUnavailable'
  | 'langChipCurrent'
  | 'langChipSwitch'
  | 'playBtn'
  | 'pauseBtn'
  | 'resumeBtn'
  | 'playerAriaLabel'
  | 'noPoiSelected'
  | 'clickToStart'
  | 'playingInLang'
  | 'pausedStatus'
  | 'fallbackNotice'
  | 'autoTriggerNotice'
  | 'speedLabel'
  | 'viewTranscriptBtn'
  | 'playerProgressBarAria'
  | 'speechEngineTag'
  | 'speechEngineAria'
  | 'clickToPlayNotice'
  | 'cannotResumeNotice'
  | 'gpsErrorGeneric'
  | 'gpsErrorDenied'
  | 'gpsErrorUnavailable'
  | 'gpsErrorTimeout'
  | 'gpsErrorSimActive'
  | 'gpsErrorNotSupported'
  | 'gpsErrorInsecure'
  | 'audioFallbackStatic'
  | 'audioFallbackSpeech'
  | 'prevBtn'
  | 'nextBtn'
  | 'prevStop'
  | 'nextStop'
  | 'audioFallbackNotice'
  | 'noTranscript'
  | 'addressLabel'
  | 'distanceLabel'
  | 'stopListHeading'
  | 'stopListAria'
  | 'detailAreaAria'
  | 'noVoiceForLanguage';

export const NATIVE_LANG_NAMES: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

export const LANG_DISPLAY_NAMES: Record<SupportedLanguage, Record<SupportedLanguage, string>> = {
  vi: { vi: 'tiếng Việt', en: 'tiếng Anh', ko: 'tiếng Hàn', ja: 'tiếng Nhật' },
  en: { vi: 'Vietnamese', en: 'English', ko: 'Korean', ja: 'Japanese' },
  ko: { vi: '베트남어', en: '영어', ko: '한국어', ja: '일본어' },
  ja: { vi: 'ベトナム語', en: '英語', ko: '韓国語', ja: '日本語' },
};

export const NEARBY_DICTIONARY: Record<SupportedLanguage, Record<NearbyKey, string>> = {
  vi: {
    heroEyebrow: 'TUYẾN THUYẾT MINH · 5 ĐIỂM',
    pageTitle: 'Điểm du lịch Sài Gòn',
    pageSubtitle:
      '5 điểm có thuyết minh. Bấm Phát ở bất kỳ điểm nào để phát ngay, hoặc bật thuyết minh tự động để trang tự phát khi bạn đi tới gần.',
    breadcrumbHome: 'Trang chủ',
    breadcrumbTour: 'Điểm du lịch',
    headerAriaLabel: 'Tiêu đề trang điểm du lịch',
    breadcrumbAriaLabel: 'Đường dẫn trang',
    statsAriaLabel: 'Thống kê tour',
    statStops: '{count} điểm tham quan',
    statLanguages: '{count} ngôn ngữ',
    statTotalDistance: '~{distance} tổng hành trình',
    statProgress: '{listened}/{total} đã nghe',
    statProgressTitle: 'Đã nghe {listened}/{total} điểm trong hành trình',
    toolbarAriaLabel: 'Bảng điều khiển tour',
    languageSelectLabel: 'Ngôn ngữ',
    autoNarration: 'Thuyết minh tự động',
    myLocation: 'Vị trí của tôi',
    simMode: 'Giả lập vị trí',
    simModeActive: 'Đang giả lập',
    simModeStartTitle: 'Bật chế độ giả lập vị trí để thử nghiệm trên bản đồ',
    simModeStopTitle: 'Đang bật giả lập vị trí. Bấm để tắt',
    gpsDisabledInSimTitle: 'Đang ở chế độ giả lập. Tắt giả lập để dùng GPS thật',
    settingsBtnTitle: 'Cài đặt bán kính và hành trình',
    settingsDialogAriaLabel: 'Cài đặt bán kính',
    radiusLabel: 'Bán kính gần bạn',
    radiusOptionDefault: 'Mặc định theo điểm (50m - 100m)',
    radiusOption50m: '50 m (Đi bộ gần)',
    progressSectionTitle: 'Tiến độ nghe:',
    resetProgressBtn: 'Đặt lại tiến độ tour',
    statusTrackingGps: 'Đang theo dõi vị trí...',
    statusSimActive: 'Chế độ giả lập đang bật. Bấm hoặc kéo trên bản đồ để di chuyển.',
    statusNearestSummary: 'Gần nhất: {name} ({dist})',
    noLocationStatus: 'Chưa có vị trí của bạn. Danh sách xếp theo thứ tự tour, vẫn nghe được ngay.',
    farNotice: 'Bạn đang ở khá xa tour nhưng danh sách vẫn hiện đủ 5 điểm.',
    nearestPrefix: 'điểm gần nhất là',
    nearestSuffix: 'điểm gần nhất là <b>{name}</b>, cách {dist}.',
    mapAriaLabel: 'Bản đồ tương tác các điểm du lịch',
    mapCaption: 'Bản đồ tương tác OpenStreetMap hiển thị vị trí 5 điểm di sản văn hóa Sài Gòn.',
    simBannerLabel: 'Chế độ giả lập',
    simBannerDesc: 'Bấm hoặc kéo chấm tròn để di chuyển',
    simBannerExit: 'Tắt',
    simBannerExitTitle: 'Tắt chế độ giả lập',
    simTag: 'Giả lập',
    mapLocateBtnTitle: 'Di chuyển đến vị trí của bạn',
    mapLocateBtnNoGps: 'Chưa có vị trí GPS',
    mapLocateBtnAria: 'Đến vị trí của bạn trên bản đồ',
    mapFitTourTitle: 'Xem toàn bộ tour',
    mapZoomIn: 'Phóng to',
    mapZoomOut: 'Thu nhỏ',
    tileErrorBanner: 'Không tải được một số ô bản đồ. Thuyết minh vẫn hoạt động bình thường.',
    retryBtn: 'Thử lại',
    selectedCardAria: 'Thông tin điểm dừng đang chọn',
    selectedCardClose: 'Đóng thẻ địa điểm',
    popupListenedTag: '(Đã nghe)',
    chaptersAriaLabel: 'Nội dung các chặng tour',
    listTitle: '5 điểm thuyết minh',
    sortNearest: 'Gần nhất lên trước',
    sortTour: 'Theo thứ tự tour',
    inZoneBadge: 'Đã vào vùng thuyết minh',
    nearBadge: 'Gần bạn',
    distFormat: 'Cách bạn {dist}',
    turnOnGpsDist: 'Bật vị trí để xem khoảng cách',
    listenedTitle: 'Đã nghe điểm này trong tour',
    readerBoxAria: 'Nội dung lời thuyết minh {name}',
    localNameLabel: 'Tên gọi tại địa phương',
    vietnameseContentNote: 'Nội dung tiếng Việt',
    fallbackTxNotice: 'Chưa có văn bản {lang}, đang hiện tiếng Việt.',
    langVoiceAria: 'Ngôn ngữ có giọng đọc',
    langChipAvailable: 'Có bản dịch {lang}',
    langChipUnavailable: 'Chưa có bản dịch {lang}',
    langChipCurrent: '(đang chọn)',
    langChipSwitch: 'bấm để chuyển',
    playBtn: 'Phát',
    pauseBtn: 'Tạm dừng',
    resumeBtn: 'Phát tiếp',
    playerAriaLabel: 'Trình phát thuyết minh du lịch',
    noPoiSelected: 'Chưa chọn điểm nào',
    clickToStart: 'Bấm Phát ở một điểm để bắt đầu.',
    playingInLang: 'Đang phát bằng {lang}',
    pausedStatus: 'Đã tạm dừng',
    fallbackNotice: 'Chưa có bản {lang}, đang phát tiếng Việt.',
    autoTriggerNotice: 'Bạn đã tới gần {name}, tự động phát thuyết minh.',
    speedLabel: 'Tốc độ',
    viewTranscriptBtn: 'Xem lời thuyết minh',
    playerProgressBarAria: 'Tiến trình phát âm thanh',
    speechEngineTag: 'Giọng đọc hệ thống',
    speechEngineAria: 'Giọng đọc hệ thống đang phát',
    clickToPlayNotice: 'Bấm để phát',
    cannotResumeNotice: 'Không thể phát tiếp âm thanh.',
    gpsErrorGeneric:
      'Không lấy được vị trí. Hãy cho phép truy cập vị trí trong trình duyệt. Danh sách vẫn hiện đủ 5 điểm.',
    gpsErrorDenied: 'Quyền truy cập vị trí đã bị từ chối. Bạn vẫn có thể bấm nghe thủ công bình thường.',
    gpsErrorUnavailable: 'Không xác định được vị trí GPS. Vui lòng thử lại sau.',
    gpsErrorTimeout: 'Hết thời gian chờ lấy vị trí GPS.',
    gpsErrorSimActive: 'Đang ở chế độ giả lập vị trí. Tắt chế độ giả lập để dùng GPS thật.',
    gpsErrorNotSupported: 'Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS.',
    gpsErrorInsecure: 'Định vị GPS yêu cầu kết nối bảo mật HTTPS.',
    audioFallbackStatic: 'Âm thanh trực tuyến lỗi. Đang chuyển sang âm thanh dự phòng...',
    audioFallbackSpeech: 'Âm thanh dự phòng không khả dụng. Chuyển sang giọng đọc hệ thống...',
    prevBtn: 'Chặng trước',
    nextBtn: 'Chặng sau',
    prevStop: 'Chặng trước: {name}',
    nextStop: 'Chặng sau: {name}',
    audioFallbackNotice: 'Chưa có bản ghi âm {lang}, đang phát tiếng Việt.',
    noTranscript: 'Chưa có bản dịch cho ngôn ngữ này',
    addressLabel: 'Địa chỉ',
    distanceLabel: 'Khoảng cách',
    stopListHeading: 'Danh sách điểm dừng',
    stopListAria: 'Danh sách các điểm dừng trong hành trình',
    detailAreaAria: 'Chi tiết điểm dừng đang chọn',
    noVoiceForLanguage: 'Thiết bị chưa có giọng đọc tiếng Việt.',
  },
  en: {
    heroEyebrow: 'AUDIO TOUR · 5 LANDMARKS',
    pageTitle: 'Saigon Attractions',
    pageSubtitle:
      '5 historic landmarks with audio guide. Click Play on any spot to listen immediately, or enable auto narration so the guide plays as you walk near.',
    breadcrumbHome: 'Home',
    breadcrumbTour: 'Tour',
    headerAriaLabel: 'Attractions page header',
    breadcrumbAriaLabel: 'Breadcrumbs',
    statsAriaLabel: 'Tour statistics',
    statStops: '{count} tour stops',
    statLanguages: '{count} languages',
    statTotalDistance: '~{distance} total itinerary',
    statProgress: '{listened}/{total} listened',
    statProgressTitle: 'Listened to {listened}/{total} tour stops',
    toolbarAriaLabel: 'Tour control bar',
    languageSelectLabel: 'Language',
    autoNarration: 'Auto narration',
    myLocation: 'My location',
    simMode: 'Simulate location',
    simModeActive: 'Simulating',
    simModeStartTitle: 'Enable location simulation for map testing',
    simModeStopTitle: 'Location simulation active. Click to disable',
    gpsDisabledInSimTitle: 'In simulation mode. Turn off simulation to use real GPS',
    settingsBtnTitle: 'Radius and tour settings',
    settingsDialogAriaLabel: 'Radius settings',
    radiusLabel: 'Search radius',
    radiusOptionDefault: 'Default per landmark (50m - 100m)',
    radiusOption50m: '50 m (close walking)',
    progressSectionTitle: 'Listening progress:',
    resetProgressBtn: 'Reset tour progress',
    statusTrackingGps: 'Tracking location...',
    statusSimActive: 'Simulation mode active. Click or drag on map to move.',
    statusNearestSummary: 'Closest: {name} ({dist})',
    noLocationStatus: 'Location not detected yet. Listed in tour order and ready to play.',
    farNotice: 'You are currently far from the tour, but all 5 landmarks remain accessible.',
    nearestPrefix: 'nearest spot is',
    nearestSuffix: 'nearest spot is <b>{name}</b>, {dist} away.',
    mapAriaLabel: 'Interactive tour map',
    mapCaption: 'Interactive OpenStreetMap showing 5 heritage landmarks of Saigon.',
    simBannerLabel: 'Simulation mode',
    simBannerDesc: 'Click or drag dot to move',
    simBannerExit: 'Exit',
    simBannerExitTitle: 'Exit simulation mode',
    simTag: 'Simulated',
    mapLocateBtnTitle: 'Move to your location',
    mapLocateBtnNoGps: 'GPS position unavailable',
    mapLocateBtnAria: 'Center on your location',
    mapFitTourTitle: 'Fit entire tour',
    mapZoomIn: 'Zoom in',
    mapZoomOut: 'Zoom out',
    tileErrorBanner: 'Some map tiles failed to load. Narration continues to function normally.',
    retryBtn: 'Retry',
    selectedCardAria: 'Selected landmark card',
    selectedCardClose: 'Close landmark card',
    popupListenedTag: '(Listened)',
    chaptersAriaLabel: 'Tour chapter contents',
    listTitle: '5 Audio Tour Spots',
    sortNearest: 'Closest first',
    sortTour: 'Tour order',
    inZoneBadge: 'In narration zone',
    nearBadge: 'Near you',
    distFormat: '{dist} away',
    turnOnGpsDist: 'Turn on GPS to view distance',
    listenedTitle: 'Listened to this stop in the tour',
    readerBoxAria: 'Narration text for {name}',
    localNameLabel: 'Local name',
    vietnameseContentNote: 'Content in Vietnamese',
    fallbackTxNotice: '{lang} transcript unavailable, displaying Vietnamese.',
    langVoiceAria: 'Available audio languages',
    langChipAvailable: 'Available in {lang}',
    langChipUnavailable: 'Unavailable in {lang}',
    langChipCurrent: '(current)',
    langChipSwitch: 'click to switch',
    playBtn: 'Play',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    playerAriaLabel: 'Tour audio player',
    noPoiSelected: 'No attraction selected',
    clickToStart: 'Click Play on any landmark to start playback.',
    playingInLang: 'Playing in {lang}',
    pausedStatus: 'Paused',
    fallbackNotice: 'No {lang} version available, playing Vietnamese version.',
    autoTriggerNotice: 'Arrived near {name}, auto narration started.',
    speedLabel: 'Speed',
    viewTranscriptBtn: 'View transcript',
    playerProgressBarAria: 'Audio playback progress',
    speechEngineTag: 'System speech',
    speechEngineAria: 'System speech playing',
    clickToPlayNotice: 'Click to play',
    cannotResumeNotice: 'Cannot resume audio playback.',
    gpsErrorGeneric:
      'Could not retrieve GPS position. Please allow location permissions in browser settings. All 5 landmarks remain accessible.',
    gpsErrorDenied: 'Location access denied. You can still manually play audio tours.',
    gpsErrorUnavailable: 'GPS position unavailable. Try again later.',
    gpsErrorTimeout: 'GPS request timed out.',
    gpsErrorSimActive: 'Location simulation active. Disable simulation to use real GPS.',
    gpsErrorNotSupported: 'Device or browser does not support GPS geolocation.',
    gpsErrorInsecure: 'GPS geolocation requires secure HTTPS connection.',
    audioFallbackStatic: 'Online audio failed. Switching to backup audio...',
    audioFallbackSpeech: 'Backup audio unavailable. Switching to system speech...',
    prevBtn: 'Previous',
    nextBtn: 'Next',
    prevStop: 'Previous: {name}',
    nextStop: 'Next: {name}',
    audioFallbackNotice: '{lang} audio unavailable, playing Vietnamese.',
    noTranscript: 'Transcript not available in this language',
    addressLabel: 'Address',
    distanceLabel: 'Distance',
    stopListHeading: 'Tour Stops',
    stopListAria: 'List of tour stops in the itinerary',
    detailAreaAria: 'Selected stop details',
    noVoiceForLanguage: 'No English voice found on this device.',
  },
  /* DRAFT: needs native review */
  ko: {
    heroEyebrow: '오디오 가이드 · 5대 명소',
    pageTitle: '사이공 관광 명소',
    pageSubtitle:
      '오디오 해설이 제공되는 5개 명소. 원하는 곳에서 재생 버튼을 눌러 바로 청취하거나, 자동 해설을 켜서 근처에 도착하면 자동으로 청취할 수 있습니다.',
    breadcrumbHome: '홈',
    breadcrumbTour: '투어',
    headerAriaLabel: '관광 명소 페이지 헤더',
    breadcrumbAriaLabel: '경로 탐색',
    statsAriaLabel: '투어 통계',
    statStops: '{count}개 명소',
    statLanguages: '{count}개 언어',
    statTotalDistance: '~{distance} 총 일정',
    statProgress: '{listened}/{total} 청취 완료',
    statProgressTitle: '전체 {total}개 중 {listened}개 명소 청취 완료',
    toolbarAriaLabel: '투어 제어 모음',
    languageSelectLabel: '언어',
    autoNarration: '자동 해설',
    myLocation: '내 위치',
    simMode: '위치 시뮬레이션',
    simModeActive: '시뮬레이션 중',
    simModeStartTitle: '지도 테스트를 위한 위치 시뮬레이션 활성화',
    simModeStopTitle: '위치 시뮬레이션 활성화 상태. 클릭하여 해제',
    gpsDisabledInSimTitle: '시뮬레이션 모드 상태입니다. 실제 GPS를 사용하려면 시뮬레이션을 끄세요',
    settingsBtnTitle: '반경 및 투어 설정',
    settingsDialogAriaLabel: '반경 설정',
    radiusLabel: '탐색 반경',
    radiusOptionDefault: '명소별 기본값 (50m - 100m)',
    radiusOption50m: '50 m (인접 도보)',
    progressSectionTitle: '청취 진행률:',
    resetProgressBtn: '투어 진행 초기화',
    statusTrackingGps: '위치 확인 중...',
    statusSimActive: '시뮬레이션 모드 활성화됨. 이동하려면 지도를 클릭하거나 드래그하세요.',
    statusNearestSummary: '가장 가까운 곳: {name} ({dist})',
    noLocationStatus: '위치가 확인되지 않았습니다. 투어 순서대로 정렬되며 바로 청취할 수 있습니다.',
    farNotice: '투어 경로에서 다소 떨어져 있으나 5개 명소 모두 청취 가능합니다.',
    nearestPrefix: '가장 가까운 명소는',
    nearestSuffix: '가장 가까운 명소는 <b>{name}</b> ({dist} 거리)입니다.',
    mapAriaLabel: '대화형 투어 지도',
    mapCaption: '사이공 5대 문화유산 위치를 표시하는 오픈스트리트맵.',
    simBannerLabel: '시뮬레이션 모드',
    simBannerDesc: '이동하려면 원을 클릭하거나 드래그하세요',
    simBannerExit: '종료',
    simBannerExitTitle: '시뮬레이션 모드 종료',
    simTag: '시뮬레이션',
    mapLocateBtnTitle: '내 위치로 이동',
    mapLocateBtnNoGps: 'GPS 위치 없음',
    mapLocateBtnAria: '지도에서 내 위치로 이동',
    mapFitTourTitle: '투어 전체 보기',
    mapZoomIn: '확대',
    mapZoomOut: '축소',
    tileErrorBanner: '일부 지도 타일을 불러오지 못했습니다. 오디오 해설은 정상 동작합니다.',
    retryBtn: '다시 시도',
    selectedCardAria: '선택된 명소 정보',
    selectedCardClose: '명소 카드 닫기',
    popupListenedTag: '(청취 완료)',
    chaptersAriaLabel: '투어 코스 내용',
    listTitle: '5개 오디오 해설 명소',
    sortNearest: '가까운 순',
    sortTour: '투어 추천 순',
    inZoneBadge: '해설 구역 진입',
    nearBadge: '가까운 위치',
    distFormat: '{dist} 거리',
    turnOnGpsDist: '거리를 확인하려면 위치를 켜세요',
    listenedTitle: '투어에서 이 명소를 청취했습니다',
    readerBoxAria: '{name} 해설 텍스트',
    localNameLabel: '현지 명칭',
    vietnameseContentNote: '베트남어 원문',
    fallbackTxNotice: '{lang} 텍스트가 없어 베트남어로 표시합니다.',
    langVoiceAria: '지원 언어',
    langChipAvailable: '{lang} 지원',
    langChipUnavailable: '{lang} 미지원',
    langChipCurrent: '(선택됨)',
    langChipSwitch: '클릭하여 전환',
    playBtn: '재생',
    pauseBtn: '일시정지',
    resumeBtn: '이어듣기',
    playerAriaLabel: '투어 오디오 플레이어',
    noPoiSelected: '선택된 명소 없음',
    clickToStart: '명소의 재생 버튼을 눌러 시작하세요.',
    playingInLang: '{lang} 오디오 재생 중',
    pausedStatus: '일시정지됨',
    fallbackNotice: '이 명소는 {lang} 음성이 지원되지 않아 베트남어로 재생됩니다.',
    autoTriggerNotice: '{name} 근처에 도착하여 자동 해설을 시작합니다.',
    speedLabel: '속도',
    viewTranscriptBtn: '해설 텍스트 보기',
    playerProgressBarAria: '오디오 재생 진행률',
    speechEngineTag: '시스템 음성',
    speechEngineAria: '시스템 음성 재생 중',
    clickToPlayNotice: '재생하려면 클릭하세요',
    cannotResumeNotice: '오디오를 이어서 재생할 수 없습니다.',
    gpsErrorGeneric: '위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인하세요. 5개 명소 모두 이용 가능합니다.',
    gpsErrorDenied: '위치 접근 권한이 거부되었습니다. 수동으로 오디오를 청취할 수 있습니다.',
    gpsErrorUnavailable: 'GPS 위치를 확인할 수 없습니다. 나중에 다시 시도하세요.',
    gpsErrorTimeout: 'GPS 위치 요청 시간이 초과되었습니다.',
    gpsErrorSimActive: '위치 시뮬레이션 모드 상태입니다. 실제 GPS를 사용하려면 시뮬레이션을 끄세요.',
    gpsErrorNotSupported: '기기 또는 브라우저가 GPS 위치 확인을 지원하지 않습니다.',
    gpsErrorInsecure: 'GPS 위치 확인은 보안 HTTPS 연결이 필요합니다.',
    audioFallbackStatic: '온라인 오디오 오류. 대체 오디오로 전환 중...',
    audioFallbackSpeech: '대체 오디오를 사용할 수 없습니다. 시스템 음성으로 전환 중...',
    prevBtn: '이전 명소',
    nextBtn: '다음 명소',
    prevStop: '이전: {name}',
    nextStop: '다음: {name}',
    audioFallbackNotice: '{lang} 음성이 지원되지 않아 베트남어로 재생 중입니다.',
    noTranscript: '이 언어의 해설 텍스트가 아직 제공되지 않습니다',
    addressLabel: '주소',
    distanceLabel: '거리',
    stopListHeading: '투어 코스 목록',
    stopListAria: '투어 코스 명소 목록',
    detailAreaAria: '선택된 명소 상세 정보',
    noVoiceForLanguage: '이 기기에는 한국어 음성이 지원되지 않습니다.',
  },
  /* DRAFT: needs native review */
  ja: {
    heroEyebrow: '音声ガイド · 5大名所',
    pageTitle: 'サイゴン観光スポット',
    pageSubtitle:
      '音声ガイド付きの5か所の名所。再生ボタンを押してすぐ聴くか、自動ガイドをオンにして近づいた際に自動再生できます。',
    breadcrumbHome: 'ホーム',
    breadcrumbTour: 'ツアー',
    headerAriaLabel: '観光スポットページヘッダー',
    breadcrumbAriaLabel: 'パンくずリスト',
    statsAriaLabel: 'ツアー統計',
    statStops: '{count}か所のスポット',
    statLanguages: '{count}言語',
    statTotalDistance: '総行程 約{distance}',
    statProgress: '{listened}/{total} 再生済み',
    statProgressTitle: '全{total}か所のうち{listened}か所を聴取済み',
    toolbarAriaLabel: 'ツアーコントロールバー',
    languageSelectLabel: '言語',
    autoNarration: '自動ガイド',
    myLocation: '現在地',
    simMode: '位置シミュレーション',
    simModeActive: 'シミュレーション中',
    simModeStartTitle: '地図テスト用の位置シミュレーションを有効化',
    simModeStopTitle: '位置シミュレーションが有効です。クリックして停止',
    gpsDisabledInSimTitle: 'シミュレーション中です。実際のGPSを使うには停止してください',
    settingsBtnTitle: '半径とツアーの設定',
    settingsDialogAriaLabel: '半径設定',
    radiusLabel: '検索半径',
    radiusOptionDefault: 'スポット規定値 (50m - 100m)',
    radiusOption50m: '50 m (近距離徒歩)',
    progressSectionTitle: '再生進捗:',
    resetProgressBtn: 'ツアー進捗をリセット',
    statusTrackingGps: '位置情報を取得中...',
    statusSimActive: 'シミュレーション中。地図をクリックまたはドラッグして移動できます。',
    statusNearestSummary: '最寄り: {name} ({dist})',
    noLocationStatus: '現在地が未取得です。ツアー順に並んでおりすぐに再生可能です。',
    farNotice: 'ツアー区域から離れていますが、5か所すべてご利用いただけます。',
    nearestPrefix: '最寄りのスポットは',
    nearestSuffix: '最寄りのスポットは<b>{name}</b>（{dist}）です。',
    mapAriaLabel: 'インタラクティブツアー地図',
    mapCaption: 'サイゴンの5大文化遺産を表示するオープンストリートマップ。',
    simBannerLabel: 'シミュレーションモード',
    simBannerDesc: 'ドットをクリックまたはドラッグして移動',
    simBannerExit: '終了',
    simBannerExitTitle: 'シミュレーションモードを終了',
    simTag: 'シミュレーション',
    mapLocateBtnTitle: '現在地に移動',
    mapLocateBtnNoGps: 'GPS位置情報なし',
    mapLocateBtnAria: '地図上の現在地に移動',
    mapFitTourTitle: 'ツアー全体を表示',
    mapZoomIn: '拡大',
    mapZoomOut: '縮小',
    tileErrorBanner: '一部の地図タイルを読み込めませんでした。音声ガイドは正常に利用できます。',
    retryBtn: '再試行',
    selectedCardAria: '選択中のスポット情報',
    selectedCardClose: 'スポットカードを閉じる',
    popupListenedTag: '(再生済み)',
    chaptersAriaLabel: 'ツアーチャプター内容',
    listTitle: '5つのガイドスポット',
    sortNearest: '近い順',
    sortTour: 'ツアー順',
    inZoneBadge: 'ガイド範囲内',
    nearBadge: '周辺',
    distFormat: '距離 {dist}',
    turnOnGpsDist: '位置情報をオンにして距離を表示',
    listenedTitle: 'このスポットをツアーで再生済みです',
    readerBoxAria: '{name}のガイドテキスト',
    localNameLabel: '現地の名称',
    vietnameseContentNote: 'ベトナム語の原文',
    fallbackTxNotice: '{lang}のテキストがないためベトナム語で表示しています。',
    langVoiceAria: '対応音声言語',
    langChipAvailable: '{lang}版あり',
    langChipUnavailable: '{lang}版なし',
    langChipCurrent: '(選択中)',
    langChipSwitch: 'クリックして切り替え',
    playBtn: '再生',
    pauseBtn: '一時停止',
    resumeBtn: '再開',
    playerAriaLabel: 'ツアー音声プレイヤー',
    noPoiSelected: 'スポット未選択',
    clickToStart: 'スポットの再生ボタンを押して開始してください。',
    playingInLang: '{lang}で再生中',
    pausedStatus: '一時停止中',
    fallbackNotice: '{lang}版がないためベトナム語版を再生しています。',
    autoTriggerNotice: '{name}の近くに到着しました。自動音声ガイドを開始します。',
    speedLabel: '速度',
    viewTranscriptBtn: 'ガイドテキストを表示',
    playerProgressBarAria: '音声再生進捗',
    speechEngineTag: 'システム音声',
    speechEngineAria: 'システム音声を再生中',
    clickToPlayNotice: 'クリックして再生',
    cannotResumeNotice: '音声を再開できません。',
    gpsErrorGeneric: '現在地を取得できませんでした。ブラウザの位置情報アクセスを許可してください。5か所すべて利用可能です。',
    gpsErrorDenied: '位置情報へのアクセスが拒否されました。手動で音声を再生できます。',
    gpsErrorUnavailable: 'GPS位置情報を取得できません。後ほど再試行してください。',
    gpsErrorTimeout: 'GPS位置情報の取得がタイムアウトしました。',
    gpsErrorSimActive: '位置シミュレーション中です。実際のGPSを使用するには停止してください。',
    gpsErrorNotSupported: '端末またはブラウザがGPS位置情報に対応していません。',
    gpsErrorInsecure: 'GPS位置情報の取得には安全なHTTPS接続が必要です。',
    audioFallbackStatic: 'オンライン音声エラー。予備音声に切り替えています...',
    audioFallbackSpeech: '予備音声を利用できません。システム音声に切り替えています...',
    prevBtn: '前のスポット',
    nextBtn: '次のスポット',
    prevStop: '前へ: {name}',
    nextStop: '次へ: {name}',
    audioFallbackNotice: '{lang}の音声がないためベトナム語で再生しています。',
    noTranscript: 'この言語の解説テキストはまだありません',
    addressLabel: '住所',
    distanceLabel: '距離',
    stopListHeading: 'スポット一覧',
    stopListAria: 'ツアー行程のスポット一覧',
    detailAreaAria: '選択中のスポット詳細',
    noVoiceForLanguage: 'このデバイスには日本語の音声がありません。',
  },
};

/* DRAFT: needs native review */
export const UNREVIEWED_CJK_KEYS: NearbyKey[] = [
  'prevBtn',
  'nextBtn',
  'prevStop',
  'nextStop',
  'audioFallbackNotice',
  'noTranscript',
  'addressLabel',
  'distanceLabel',
  'stopListHeading',
  'stopListAria',
  'detailAreaAria',
];

const LOCALE_MAP: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
};

export function formatDistance(metres: number, lang: SupportedLanguage): string {
  const locale = LOCALE_MAP[lang] || 'vi-VN';
  if (metres < 1000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
      Math.round(metres)
    );
    return `${formatted} m`;
  }
  const km = metres / 1000;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km);
  return `${formatted} km`;
}

export function formatNumber(num: number, lang: SupportedLanguage): string {
  const locale = LOCALE_MAP[lang] || 'vi-VN';
  return new Intl.NumberFormat(locale).format(num);
}

export function t(
  lang: SupportedLanguage,
  key: NearbyKey,
  params?: Record<string, string | number>
): string {
  const dict = NEARBY_DICTIONARY[lang];
  let text = dict ? dict[key] : undefined;
  if (!text) {
    if (import.meta.env.DEV) {
      console.warn(`[nearby i18n] Missing key "${key}" in language "${lang}", falling back to en`);
    }
    // Fall back to English only. Never fall back across languages to Vietnamese,
    // which would surface Vietnamese text in en/ja/ko UIs.
    text = NEARBY_DICTIONARY.en[key] ?? key;
  }
  if (params) {
    return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }
  return text;
}

export function getMissingKeysCount(): Record<SupportedLanguage, number> {
  const allKeys = Object.keys(NEARBY_DICTIONARY.vi) as NearbyKey[];
  const result: Record<SupportedLanguage, number> = { vi: 0, en: 0, ko: 0, ja: 0 };
  const languages: SupportedLanguage[] = ['vi', 'en', 'ko', 'ja'];
  for (const lang of languages) {
    let missing = 0;
    for (const key of allKeys) {
      if (!NEARBY_DICTIONARY[lang]?.[key]) {
        missing++;
      }
    }
    result[lang] = missing;
  }
  return result;
}
