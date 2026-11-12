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
  | 'directionsBtn'
  | 'directionsAria'
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
  | 'premiumLockedTitle'
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
  | 'noVoiceForLanguage'
  | 'qrCardAria'
  | 'qrScanHint'
  | 'qrDownload'
  | 'qrCopyLink'
  | 'qrLinkCopied'
  | 'qrShare'
  | 'qrLocalhostWarning'
  | 'narrationSlideAria'
  | 'sectionProgressAria'
  | 'photoCredit'
  | 'qrModalTitle'
  | 'qrShowBtn'
  | 'qrListenOnPhone'
  | 'qrCloseAria'
  | 'myLocationLocating'
  | 'simPanelTitle'
  | 'simPickStopLabel'
  | 'simManualLabel'
  | 'simLatLabel'
  | 'simLngLabel'
  | 'simApplyBtn'
  | 'simStopBtn'
  | 'simInvalidCoord'
  | 'gpsLocatedToast'
  | 'gpsOutsideRadiusNotice'
  | 'segmentTimeAria'
  | 'autoStatusOff'
  | 'autoStateOn'
  | 'autoStateOff'
  | 'autoStatusWaiting'
  | 'autoStatusTracking'
  | 'autoStatusDenied'
  | 'demoSection'
  | 'playerFabAria'
  | 'playerCloseAria'
  | 'shopViewAll'
  | 'shopEmptyDesc'
  | 'shopTitle'
  | 'shopSub'
  | 'heroCtaPlay'
  | 'heroCtaMap'
  | 'mapPanelTitle'
  | 'mapPanelSub'
  | 'mapStateReady'
  | 'mapStatePlaying'
  | 'mapStateAuto'
  | 'legendStop'
  | 'legendActive'
  | 'legendRoute'
  | 'faqTitle'
  | 'faqQ1'
  | 'faqA1'
  | 'faqQ2'
  | 'faqA2'
  | 'faqQ3'
  | 'faqA3'
  | 'faqQ4'
  | 'faqA4'
  | 'heroDisplayTitle'
  | 'heroDisplaySub'
  | 'factDistanceLabel'
  | 'factDistanceFallback'
  | 'factListenTimeLabel'
  | 'factListenTimeVal'
  | 'factLanguagesLabel'
  | 'factLanguagesVal'
  | 'factHeardLabel'
  | 'waveformAria'
  | 'tipsHeading'
  | 'listenThisStop'
  | 'onPhoneBtn'
  | 'itineraryTitle'
  | 'itineraryHalfDay'
  | 'itineraryFullDay'
  | 'how1Title'
  | 'how1Desc'
  | 'how2Title'
  | 'how2Desc'
  | 'how3Title'
  | 'how3Desc'
  | 'languageShowcaseTitle'
  | 'languageShowcaseSub'
  | 'languageSampleVi'
  | 'languageSampleEn'
  | 'languageSampleJa'
  | 'languageSampleKo'
  | 'languageFree'
  | 'languagePremium'
  | 'prepTitle'
  | 'prep1Title'
  | 'prep1Desc'
  | 'prep2Title'
  | 'prep2Desc'
  | 'prep3Title'
  | 'prep3Desc'
  | 'prep4Title'
  | 'prep4Desc'
  | 'toastAutoOn'
  | 'toastAutoOff'
  | 'toastLocating'
  | 'toastAddedToCart'
  | 'playerPlayingStop'
  | 'playerStopPosition'
  | 'playerSelectToStart'
  | 'shopNavAria'
  | 'shopPrevAria'
  | 'shopNextAria'
  | 'heroCtaFirst'
  | 'heroCtaContinue'
  | 'heroCtaReplay'
  | 'viewFullRoute'
  | 'mapRouteStops'
  | 'mapRouteDistance'
  | 'hideMapBtn'
  | 'showMapBtn'
  | 'stopSouvenirsLink'
  | 'rewind10Aria'
  | 'forward10Aria'
  | 'playbackSpeedAria'
  | 'audioLoadError'
  | 'premiumPlanPlain'
  | 'itineraryHalfDesc'
  | 'itineraryHalf1'
  | 'itineraryHalf2'
  | 'itineraryHalf3'
  | 'itineraryHalf4'
  | 'itineraryFullDesc'
  | 'itineraryFull1'
  | 'itineraryFull2'
  | 'itineraryFull3'
  | 'itineraryFull4'
  | 'itineraryFull5'
  | 'itineraryFull6'
  | 'itineraryFull7';

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
    heroEyebrow: 'Tuyến thuyết minh - 7 điểm',
    pageTitle: 'Điểm du lịch Sài Gòn',
    pageSubtitle:
      '7 điểm có thuyết minh. Bấm Phát ở bất kỳ điểm nào để phát ngay, hoặc bật thuyết minh tự động để trang tự phát khi bạn đi tới gần.',
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
    autoNarration: 'Tự động phát',
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
    farNotice: 'Bạn đang ở khá xa tour nhưng danh sách vẫn hiện đủ 7 điểm.',
    nearestPrefix: 'điểm gần nhất là',
    nearestSuffix: 'điểm gần nhất là <b>{name}</b>, cách {dist}.',
    mapAriaLabel: 'Bản đồ tương tác các điểm du lịch',
    mapCaption: 'Bản đồ tương tác Google Maps hiển thị vị trí 7 điểm di sản văn hóa Sài Gòn.',
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
    directionsBtn: 'Chỉ đường',
    directionsAria: 'Chỉ đường từ vị trí hiện tại đến {name}',
    popupListenedTag: '(Đã nghe)',
    chaptersAriaLabel: 'Nội dung các chặng tour',
    listTitle: '7 điểm thuyết minh',
    sortNearest: 'Gần nhất lên trước',
    sortTour: 'Theo thứ tự tour',
    inZoneBadge: 'Đã vào vùng thuyết minh',
    nearBadge: 'Gần bạn',
    distFormat: 'Cách bạn {dist}',
    turnOnGpsDist: 'Bật vị trí để xem khoảng cách',
    listenedTitle: 'Đã nghe điểm này trong tour',
    premiumLockedTitle: 'Cần Premium để mở nội dung ngoại ngữ',
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
    playerFabAria: 'Mở thanh nghe thuyết minh',
    playerCloseAria: 'Đóng thanh nghe thuyết minh',
    shopViewAll: 'Xem tất cả quà lưu niệm',
    shopEmptyDesc: 'Chưa có sản phẩm quà lưu niệm nào ở đây, ghé cửa hàng trực tuyến để xem đầy đủ.',
    shopTitle: 'Mang một chút Sài Gòn về nhà',
    shopSub: 'Quà lưu niệm & đặc sản gắn với từng điểm dừng.',
    heroCtaPlay: 'Nghe điểm đầu tiên',
    heroCtaMap: 'Xem bản đồ',
    mapPanelTitle: 'Lộ trình 7 điểm',
    mapPanelSub: '14 km - 14 phút nghe',
    mapStateReady: 'Sẵn sàng',
    mapStatePlaying: 'Đang phát',
    mapStateAuto: 'Tự động',
    legendStop: 'Điểm dừng',
    legendActive: 'Đang chọn',
    legendRoute: 'Lộ trình gợi ý',
    faqTitle: 'Câu hỏi thường gặp',
    faqQ1: 'Tôi có cần cài ứng dụng không?',
    faqA1:
      'Không. Bạn mở trang web trên điện thoại, hoặc quét mã QR ở từng điểm để nghe ngay.',
    faqQ2: 'Thuyết minh tự động hoạt động thế nào?',
    faqA2:
      'Khi bạn bật tính năng và cho phép định vị, trang sẽ tự phát thuyết minh lúc bạn đến gần một điểm dừng.',
    faqQ3: 'Ngôn ngữ nào miễn phí?',
    faqA3: 'Tiếng Việt miễn phí. Tiếng Anh, Nhật, Hàn mở bằng gói Premium.',
    faqQ4: 'Tôi có phải đi đúng thứ tự không?',
    faqA4:
      'Không. Thứ tự trên danh sách chỉ là gợi ý lộ trình, bạn nghe điểm nào trước cũng được.',
    heroDisplayTitle: 'Bảy điểm dừng quanh trung tâm Sài Gòn',
    heroDisplaySub:
      'Đeo tai nghe vào và đi. Mỗi điểm có một đoạn thuyết minh ngắn, nghe được bằng bốn ngôn ngữ. Bật tự động, máy sẽ phát khi bạn đến gần.',
    factDistanceLabel: 'Quãng đường',
    factDistanceFallback: 'Khoảng 14 km',
    factListenTimeLabel: 'Tổng thời gian nghe',
    factListenTimeVal: '{minutes} phút',
    factLanguagesLabel: 'Ngôn ngữ',
    factLanguagesVal: 'Việt, Anh, Nhật, Hàn',
    factHeardLabel: 'Bạn đã nghe',
    waveformAria: 'Tiến trình đoạn thuyết minh',
    tipsHeading: 'Điều nên biết',
    listenThisStop: 'Nghe điểm này',
    onPhoneBtn: 'Trên điện thoại',
    itineraryTitle: 'Đi bao lâu thì vừa?',
    itineraryHalfDay: 'Nửa ngày',
    itineraryFullDay: 'Cả ngày',
    how1Title: 'Bấm nghe hoặc quét mã',
    how1Desc: 'Nghe ngay trên trang, hoặc quét QR để nghe trên điện thoại và đi tay không.',
    how2Title: 'Để máy tự phát',
    how2Desc: 'Bật tự động phát, đi tới gần điểm nào thì thuyết minh điểm đó bắt đầu.',
    how3Title: 'Nghe bằng tiếng của bạn',
    how3Desc: 'Tiếng Việt miễn phí. Tiếng Anh, Nhật, Hàn mở bằng gói Premium.',
    languageShowcaseTitle: 'Một câu chuyện, bốn ngôn ngữ',
    languageShowcaseSub:
      'Cùng một đoạn thuyết minh về Nhà thờ Đức Bà, nghe bằng ngôn ngữ bạn chọn ngay trên thanh phát.',
    languageSampleVi: 'Nhà thờ được xây từ năm 1863 đến 1880, trong thời kỳ Pháp thuộc.',
    languageSampleEn:
      'The cathedral was built between 1863 and 1880, during the French colonial period.',
    languageSampleJa:
      '大聖堂は、フランス統治時代の1863年から1880年にかけて建設されました。',
    languageSampleKo:
      '대성당은 프랑스 식민지 시기인 1863년부터 1880년에 걸쳐 지어졌습니다.',
    languageFree: 'Miễn phí',
    languagePremium: 'Premium',
    prepTitle: 'Chuẩn bị trước khi đi',
    prep1Title: 'Mang tai nghe',
    prep1Desc:
      'Mỗi người nghe riêng, không làm phiền xung quanh, nhất là ở nơi trang nghiêm như chùa và bảo tàng.',
    prep2Title: 'Bật định vị',
    prep2Desc:
      'Để thuyết minh tự phát khi bạn đến gần điểm dừng. Không bật thì bạn vẫn bấm nghe thủ công được.',
    prep3Title: 'Sạc đủ pin',
    prep3Desc:
      'Vừa nghe vừa xem bản đồ cả buổi khá tốn pin, nên mang theo sạc dự phòng.',
    prep4Title: 'Đi chậm, nghe trọn',
    prep4Desc:
      'Mỗi đoạn dài khoảng 2 đến 3 phút. Hãy dừng lại ở điểm đó để vừa nghe vừa nhìn.',
    toastAutoOn: 'Sẽ tự phát khi bạn đến gần một điểm',
    toastAutoOff: 'Đã tắt tự động phát',
    toastLocating: 'Đang xác định vị trí của bạn…',
    toastAddedToCart: 'Đã thêm {name} vào giỏ hàng',
    playerPlayingStop: 'Đang phát - điểm {current}/{total}',
    playerStopPosition: 'Điểm {current}/{total}',
    playerSelectToStart: 'Chọn một điểm để bắt đầu',
    shopNavAria: 'Điều hướng sản phẩm',
    shopPrevAria: 'Xem sản phẩm trước',
    shopNextAria: 'Xem sản phẩm kế tiếp',
    heroCtaFirst: 'Nghe điểm đầu tiên',
    heroCtaContinue: 'Nghe tiếp: {name}',
    heroCtaReplay: 'Nghe lại từ đầu',
    viewFullRoute: 'Xem toàn bộ lộ trình',
    mapRouteStops: 'Lộ trình {count} điểm',
    mapRouteDistance: '14 km',
    hideMapBtn: 'Ẩn bản đồ',
    showMapBtn: 'Hiện bản đồ',
    stopSouvenirsLink: 'Quà gắn với điểm này',
    rewind10Aria: 'Lùi 10 giây',
    forward10Aria: 'Tua tới 10 giây',
    playbackSpeedAria: 'Tốc độ phát {rate}x',
    audioLoadError: 'Không tải được âm thanh cho điểm này.',
    premiumPlanPlain: 'Mở bằng gói Premium',
    itineraryHalfDesc: 'Khoảng 4 giờ, gom các điểm ở trung tâm, chủ yếu đi bộ.',
    itineraryHalf1: 'Nhà thờ Đức Bà Sài Gòn',
    itineraryHalf2: 'Bưu điện Trung tâm Sài Gòn',
    itineraryHalf3: 'Dinh Độc Lập',
    itineraryHalf4: 'Chợ Bến Thành',
    itineraryFullDesc: 'Khoảng 8 giờ, đủ bảy điểm, có đoạn đi xe buýt.',
    itineraryFull1: 'Bảo tàng Chứng tích Chiến tranh',
    itineraryFull2: 'Nhà thờ Đức Bà Sài Gòn',
    itineraryFull3: 'Chùa Bà Thiên Hậu',
    itineraryFull4: 'Cầu Ba Son',
    itineraryFull5: 'Bưu điện Trung tâm Sài Gòn',
    itineraryFull6: 'Dinh Độc Lập',
    itineraryFull7: 'Chợ Bến Thành',
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
      'Không lấy được vị trí. Hãy cho phép truy cập vị trí trong trình duyệt. Danh sách vẫn hiện đủ 7 điểm.',
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
    nextStop: 'Tiếp theo: {name}',
    audioFallbackNotice: 'Chưa có bản ghi âm {lang}, đang phát tiếng Việt.',
    noTranscript: 'Chưa có bản dịch cho ngôn ngữ này',
    addressLabel: 'Địa chỉ',
    distanceLabel: 'Khoảng cách',
    stopListHeading: 'Danh sách điểm dừng',
    stopListAria: 'Danh sách các điểm dừng trong hành trình',
    detailAreaAria: 'Chi tiết điểm dừng đang chọn',
    noVoiceForLanguage: 'Thiết bị chưa có giọng đọc tiếng Việt.',
    qrCardAria: 'Mã QR để mở điểm này trên điện thoại',
    qrScanHint: 'Quét để nghe trên điện thoại',
    qrDownload: 'Tải QR',
    qrCopyLink: 'Sao chép link',
    qrLinkCopied: 'Đã sao chép liên kết',
    qrShare: 'Chia sẻ',
    qrLocalhostWarning:
      'Cảnh báo (chỉ khi phát triển): mã QR đang dùng địa chỉ localhost nên điện thoại không mở được. Hãy đặt VITE_QR_BASE_URL.',
    narrationSlideAria: 'Hình ảnh của đoạn thuyết minh đang phát',
    sectionProgressAria: 'Tiến độ các đoạn thuyết minh',
    photoCredit: 'Ảnh: {author}{license}',
    qrModalTitle: 'Mã QR',
    qrShowBtn: 'Hiện mã QR',
    qrListenOnPhone: 'Nghe trên điện thoại',
    qrCloseAria: 'Đóng mã QR',
    myLocationLocating: 'Đang xác định vị trí...',
    simPanelTitle: 'Giả lập vị trí',
    simPickStopLabel: 'Chọn một điểm dừng',
    simManualLabel: 'Hoặc nhập toạ độ thủ công',
    simLatLabel: 'Vĩ độ',
    simLngLabel: 'Kinh độ',
    simApplyBtn: 'Đặt vị trí',
    simStopBtn: 'Tắt giả lập',
    simInvalidCoord: 'Toạ độ không hợp lệ.',
    gpsLocatedToast: 'Đã xác định vị trí. Điểm gần nhất: {name}, cách {dist}.',
    gpsOutsideRadiusNotice: 'Bạn đang ngoài vùng tự động. Bấm nghe để nghe thủ công.',
    segmentTimeAria: 'Nghe từ {time}, {title}',
    autoStatusOff: 'Thuyết minh tự động đang tắt.',
    autoStateOn: 'Bật',
    autoStateOff: 'Tắt',
    autoStatusWaiting: 'Thuyết minh tự động đang bật, đang chờ vị trí (bán kính {radius}).',
    autoStatusTracking: 'Thuyết minh tự động đang bật (bán kính {radius}). Gần nhất: {name} ({dist}).',
    autoStatusDenied: 'Thuyết minh tự động đang bật nhưng chưa được cấp quyền vị trí (bán kính {radius}).',
    demoSection: 'Khu vực thử nghiệm',
  },
  en: {
    heroEyebrow: 'Audio tour - 7 landmarks',
    pageTitle: 'Saigon Attractions',
    pageSubtitle:
      '7 historic landmarks with audio guide. Click Play on any spot to listen immediately, or enable auto narration so the guide plays as you walk near.',
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
    autoNarration: 'Auto-play',
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
    farNotice: 'You are currently far from the tour, but all 7 landmarks remain accessible.',
    nearestPrefix: 'nearest spot is',
    nearestSuffix: 'nearest spot is <b>{name}</b>, {dist} away.',
    mapAriaLabel: 'Interactive tour map',
    mapCaption: 'Interactive Google Map showing 7 heritage landmarks of Saigon.',
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
    directionsBtn: 'Directions',
    directionsAria: 'Directions from your current location to {name}',
    popupListenedTag: '(Listened)',
    chaptersAriaLabel: 'Tour chapter contents',
    listTitle: '7 Audio Tour Spots',
    sortNearest: 'Closest first',
    sortTour: 'Tour order',
    inZoneBadge: 'In narration zone',
    nearBadge: 'Near you',
    distFormat: '{dist} away',
    turnOnGpsDist: 'Turn on GPS to view distance',
    listenedTitle: 'Listened to this stop in the tour',
    premiumLockedTitle: 'Premium required to unlock foreign-language content',
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
    playerFabAria: 'Open the audio player',
    playerCloseAria: 'Close the audio player',
    shopViewAll: 'View all souvenirs',
    shopEmptyDesc: 'No souvenirs stocked here yet. Browse the full shop instead.',
    shopTitle: 'Take a little Saigon home',
    shopSub: 'Souvenirs & local specialties tied to each stop.',
    heroCtaPlay: 'Play the first stop',
    heroCtaMap: 'View map',
    mapPanelTitle: '7-stop route',
    mapPanelSub: '14 km - 14 min of audio',
    mapStateReady: 'Ready',
    mapStatePlaying: 'Playing',
    mapStateAuto: 'Auto',
    legendStop: 'Stop',
    legendActive: 'Selected',
    legendRoute: 'Suggested route',
    faqTitle: 'Frequently asked questions',
    faqQ1: 'Do I need to install an app?',
    faqA1:
      'No. Open the website on your phone, or scan the QR code at each stop to listen right away.',
    faqQ2: 'How does auto narration work?',
    faqA2:
      'Turn it on and allow location access, and the page will play narration when you come near a stop.',
    faqQ3: 'Which languages are free?',
    faqA3: 'Vietnamese is free. English, Japanese and Korean require Premium.',
    faqQ4: 'Do I have to follow the order?',
    faqA4:
      'No. The list order is only a suggested route; you can start with any stop.',
    heroDisplayTitle: 'Seven stops around central Saigon',
    heroDisplaySub:
      'Put on your headphones and walk. Each stop has a short audio guide in four languages. Turn on auto narration and it plays as you arrive.',
    factDistanceLabel: 'Route distance',
    factDistanceFallback: 'About 14 km',
    factListenTimeLabel: 'Total listening time',
    factListenTimeVal: '{minutes} min',
    factLanguagesLabel: 'Languages',
    factLanguagesVal: 'Vietnamese, English, Japanese, Korean',
    factHeardLabel: 'Listened',
    waveformAria: 'Narration progress',
    tipsHeading: 'Good to know',
    listenThisStop: 'Play this stop',
    onPhoneBtn: 'On phone',
    itineraryTitle: 'How long should you plan?',
    itineraryHalfDay: 'Half day',
    itineraryFullDay: 'Full day',
    how1Title: 'Tap play or scan QR',
    how1Desc: 'Listen right on the page, or scan the QR code to listen hands-free on your phone.',
    how2Title: 'Let it play automatically',
    how2Desc: 'Turn on auto narration and each stop begins playing as you walk nearby.',
    how3Title: 'Listen in your language',
    how3Desc: 'Vietnamese is free. English, Japanese, and Korean unlock with Premium.',
    languageShowcaseTitle: 'One story, four languages',
    languageShowcaseSub:
      'The same narration about Notre-Dame Cathedral, heard in the language you choose on the player.',
    languageSampleVi: 'Nhà thờ được xây từ năm 1863 đến 1880, trong thời kỳ Pháp thuộc.',
    languageSampleEn:
      'The cathedral was built between 1863 and 1880, during the French colonial period.',
    languageSampleJa:
      '大聖堂は、フランス統治時代の1863年から1880年にかけて建設されました。',
    languageSampleKo:
      '대성당은 프랑스 식민지 시기인 1863년부터 1880년에 걸쳐 지어졌습니다.',
    languageFree: 'Free',
    languagePremium: 'Premium',
    prepTitle: 'Before you go',
    prep1Title: 'Bring earphones',
    prep1Desc:
      'Everyone listens privately without disturbing others, especially in quiet places such as temples and museums.',
    prep2Title: 'Turn on location',
    prep2Desc:
      'Let the narration play automatically as you approach a stop. If location is off, you can still tap play manually.',
    prep3Title: 'Charge your battery',
    prep3Desc:
      'Listening and following the map all morning uses battery, so bring a power bank.',
    prep4Title: 'Walk slowly, listen fully',
    prep4Desc:
      'Each segment lasts about 2 to 3 minutes. Pause at the stop to listen and look around.',
    toastAutoOn: 'Will play automatically when you approach a stop',
    toastAutoOff: 'Auto narration turned off',
    toastLocating: 'Locating your position…',
    toastAddedToCart: 'Added {name} to cart',
    playerPlayingStop: 'Playing - stop {current}/{total}',
    playerStopPosition: 'Stop {current}/{total}',
    playerSelectToStart: 'Select a stop to begin',
    shopNavAria: 'Product navigation',
    shopPrevAria: 'Previous products',
    shopNextAria: 'Next products',
    heroCtaFirst: 'Play the first stop',
    heroCtaContinue: 'Continue: {name}',
    heroCtaReplay: 'Replay from the beginning',
    viewFullRoute: 'View full route',
    mapRouteStops: '{count}-stop route',
    mapRouteDistance: '14 km',
    hideMapBtn: 'Hide map',
    showMapBtn: 'Show map',
    stopSouvenirsLink: 'Souvenirs from this stop',
    rewind10Aria: 'Rewind 10 seconds',
    forward10Aria: 'Forward 10 seconds',
    playbackSpeedAria: 'Playback speed {rate}x',
    audioLoadError: 'Could not load audio for this stop.',
    premiumPlanPlain: 'Unlock with Premium',
    itineraryHalfDesc: 'About 4 hours, grouping central stops, mostly on foot.',
    itineraryHalf1: 'Notre-Dame Cathedral of Saigon',
    itineraryHalf2: 'Saigon Central Post Office',
    itineraryHalf3: 'Independence Palace',
    itineraryHalf4: 'Ben Thanh Market',
    itineraryFullDesc: 'About 8 hours, all seven stops, with a short bus ride.',
    itineraryFull1: 'War Remnants Museum',
    itineraryFull2: 'Notre-Dame Cathedral of Saigon',
    itineraryFull3: 'Thien Hau Temple',
    itineraryFull4: 'Ba Son Bridge',
    itineraryFull5: 'Saigon Central Post Office',
    itineraryFull6: 'Independence Palace',
    itineraryFull7: 'Ben Thanh Market',
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
      'Could not retrieve GPS position. Please allow location permissions in browser settings. All 7 landmarks remain accessible.',
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
    qrCardAria: 'QR code to open this stop on your phone',
    qrScanHint: 'Scan to listen on your phone',
    qrDownload: 'Download QR',
    qrCopyLink: 'Copy link',
    qrLinkCopied: 'Link copied',
    qrShare: 'Share',
    qrLocalhostWarning:
      'Dev warning: the QR code points at localhost, so phones cannot open it. Set VITE_QR_BASE_URL.',
    narrationSlideAria: 'Image for the narration section being played',
    sectionProgressAria: 'Narration section progress',
    photoCredit: 'Photo: {author}{license}',
    qrModalTitle: 'QR code',
    qrShowBtn: 'Show QR code',
    qrListenOnPhone: 'Listen on your phone',
    qrCloseAria: 'Close QR code',
    myLocationLocating: 'Locating...',
    simPanelTitle: 'Simulate location',
    simPickStopLabel: 'Pick a stop',
    simManualLabel: 'Or enter coordinates',
    simLatLabel: 'Latitude',
    simLngLabel: 'Longitude',
    simApplyBtn: 'Set location',
    simStopBtn: 'Stop simulation',
    simInvalidCoord: 'Invalid coordinates.',
    gpsLocatedToast: 'Location found. Nearest spot: {name}, {dist} away.',
    gpsOutsideRadiusNotice: 'You are outside the automatic zone. Tap play to listen manually.',
    segmentTimeAria: 'Listen from {time}, {title}',
    autoStatusOff: 'Auto narration is off.',
    autoStateOn: 'On',
    autoStateOff: 'Off',
    autoStatusWaiting: 'Auto narration is on. Waiting for your location (radius {radius}).',
    autoStatusTracking: 'Auto narration is on (radius {radius}). Nearest: {name} ({dist}).',
    autoStatusDenied: 'Auto narration is on but location access is blocked (radius {radius}).',
    demoSection: 'Demo tools',
  },
  /* DRAFT: needs native review */
  ko: {
    heroEyebrow: '오디오 가이드 - 7대 명소',
    pageTitle: '사이공 관광 명소',
    pageSubtitle:
      '오디오 해설이 제공되는 7개 명소. 원하는 곳에서 재생 버튼을 눌러 바로 청취하거나, 자동 해설을 켜서 근처에 도착하면 자동으로 청취할 수 있습니다.',
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
    autoNarration: '자동 재생',
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
    farNotice: '투어 경로에서 다소 떨어져 있으나 7개 명소 모두 청취 가능합니다.',
    nearestPrefix: '가장 가까운 명소는',
    nearestSuffix: '가장 가까운 명소는 <b>{name}</b> ({dist} 거리)입니다.',
    mapAriaLabel: '대화형 투어 지도',
    mapCaption: '사이공 7대 문화유산 위치를 표시하는 구글 지도.',
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
    directionsBtn: '길찾기',
    directionsAria: '현재 위치에서 {name}(으)로 가는 길',
    popupListenedTag: '(청취 완료)',
    chaptersAriaLabel: '투어 코스 내용',
    listTitle: '7개 오디오 해설 명소',
    sortNearest: '가까운 순',
    sortTour: '투어 추천 순',
    inZoneBadge: '해설 구역 진입',
    nearBadge: '가까운 위치',
    distFormat: '{dist} 거리',
    turnOnGpsDist: '거리를 확인하려면 위치를 켜세요',
    listenedTitle: '투어에서 이 명소를 청취했습니다',
    premiumLockedTitle: '외국어 콘텐츠를 열려면 Premium이 필요합니다',
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
    playerFabAria: '오디오 플레이어 열기',
    playerCloseAria: '오디오 플레이어 닫기',
    shopViewAll: '모든 기념품 보기',
    shopEmptyDesc: '아직 이곳에 기념품이 없어요. 온라인 스토어에서 확인해 보세요.',
    shopTitle: '사이공의 한 조각을 집으로',
    shopSub: '각 정류장과 연결된 기념품 & 지역 특산품.',
    heroCtaPlay: '첫 번째 명소 듣기',
    heroCtaMap: '지도 보기',
    mapPanelTitle: '7개 코스',
    mapPanelSub: '14km - 14분 분량',
    mapStateReady: '준비됨',
    mapStatePlaying: '재생 중',
    mapStateAuto: '자동',
    legendStop: '정류장',
    legendActive: '선택됨',
    legendRoute: '추천 경로',
    faqTitle: '자주 묻는 질문',
    faqQ1: '앱을 설치해야 하나요?',
    faqA1:
      '아니요. 휴대폰에서 웹사이트를 열거나 각 명소의 QR 코드를 스캔하면 바로 들을 수 있습니다.',
    faqQ2: '자동 해설은 어떻게 작동하나요?',
    faqA2:
      '기능을 켜고 위치 접근을 허용하면 명소 근처에 도착했을 때 자동으로 해설이 재생됩니다.',
    faqQ3: '어떤 언어가 무료인가요?',
    faqA3: '베트남어는 무료입니다. 영어, 일본어, 한국어는 프리미엄에서 이용할 수 있습니다.',
    faqQ4: '순서대로 가야 하나요?',
    faqA4: '아니요. 목록 순서는 추천 경로일 뿐이며 원하는 명소부터 들을 수 있습니다.',
    heroDisplayTitle: '사이공 중심부의 7개 명소',
    heroDisplaySub:
      '이어폰을 끼고 걸어보세요. 각 명소마다 4개 언어로 제공되는 짧은 오디오 해설이 있습니다. 자동 재생을 켜면 근처에 다가갈 때 자동으로 시작됩니다.',
    factDistanceLabel: '총 이동 거리',
    factDistanceFallback: '약 14 km',
    factListenTimeLabel: '총 청취 시간',
    factListenTimeVal: '{minutes}분',
    factLanguagesLabel: '지원 언어',
    factLanguagesVal: '베트남어, 영어, 일본어, 한국어',
    factHeardLabel: '청취 완료',
    waveformAria: '해설 진행률',
    tipsHeading: '알아두면 좋은 점',
    listenThisStop: '이 명소 듣기',
    onPhoneBtn: '휴대폰에서',
    itineraryTitle: '얼마나 걸릴까요?',
    itineraryHalfDay: '반나절',
    itineraryFullDay: '하루 종일',
    how1Title: '눌러서 듣거나 QR 스캔',
    how1Desc: '페이지에서 바로 듣거나 QR 코드를 스캔해 휴대폰으로 가볍게 이동하며 들으세요.',
    how2Title: '가까이 가면 자동 재생',
    how2Desc: '자동 재생을 켜 두면 명소 근처에 다가갈 때 해당 해설이 시작됩니다.',
    how3Title: '내 언어로 듣기',
    how3Desc: '베트남어는 무료입니다. 영어, 일본어, 한국어는 Premium으로 열 수 있습니다.',
    languageShowcaseTitle: '하나의 이야기, 네 가지 언어',
    languageShowcaseSub:
      '노트르담 대성당에 대한 같은 해설을 플레이어에서 선택한 언어로 들어 보세요.',
    languageSampleVi: 'Nhà thờ được xây từ năm 1863 đến 1880, trong thời kỳ Pháp thuộc.',
    languageSampleEn:
      'The cathedral was built between 1863 and 1880, during the French colonial period.',
    languageSampleJa:
      '大聖堂は、フランス統治時代の1863年から1880年にかけて建設されました。',
    languageSampleKo:
      '대성당은 프랑스 식민지 시기인 1863년부터 1880년에 걸쳐 지어졌습니다.',
    languageFree: '무료',
    languagePremium: 'Premium',
    prepTitle: '떠나기 전 준비',
    prep1Title: '이어폰 챙기기',
    prep1Desc:
      '각자 조용히 들을 수 있어 주변에 방해가 되지 않습니다. 사찰과 박물관처럼 조용한 곳에서는 특히 중요합니다.',
    prep2Title: '위치 켜기',
    prep2Desc:
      '명소에 가까워지면 해설이 자동으로 재생됩니다. 위치를 켜지 않아도 직접 눌러 들을 수 있습니다.',
    prep3Title: '배터리 충전',
    prep3Desc:
      '해설을 들으며 지도를 오래 보면 배터리가 빨리 줄어듭니다. 보조 배터리를 챙기세요.',
    prep4Title: '천천히, 끝까지 듣기',
    prep4Desc:
      '각 구간은 약 2분에서 3분입니다. 명소에 잠시 멈춰 서서 듣고 둘러보세요.',
    toastAutoOn: '명소에 가까워지면 자동으로 재생됩니다',
    toastAutoOff: '자동 재생이 꺼졌습니다',
    toastLocating: '현재 위치를 확인하는 중…',
    toastAddedToCart: '장바구니에 {name} 추가됨',
    playerPlayingStop: '재생 중 - {current}/{total}번째 명소',
    playerStopPosition: '{current}/{total}번째 명소',
    playerSelectToStart: '시작할 명소를 선택하세요',
    shopNavAria: '상품 탐색',
    shopPrevAria: '이전 상품 보기',
    shopNextAria: '다음 상품 보기',
    heroCtaFirst: '첫 번째 명소 듣기',
    heroCtaContinue: '이어서 듣기: {name}',
    heroCtaReplay: '처음부터 다시 듣기',
    viewFullRoute: '전체 경로 보기',
    mapRouteStops: '{count}개 명소 경로',
    mapRouteDistance: '14 km',
    hideMapBtn: '지도 숨기기',
    showMapBtn: '지도 보기',
    stopSouvenirsLink: '이 명소와 연결된 기념품',
    rewind10Aria: '10초 뒤로',
    forward10Aria: '10초 앞으로',
    playbackSpeedAria: '재생 속도 {rate}x',
    audioLoadError: '이 명소의 오디오를 불러올 수 없습니다.',
    premiumPlanPlain: 'Premium 플랜으로 이용',
    itineraryHalfDesc: '약 4시간, 도심 중심 명소 위주로 도보 이동.',
    itineraryHalf1: '사이공 노트르담 대성당',
    itineraryHalf2: '사이공 중앙 우체국',
    itineraryHalf3: '통일궁',
    itineraryHalf4: '벤탄 시장',
    itineraryFullDesc: '약 8시간, 7개 명소 전체 코스, 일부 구간 버스 이동.',
    itineraryFull1: '전쟁기념관',
    itineraryFull2: '사이공 노트르담 대성당',
    itineraryFull3: '티엔하우 사원',
    itineraryFull4: '바손 대교',
    itineraryFull5: '사이공 중앙 우체국',
    itineraryFull6: '통일궁',
    itineraryFull7: '벤탄 시장',
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
    gpsErrorGeneric: '위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인하세요. 7개 명소 모두 이용 가능합니다.',
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
    qrCardAria: '휴대폰에서 이 지점을 열 QR 코드',
    qrScanHint: '휴대폰으로 스캔하여 듣기',
    qrDownload: 'QR 다운로드',
    qrCopyLink: '링크 복사',
    qrLinkCopied: '링크를 복사했습니다',
    qrShare: '공유',
    qrLocalhostWarning:
      '개발 경고: QR 코드가 localhost를 가리켜 휴대폰에서 열 수 없습니다. VITE_QR_BASE_URL을 설정하세요.',
    narrationSlideAria: '재생 중인 해설 구간의 이미지',
    sectionProgressAria: '해설 구간 진행률',
    photoCredit: '사진: {author}{license}',
    qrModalTitle: 'QR 코드',
    qrShowBtn: 'QR 코드 표시',
    qrListenOnPhone: '휴대폰으로 듣기',
    qrCloseAria: 'QR 코드 닫기',
    myLocationLocating: '위치 확인 중...',
    simPanelTitle: '위치 시뮬레이션',
    simPickStopLabel: '명소 선택',
    simManualLabel: '또는 좌표 직접 입력',
    simLatLabel: '위도',
    simLngLabel: '경도',
    simApplyBtn: '위치 설정',
    simStopBtn: '시뮬레이션 끄기',
    simInvalidCoord: '좌표가 올바르지 않습니다.',
    gpsLocatedToast: '위치 확인 완료. 가장 가까운 명소: {name}, {dist} 거리.',
    gpsOutsideRadiusNotice: '자동 해설 구역 밖입니다. 직접 재생을 눌러 들을 수 있습니다.',
    segmentTimeAria: '{time}부터 듣기, {title}',
    autoStatusOff: '자동 해설이 꺼져 있습니다.',
    autoStateOn: '켜짐',
    autoStateOff: '꺼짐',
    autoStatusWaiting: '자동 해설이 켜져 있습니다. 위치를 확인하는 중입니다 (반경 {radius}).',
    autoStatusTracking: '자동 해설이 켜져 있습니다 (반경 {radius}). 가장 가까운 곳: {name} ({dist}).',
    autoStatusDenied: '자동 해설이 켜져 있지만 위치 접근 권한이 없습니다 (반경 {radius}).',
    demoSection: '데모 도구',
  },
  /* DRAFT: needs native review */
  ja: {
    heroEyebrow: '音声ガイド - 7大名所',
    pageTitle: 'サイゴン観光スポット',
    pageSubtitle:
      '音声ガイド付きの7か所の名所。再生ボタンを押してすぐ聴くか、自動ガイドをオンにして近づいた際に自動再生できます。',
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
    autoNarration: '自動再生',
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
    farNotice: 'ツアー区域から離れていますが、7か所すべてご利用いただけます。',
    nearestPrefix: '最寄りのスポットは',
    nearestSuffix: '最寄りのスポットは<b>{name}</b>（{dist}）です。',
    mapAriaLabel: 'インタラクティブツアー地図',
    mapCaption: 'サイゴンの7大文化遺産を表示する Google マップ。',
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
    directionsBtn: '経路',
    directionsAria: '現在地から{name}への経路',
    popupListenedTag: '(再生済み)',
    chaptersAriaLabel: 'ツアーチャプター内容',
    listTitle: '7つのガイドスポット',
    sortNearest: '近い順',
    sortTour: 'ツアー順',
    inZoneBadge: 'ガイド範囲内',
    nearBadge: '周辺',
    distFormat: '距離 {dist}',
    turnOnGpsDist: '位置情報をオンにして距離を表示',
    listenedTitle: 'このスポットをツアーで再生済みです',
    premiumLockedTitle: '外国語コンテンツの解除には Premium が必要です',
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
    playerFabAria: '音声プレイヤーを開く',
    playerCloseAria: '音声プレイヤーを閉じる',
    shopViewAll: 'すべてのお土産を見る',
    shopEmptyDesc: 'まだお土産が揃っていません。オンラインショップをご覧ください。',
    shopTitle: 'サイゴンのかけらを持ち帰ろう',
    shopSub: '各スポットと結びついたお土産＆名物。',
    heroCtaPlay: '最初のスポットを聴く',
    heroCtaMap: '地図を見る',
    mapPanelTitle: '7スポットのルート',
    mapPanelSub: '14km・14分の音声',
    mapStateReady: '準備完了',
    mapStatePlaying: '再生中',
    mapStateAuto: '自動',
    legendStop: 'スポット',
    legendActive: '選択中',
    legendRoute: 'おすすめルート',
    faqTitle: 'よくある質問',
    faqQ1: 'アプリのインストールは必要ですか？',
    faqA1:
      'いいえ。スマートフォンでウェブサイトを開くか、各スポットのQRコードを読み取ればすぐに聴けます。',
    faqQ2: '自動解説はどう動きますか？',
    faqA2:
      '機能をオンにして位置情報を許可すると、スポットに近づいたときに自動で解説が再生されます。',
    faqQ3: '無料の言語はどれですか？',
    faqA3: 'ベトナム語は無料です。英語・日本語・韓国語はプレミアムで利用できます。',
    faqQ4: '順番どおりに回る必要がありますか？',
    faqA4: 'いいえ。リストの順番はおすすめルートで、どのスポットから聴いてもかまいません。',
    heroDisplayTitle: 'サイゴン中心部をめぐる7つのスポット',
    heroDisplaySub:
      'イヤホンをつけて歩きましょう。各スポットには4言語対応の短い音声ガイドがあり、自動再生をオンにすると近づいたときに始まります。',
    factDistanceLabel: 'ルート距離',
    factDistanceFallback: '約14 km',
    factListenTimeLabel: '合計再生時間',
    factListenTimeVal: '{minutes}分',
    factLanguagesLabel: '対応言語',
    factLanguagesVal: 'ベトナム語・英語・日本語・韓国語',
    factHeardLabel: '再生済み',
    waveformAria: 'ガイドの再生位置',
    tipsHeading: '知っておきたいこと',
    listenThisStop: 'このスポットを聴く',
    onPhoneBtn: 'スマホで',
    itineraryTitle: '所要時間の目安',
    itineraryHalfDay: '半日コース',
    itineraryFullDay: '1日コース',
    how1Title: '再生ボタンまたはQRスキャン',
    how1Desc: 'ページ上でそのまま聴くか、QRコードを読み取ってスマートフォンで手ぶらで聴けます。',
    how2Title: '近づくと自動再生',
    how2Desc: '自動再生をオンにすると、スポットに近づいたときに解説が始まります。',
    how3Title: 'あなたの言語で聴く',
    how3Desc: 'ベトナム語は無料。英語・日本語・韓国語はPremiumでご利用いただけます。',
    languageShowcaseTitle: 'ひとつの物語、四つの言語',
    languageShowcaseSub:
      'ノートルダム大聖堂についての同じ解説を、プレーヤーで選んだ言語で聴けます。',
    languageSampleVi: 'Nhà thờ được xây từ năm 1863 đến 1880, trong thời kỳ Pháp thuộc.',
    languageSampleEn:
      'The cathedral was built between 1863 and 1880, during the French colonial period.',
    languageSampleJa:
      '大聖堂は、フランス統治時代の1863年から1880年にかけて建設されました。',
    languageSampleKo:
      '대성당은 프랑스 식민지 시기인 1863년부터 1880년에 걸쳐 지어졌습니다.',
    languageFree: '無料',
    languagePremium: 'Premium',
    prepTitle: '出発前の準備',
    prep1Title: 'イヤホンを持参',
    prep1Desc:
      'それぞれが静かに聴けるので周囲に迷惑をかけません。寺や博物館など静かな場所では特に大切です。',
    prep2Title: '位置情報をオンに',
    prep2Desc:
      'スポットに近づくと解説が自動で再生されます。オンにしなくても手動で再生できます。',
    prep3Title: 'バッテリーを充電',
    prep3Desc:
      '解説を聴きながら地図を見続けると電池を消耗します。モバイルバッテリーを持参してください。',
    prep4Title: 'ゆっくり最後まで聴く',
    prep4Desc:
      '各区間は約2分から3分です。スポットで立ち止まり、聴きながら景色を楽しんでください。',
    toastAutoOn: 'スポットに近づくと自動再生します',
    toastAutoOff: '自動再生をオフにしました',
    toastLocating: '現在地を取得しています…',
    toastAddedToCart: '{name}をカートに追加しました',
    playerPlayingStop: '再生中・スポット {current}/{total}',
    playerStopPosition: 'スポット {current}/{total}',
    playerSelectToStart: 'スポットを選択して開始',
    shopNavAria: '商品の移動',
    shopPrevAria: '前の商品を見る',
    shopNextAria: '次の商品を見る',
    heroCtaFirst: '最初のスポットを聴く',
    heroCtaContinue: '続きを聴く: {name}',
    heroCtaReplay: '最初からもう一度聴く',
    viewFullRoute: 'ルート全体を表示',
    mapRouteStops: '{count}スポットのルート',
    mapRouteDistance: '14 km',
    hideMapBtn: '地図を隠す',
    showMapBtn: '地図を表示',
    stopSouvenirsLink: 'このスポットのお土産',
    rewind10Aria: '10秒戻す',
    forward10Aria: '10秒進める',
    playbackSpeedAria: '再生速度 {rate}倍',
    audioLoadError: 'このスポットの音声を読み込めませんでした。',
    premiumPlanPlain: 'Premiumプランで解放',
    itineraryHalfDesc: '約4時間、中心部のスポットを主に徒歩で巡ります。',
    itineraryHalf1: 'サイゴン大教会',
    itineraryHalf2: 'サイゴン中央郵便局',
    itineraryHalf3: '統一会堂',
    itineraryHalf4: 'ベンタイン市場',
    itineraryFullDesc: '約8時間、一部バス移動を含めて全7スポットを巡ります。',
    itineraryFull1: '戦争証跡博物館',
    itineraryFull2: 'サイゴン大教会',
    itineraryFull3: 'ティエンハウ廟',
    itineraryFull4: 'バーソン橋',
    itineraryFull5: 'サイゴン中央郵便局',
    itineraryFull6: '統一会堂',
    itineraryFull7: 'ベンタイン市場',
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
    gpsErrorGeneric: '現在地を取得できませんでした。ブラウザの位置情報アクセスを許可してください。7か所すべて利用可能です。',
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
    qrCardAria: 'スマートフォンでこのスポットを開くQRコード',
    qrScanHint: 'スマートフォンでスキャンして再生',
    qrDownload: 'QRをダウンロード',
    qrCopyLink: 'リンクをコピー',
    qrLinkCopied: 'リンクをコピーしました',
    qrShare: '共有',
    qrLocalhostWarning:
      '開発警告: QRコードがlocalhostを指しているため、スマートフォンで開けません。VITE_QR_BASE_URLを設定してください。',
    narrationSlideAria: '再生中の解説セクションの画像',
    sectionProgressAria: '解説セクションの進捗',
    photoCredit: '写真: {author}{license}',
    qrModalTitle: 'QRコード',
    qrShowBtn: 'QRコードを表示',
    qrListenOnPhone: 'スマートフォンで聴く',
    qrCloseAria: 'QRコードを閉じる',
    myLocationLocating: '位置情報を取得中...',
    simPanelTitle: '位置シミュレーション',
    simPickStopLabel: 'スポットを選択',
    simManualLabel: 'または座標を入力',
    simLatLabel: '緯度',
    simLngLabel: '経度',
    simApplyBtn: '位置を設定',
    simStopBtn: 'シミュレーションを停止',
    simInvalidCoord: '座標が正しくありません。',
    gpsLocatedToast: '位置を取得しました。最寄りのスポット: {name}（{dist}）。',
    gpsOutsideRadiusNotice: '自動ガイドの範囲外です。再生を押すと手動で聴けます。',
    segmentTimeAria: '{time}から再生, {title}',
    autoStatusOff: '自動ガイドはオフです。',
    autoStateOn: 'オン',
    autoStateOff: 'オフ',
    autoStatusWaiting: '自動ガイドはオンです。位置情報を待っています（半径 {radius}）。',
    autoStatusTracking: '自動ガイドはオンです（半径 {radius}）。最寄り: {name}（{dist}）。',
    autoStatusDenied: '自動ガイドはオンですが、位置情報へのアクセスが許可されていません（半径 {radius}）。',
    demoSection: 'デモ用ツール',
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
  'qrCardAria',
  'qrScanHint',
  'qrDownload',
  'qrCopyLink',
  'qrLinkCopied',
  'qrShare',
  'qrLocalhostWarning',
  'narrationSlideAria',
  'sectionProgressAria',
  'photoCredit',
  'qrModalTitle',
  'qrShowBtn',
  'qrListenOnPhone',
  'qrCloseAria',
  'myLocationLocating',
  'simPanelTitle',
  'simPickStopLabel',
  'simManualLabel',
  'simLatLabel',
  'simLngLabel',
  'simApplyBtn',
  'simStopBtn',
  'simInvalidCoord',
  'gpsLocatedToast',
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

export function formatDistanceRounded(metres: number, lang: SupportedLanguage): string {
  const locale = LOCALE_MAP[lang] || 'vi-VN';
  if (metres < 1000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
      Math.round(metres)
    );
    return `${formatted} m`;
  }
  const km = metres / 1000;
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Math.round(km)
  );
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
