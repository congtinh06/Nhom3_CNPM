package com.echora.content.service;

import com.echora.content.config.RabbitMQConfig;
import com.echora.content.dto.AdminAudioPoiDto;
import com.echora.content.dto.AdminAudioStatusDto;
import com.echora.content.dto.AdminPoiDetailDto;
import com.echora.content.dto.AdminPoiLanguageDto;
import com.echora.content.dto.AdminPoiLanguageSummaryDto;
import com.echora.content.dto.AdminPoiListItemDto;
import com.echora.content.dto.AdminPoiTranslationDto;
import com.echora.content.dto.AudioRegenerationBatchDto;
import com.echora.content.dto.AudioRegenerationResultDto;
import com.echora.content.dto.CreatePoiRequest;
import com.echora.content.dto.PoiBoundingBoxDto;
import com.echora.content.dto.PoiDetailDto;
import com.echora.content.dto.PoiGuideDto;
import com.echora.content.dto.PoiGuideChapterDto;
import com.echora.content.dto.PoiGuideTranslationDto;
import com.echora.content.dto.PoiInternalQrDto;
import com.echora.content.dto.PoiPremiumPriceDto;
import com.echora.content.dto.PoiPublishStatusDto;
import com.echora.content.dto.PoiSummaryDto;
import com.echora.content.dto.UpdatePoiRequest;
import com.echora.content.entity.Category;
import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiChapter;
import com.echora.content.entity.PoiChapterTranslation;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.entity.PublishEventType;
import com.echora.content.entity.PublishStatus;
import com.echora.content.entity.Route;
import com.echora.content.entity.Zone;
import com.echora.content.exception.BadRequestException;
import com.echora.content.exception.ConflictException;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.messaging.PoiPublishRequestedEvent;
import com.echora.content.repository.CategoryRepository;
import com.echora.content.repository.PoiChapterRepository;
import com.echora.content.repository.PoiChapterTranslationRepository;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.PoiTranslationRepository;
import com.echora.content.repository.RouteRepository;
import com.echora.content.repository.ZoneRepository;
import com.echora.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PoiContentServiceImpl implements PoiContentService {

    private static final String DEFAULT_LANG = "vi";
    private static final Set<String> PUBLISH_STATUSES = Set.of(PublishStatus.PENDING, PublishStatus.PUBLISHED, PublishStatus.FAILED);
    private static final List<String> SUPPORTED_LANGUAGES = List.of("vi", "en", "ja", "ko");
    // Giá trị lọc hợp lệ cho overallStatus / languageStatus của danh sách admin.
    private static final Set<String> OVERALL_STATUS_VALUES = Set.of("ACTIVE", "NEEDS_ATTENTION", "HIDDEN");
    private static final Set<String> LANGUAGE_STATUS_VALUES = Set.of("ERROR", "PENDING");
    private static final Map<String, String> LANGUAGE_NAMES = Map.of(
            "vi", "Tiếng Việt",
            "en", "Tiếng Anh",
            "ja", "Tiếng Nhật",
            "ko", "Tiếng Hàn");

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;
    private final PoiChapterRepository chapterRepository;
    private final PoiChapterTranslationRepository chapterTranslationRepository;
    private final ZoneRepository zoneRepository;
    private final CategoryRepository categoryRepository;
    private final RouteRepository routeRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final PoiPublishService poiPublishService;
    private final RouteStopsSynchronizer routeStopsSynchronizer;
    private final TransactionTemplate transactionTemplate;

    // Ngưỡng coi một ngôn ngữ "chờ xử lý quá lâu" (phút).
    @Value("${echora.audio.pending-timeout-minutes:30}")
    private long pendingTimeoutMinutes = 30;

    // Biên hợp lệ cho tọa độ POI (mặc định bao trọn TP.HCM). Có thể ghi đè bằng biến môi trường.
    @Value("${echora.poi.bounds.min-latitude:10.30}")
    private double minLatitude = 10.30;

    @Value("${echora.poi.bounds.max-latitude:11.20}")
    private double maxLatitude = 11.20;

    @Value("${echora.poi.bounds.min-longitude:106.30}")
    private double minLongitude = 106.30;

    @Value("${echora.poi.bounds.max-longitude:107.10}")
    private double maxLongitude = 107.10;

    @Value("${echora.poi.trigger-radius.max-meters:5000}")
    private int maxTriggerRadiusMeters = 5000;

    private static final List<String> SUPPORTED_POI_LANGUAGES = List.of("vi", "en", "ja", "ko");

    /**
     * Kiểm tra tọa độ nằm trong biên cấu hình (mặc định TP.HCM). Bean Validation chỉ chặn
     * -90..90 / -180..180, còn biên này chặn dữ liệu test như (25, 25) lọt vào danh sách public.
     */
    private void validatePoiLocation(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            return;
        }
        double lat = latitude.doubleValue();
        double lng = longitude.doubleValue();
        if (lat < minLatitude || lat > maxLatitude || lng < minLongitude || lng > maxLongitude) {
            throw new BadRequestException(String.format(
                    "Tọa độ POI phải nằm trong khu vực TP.HCM: vĩ độ %.4f..%.4f, kinh độ %.4f..%.4f",
                    minLatitude, maxLatitude, minLongitude, maxLongitude));
        }
    }

    private void validateTriggerRadius(Integer radius) {
        if (radius == null) {
            return;
        }
        if (radius < 1 || radius > maxTriggerRadiusMeters) {
            throw new BadRequestException("Bán kính kích hoạt phải trong khoảng 1.." + maxTriggerRadiusMeters + " mét");
        }
    }

    private void validateSupportedLanguages(List<String> languages) {
        if (languages == null) {
            return;
        }
        for (String language : languages) {
            if (language == null || !SUPPORTED_POI_LANGUAGES.contains(language.toLowerCase(Locale.ROOT))) {
                throw new BadRequestException("Ngôn ngữ không được hỗ trợ: " + language
                        + ". Chỉ hỗ trợ: " + String.join(", ", SUPPORTED_POI_LANGUAGES));
            }
        }
    }

    @Override
    public List<PoiSummaryDto> getPois(Long zoneId) {
        List<Poi> pois = zoneId != null
                ? poiRepository.findByZoneIdAndStatus(zoneId, "ACTIVE")
                : poiRepository.findByStatus("ACTIVE");
        return pois.stream().map(PoiMapper::toSummary).toList();
    }

    @Override
    public List<PoiGuideDto> getPoiGuides(Long zoneId, boolean includePremiumTranslations, Collection<Long> purchasedPoiIds) {
        List<Poi> pois = zoneId != null
                ? poiRepository.findByZoneIdAndStatus(zoneId, "ACTIVE")
                : poiRepository.findByStatus("ACTIVE");
        if (pois.isEmpty()) {
            return List.of();
        }

        List<Long> ids = pois.stream().map(Poi::getId).toList();
        Set<Long> purchased = purchasedPoiIds == null ? Set.of() : Set.copyOf(purchasedPoiIds);

        Map<Long, Map<String, PoiGuideTranslationDto>> translationsByPoi = new HashMap<>();
        for (PoiTranslation t : translationRepository.findByPoiIdIn(ids)) {
            boolean vi = "vi".equalsIgnoreCase(t.getLanguageCode());
            if (!includePremiumTranslations && !vi) {
                // Chưa Premium: chỉ trả ngoại ngữ của POI user đã mua lẻ, tiếng Việt luôn trả.
                if (!purchased.contains(t.getPoi().getId())) {
                    continue;
                }
            }
            translationsByPoi
                    .computeIfAbsent(t.getPoi().getId(), k -> new LinkedHashMap<>())
                    .put(t.getLanguageCode(), toGuideTranslation(t));
        }

        Map<Long, Map<String, List<PoiGuideChapterDto>>> chaptersByPoi = loadGuideChapters(ids, includePremiumTranslations, purchased);

        return pois.stream()
                .map(poi -> toGuideDto(poi,
                        translationsByPoi.getOrDefault(poi.getId(), Map.of()),
                        chaptersByPoi.getOrDefault(poi.getId(), Map.of())))
                .toList();
    }

    /**
     * Nạp chap + bản dịch chap cho nhiều POI trong 2 query (chap, rồi translation).
     * Chap ngoại ngữ chỉ nạp khi được phép (premium hoặc POI đã mua lẻ).
     */
    private Map<Long, Map<String, List<PoiGuideChapterDto>>> loadGuideChapters(
            List<Long> poiIds, boolean includePremiumTranslations, Set<Long> purchasedPoiIds) {
        List<PoiChapter> chapters = chapterRepository.findByPoiIdInAndIsActiveTrueOrderByPoiIdAscChapterOrderAsc(poiIds);
        if (chapters.isEmpty()) {
            return Map.of();
        }
        List<Long> chapterIds = chapters.stream().map(PoiChapter::getId).toList();
        Map<Long, List<PoiChapterTranslation>> translationsByChapter = new HashMap<>();
        for (PoiChapterTranslation ct : chapterTranslationRepository.findByChapterIdIn(chapterIds)) {
            translationsByChapter.computeIfAbsent(ct.getChapter().getId(), k -> new ArrayList<>()).add(ct);
        }

        // Map chapterId -> poiId để xử lý khóa theo POI/lacock ngôn ngữ.
        Map<Long, Long> poiIdByChapterId = new HashMap<>();
        Map<Long, List<PoiChapter>> chaptersByPoi = new LinkedHashMap<>();
        for (PoiChapter chapter : chapters) {
            poiIdByChapterId.put(chapter.getId(), chapter.getPoi().getId());
            chaptersByPoi.computeIfAbsent(chapter.getPoi().getId(), k -> new ArrayList<>()).add(chapter);
        }

        Map<Long, Map<String, List<PoiGuideChapterDto>>> result = new HashMap<>();
        for (PoiChapter chapter : chapters) {
            Long poiId = chapter.getPoi().getId();
            for (PoiChapterTranslation ct : translationsByChapter.getOrDefault(chapter.getId(), List.of())) {
                boolean isVi = "vi".equalsIgnoreCase(ct.getLanguageCode());
                boolean allowed = isVi || includePremiumTranslations || purchasedPoiIds.contains(poiId);
                if (!allowed) {
                    continue;
                }
                result.computeIfAbsent(poiId, k -> new LinkedHashMap<>())
                        .computeIfAbsent(ct.getLanguageCode(), k -> new ArrayList<>())
                        .add(PoiGuideChapterDto.builder()
                                .order(chapter.getChapterOrder())
                                .title(ct.getTitle())
                                .narrationText(ct.getNarrationText())
                                .audioUrl(ct.getAudioUrl())
                                .audioDurationSeconds(ct.getAudioDurationSeconds())
                                .audioStatus(ct.getAudioStatus())
                                .build());
            }
        }
        // Đã load theo chapterOrder tăng dần nên list giữ đúng thứ tự; sort lại cho an toàn.
        for (Map<String, List<PoiGuideChapterDto>> byLang : result.values()) {
            for (List<PoiGuideChapterDto> list : byLang.values()) {
                list.sort(java.util.Comparator.comparing(PoiGuideChapterDto::getOrder,
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
            }
        }
        return result;
    }

    private PoiGuideDto toGuideDto(
            Poi poi,
            Map<String, PoiGuideTranslationDto> translations,
            Map<String, List<PoiGuideChapterDto>> chaptersByLanguage) {
        translations.forEach((lang, dto) -> dto.setChapters(chaptersByLanguage.getOrDefault(lang, List.of())));
        return PoiGuideDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .slug(poi.getSlug())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .address(poi.getAddress())
                .thumbnailUrl(poi.getThumbnailUrl())
                .zoneId(poi.getZone() != null ? poi.getZone().getId() : null)
                .zoneCode(poi.getZone() != null ? poi.getZone().getCode() : null)
                .categoryCode(poi.getCategory() != null ? poi.getCategory().getCode() : null)
                .categoryNameVi(poi.getCategory() != null ? poi.getCategory().getNameVi() : null)
                .routeId(poi.getRoute() != null ? poi.getRoute().getId() : null)
                .stopOrder(poi.getStopOrder())
                .premiumPrice(poi.getPremiumPrice())
                .translations(translations)
                .build();
    }

    private PoiGuideTranslationDto toGuideTranslation(PoiTranslation t) {
        return PoiGuideTranslationDto.builder()
                .languageCode(t.getLanguageCode())
                .title(t.getTitle())
                .summary(t.getSummary())
                .description(t.getDescription())
                .historicalSignificance(t.getHistoricalSignificance())
                .audioUrl(t.getAudioUrl())
                .audioDurationSeconds(t.getAudioDurationSeconds())
                .audioStatus(t.getAudioStatus())
                .source(t.getSource())
                .build();
    }

    @Override
    public Page<AdminPoiListItemDto> getAdminPois(
            Long zoneId, Long routeId, String status, String search, String audioStatus,
            String overallStatus, String languageStatus, Pageable pageable) {
        String searchPattern = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase(Locale.ROOT) + "%" : null;
        String normalizedStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase(Locale.ROOT) : null;
        String normalizedAudio = (audioStatus != null && !audioStatus.isBlank())
                ? audioStatus.trim().toUpperCase(Locale.ROOT) : null;
        String normalizedOverall = normalizeEnumFilter(overallStatus, OVERALL_STATUS_VALUES, "overallStatus");
        String normalizedLanguage = normalizeEnumFilter(languageStatus, LANGUAGE_STATUS_VALUES, "languageStatus");
        LocalDateTime pendingCutoff = TimeUtils.nowUtc().minusMinutes(pendingTimeoutMinutes);

        Page<Poi> page = poiRepository.searchAdminPois(
                zoneId, routeId, normalizedStatus, searchPattern, normalizedAudio,
                normalizedOverall, normalizedLanguage, SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGES.size(),
                pendingCutoff, pageable);

        List<Long> ids = page.getContent().stream().map(Poi::getId).toList();
        Map<Long, Map<String, PoiTranslation>> translationsByPoi = loadTranslations(ids);

        return page.map(poi -> toAdminListItem(poi, translationsByPoi.getOrDefault(poi.getId(), Map.of())));
    }

    // Giữ giá trị lọc viết hoa/thường tùy ý nhưng chặn giá trị lạ để lỗi rõ ràng thay vì im lặng bỏ qua.
    private static String normalizeEnumFilter(String value, Set<String> allowed, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new BadRequestException(field + " must be one of: " + String.join(", ", allowed));
        }
        return normalized;
    }

    @Override
    public AdminPoiDetailDto getAdminPoiDetail(Long id) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + id));
        return mapToAdminDetail(poi, translationRepository.findByPoiId(id), null);
    }

    private Map<Long, Map<String, PoiTranslation>> loadTranslations(List<Long> poiIds) {
        if (poiIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Map<String, PoiTranslation>> result = new HashMap<>();
        for (PoiTranslation t : translationRepository.findByPoiIdIn(poiIds)) {
            result.computeIfAbsent(t.getPoi().getId(), k -> new LinkedHashMap<>())
                    .put(t.getLanguageCode(), t);
        }
        return result;
    }

    @Override
    public PoiDetailDto getPoiDetail(Long id, String lang) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + id));
        return resolveDetailDto(poi, lang);
    }

    @Override
    public PoiDetailDto getPoiByQrToken(String qrToken, String lang) {
        Poi poi = poiRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with QR token: " + qrToken));
        return resolveDetailDto(poi, lang);
    }

    @Override
    public PoiInternalQrDto getInternalPoiByQrToken(String qrToken) {
        Poi poi = poiRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with QR token: " + qrToken));

        String title = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), "vi")
                .map(PoiTranslation::getTitle)
                .orElse(poi.getName());

        return PoiInternalQrDto.builder()
                .poiId(poi.getId())
                .poiCode(poi.getCode())
                .zoneId(poi.getZone() != null ? poi.getZone().getId() : null)
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .title(title)
                .build();
    }

    @Override
    public List<PoiBoundingBoxDto> getPoisInBoundingBox(
            Long zoneId, BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng) {
        if (minLat.compareTo(maxLat) > 0 || minLng.compareTo(maxLng) > 0) {
            throw new BadRequestException("minLat/minLng must be <= maxLat/maxLng");
        }
        return poiRepository.findInBoundingBox(zoneId, minLat, maxLat, minLng, maxLng).stream()
                .map(PoiMapper::toBoundingBox)
                .toList();
    }

    @Override
    public PoiPremiumPriceDto getInternalPoiPremiumPrice(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        return PoiPremiumPriceDto.builder()
                .poiId(poi.getId())
                .poiCode(poi.getCode())
                .poiName(poi.getName())
                .premiumPrice(poi.getPremiumPrice())
                .build();
    }

    /**
     * Toàn bộ method chạy trong 1 transaction. KHÔNG gọi RabbitMQ ở đây:
     * chỉ phát PoiPublishRequestedEvent (Spring event nội bộ); PoiPublishRelay gửi poi.created SAU KHI commit.
     */
    @Override
    @Transactional
    public PoiDetailDto createPoi(CreatePoiRequest request) {
        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found with id: " + request.getZoneId()));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        validatePoiLocation(request.getLatitude(), request.getLongitude());
        validateTriggerRadius(request.getTriggerRadiusMeters());
        validateSupportedLanguages(request.getSupportedLanguages());

        if (poiRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("POI code already exists: " + request.getCode());
        }

        if (poiRepository.findByQrToken(request.getQrToken()).isPresent()) {
            throw new BadRequestException("POI QR token already exists: " + request.getQrToken());
        }

        Route route = resolveRoute(request, zone);
        LocalDateTime now = TimeUtils.nowUtc();

        Poi poi = Poi.builder()
                .zone(zone)
                .category(category)
                .route(route)
                .stopOrder(route != null ? request.getStopOrder() : null)
                .code(request.getCode())
                .qrToken(request.getQrToken())
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .triggerRadiusMeters(request.getTriggerRadiusMeters() != null ? request.getTriggerRadiusMeters() : 50)
                .address(request.getAddress())
                .thumbnailUrl(request.getThumbnailUrl())
                .premiumPrice(request.getPremiumPrice())
                .status("ACTIVE")
                .publishStatus(PublishStatus.PENDING)
                .publishEventType(PublishEventType.POI_CREATED)
                .publishAttempts(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        Poi savedPoi = poiRepository.save(poi);

        PoiTranslation viTranslation = PoiTranslation.builder()
                .poi(savedPoi)
                .languageCode(DEFAULT_LANG)
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .historicalSignificance(request.getHistoricalSignificance())
                .audioStatus("PENDING")
                .updatedAt(now)
                .build();

        PoiTranslation savedTranslation = translationRepository.save(viTranslation);

        applicationEventPublisher.publishEvent(new PoiPublishRequestedEvent(savedPoi.getId()));

        return mapToDetailDto(savedPoi, savedTranslation, false);
    }

    @Override
    @Transactional
    public AdminPoiDetailDto updatePoi(Long id, UpdatePoiRequest request) {
        Poi poi = poiRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + id));

        if (request.getVersion() == null || !Objects.equals(poi.getVersion(), request.getVersion())) {
            throw new ConflictException("Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BadRequestException("Category not found with id: " + request.getCategoryId()));

        validatePoiLocation(request.getLatitude(), request.getLongitude());
        validateTriggerRadius(request.getTriggerRadiusMeters());
        validateSupportedLanguages(request.getSupportedLanguages());

        Long oldRouteId = applyRouteAssignment(poi, request);

        poi.setName(request.getName());
        poi.setCategory(category);
        poi.setLatitude(request.getLatitude());
        poi.setLongitude(request.getLongitude());
        if (request.getTriggerRadiusMeters() != null) {
            poi.setTriggerRadiusMeters(request.getTriggerRadiusMeters());
        }

        poi.setAddress(request.getAddress());
        poi.setThumbnailUrl(request.getThumbnailUrl());
        poi.setPremiumPrice(request.getPremiumPrice());

        PoiTranslation viTranslation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), DEFAULT_LANG)
                .orElse(null);
        List<PoiTranslation> allTranslations = translationRepository.findByPoiId(poi.getId());

        boolean contentChanged = viTranslation == null
                || !Objects.equals(viTranslation.getTitle(), request.getTitle())
                || !Objects.equals(viTranslation.getSummary(), request.getSummary())
                || !Objects.equals(viTranslation.getDescription(), request.getDescription())
                || !Objects.equals(emptyToNull(viTranslation.getHistoricalSignificance()), emptyToNull(request.getHistoricalSignificance()));

        LocalDateTime now = TimeUtils.nowUtc();
        poi.setUpdatedAt(now);

        if (viTranslation == null) {
            viTranslation = PoiTranslation.builder()
                    .poi(poi)
                    .languageCode(DEFAULT_LANG)
                    .audioStatus("PENDING")
                    .build();
        }

        viTranslation.setTitle(request.getTitle());
        viTranslation.setSummary(request.getSummary());
        viTranslation.setDescription(request.getDescription());
        viTranslation.setHistoricalSignificance(request.getHistoricalSignificance());
        viTranslation.setUpdatedAt(now);

        if (contentChanged) {
            if (PublishStatus.PUBLISHED.equals(poi.getPublishStatus())) {
                poi.setPublishEventType(PublishEventType.POI_UPDATED);
            }
            // nếu đang PENDING hoặc FAILED thì giữ nguyên loại cũ

            viTranslation.setAudioStatus("PENDING");
            viTranslation.setAudioErrorReason(null);
            viTranslation.setAudioLastAttemptAt(null);
            poi.setPublishStatus(PublishStatus.PENDING);
            poi.setPublishAttempts(0);
            poi.setLastPublishError(null);
            poi.setLastPublishAttemptAt(null);

            // Đặt audio_status = 'PENDING' cho các hàng poi_translation của ngôn ngữ khác (en, ja, ko)
            // nhưng KHÔNG xóa title/summary/description/audio_url cũ
            for (PoiTranslation trans : allTranslations) {
                if (!DEFAULT_LANG.equalsIgnoreCase(trans.getLanguageCode())) {
                    trans.setAudioStatus("PENDING");
                    trans.setAudioErrorReason(null);
                    trans.setAudioLastAttemptAt(null);
                    trans.setUpdatedAt(now);
                    translationRepository.save(trans);
                }
            }
        }

        poi.setVersion((poi.getVersion() == null ? 0L : poi.getVersion()) + 1);
        poiRepository.save(poi);
        translationRepository.save(viTranslation);
        poiRepository.flush();

        if (contentChanged) {
            String routingKey = PublishEventType.POI_UPDATED.equals(poi.getPublishEventType())
                    ? RabbitMQConfig.ROUTING_KEY_POI_UPDATED
                    : RabbitMQConfig.ROUTING_KEY_POI_CREATED;
            applicationEventPublisher.publishEvent(
                    new PoiPublishRequestedEvent(poi.getId(), routingKey));
        }

        AdminPoiDetailDto result = mapToAdminDetail(poi, allTranslations, viTranslation);

        // Nếu POI đổi tuyến, giữ stop_order của tuyến cũ liên tục
        if (oldRouteId != null) {
            routeStopsSynchronizer.renumberRoute(oldRouteId);
        }

        return result;
    }

    private Long applyRouteAssignment(Poi poi, UpdatePoiRequest request) {
        Long routeId = request.getRouteId();
        Integer stopOrder = request.getStopOrder();
        boolean hasRoute = routeId != null;
        boolean hasStop = stopOrder != null;
        if (hasRoute != hasStop) {
            throw new BadRequestException("routeId and stopOrder must be provided together");
        }
        Long previousRouteId = poi.getRoute() != null ? poi.getRoute().getId() : null;
        if (!hasRoute) {
            poi.setRoute(null);
            poi.setStopOrder(null);
            if (previousRouteId != null) {
                return previousRouteId;
            }
            return null;
        }
        boolean alreadyOnRoute = poi.getRoute() != null && Objects.equals(poi.getRoute().getId(), routeId);
        boolean stopUnchanged = Objects.equals(poi.getStopOrder(), stopOrder);
        if (alreadyOnRoute && stopUnchanged) {
            return null;
        }
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));
        if (!Objects.equals(route.getZone().getId(), poi.getZone().getId())) {
            throw new BadRequestException("Route " + route.getId() + " does not belong to zone " + poi.getZone().getId());
        }
        if (poiRepository.existsByRouteIdAndStopOrder(route.getId(), stopOrder)) {
            throw new BadRequestException("stopOrder " + stopOrder + " already used in route " + route.getId());
        }
        poi.setRoute(route);
        poi.setStopOrder(stopOrder);
        if (previousRouteId != null && !previousRouteId.equals(route.getId())) {
            return previousRouteId;
        }
        return null;
    }

    private AdminPoiListItemDto toAdminListItem(Poi poi, Map<String, PoiTranslation> translationsByLang) {
        LanguageAggregate aggregate = aggregateLanguages(translationsByLang);
        List<AdminPoiLanguageDto> languages = aggregate.languages;

        List<String> attentionReasons = buildAttentionReasons(poi, languages, translationsByLang);

        return AdminPoiListItemDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .name(poi.getName())
                .slug(poi.getSlug())
                .zoneId(poi.getZone() != null ? poi.getZone().getId() : null)
                .zoneCode(poi.getZone() != null ? poi.getZone().getCode() : null)
                .routeId(poi.getRoute() != null ? poi.getRoute().getId() : null)
                .routeName(poi.getRoute() != null ? poi.getRoute().getName() : null)
                .stopOrder(poi.getStopOrder())
                .status(poi.getStatus())
                .version(poi.getVersion())
                .publishStatus(poi.getPublishStatus())
                .audioStatusByLanguage(aggregate.audioStatusByLanguage)
                .overallStatus(resolveOverallStatus(poi, attentionReasons))
                .attentionReasons(attentionReasons)
                .languageSummary(aggregate.summary)
                .languages(languages)
                .build();
    }

    private LanguageAggregate aggregateLanguages(Map<String, PoiTranslation> translationsByLang) {
        List<AdminPoiLanguageDto> languages = new ArrayList<>();
        Map<String, String> audioStatusByLanguage = new LinkedHashMap<>();
        int ready = 0;
        int failed = 0;

        for (String code : SUPPORTED_LANGUAGES) {
            PoiTranslation t = translationsByLang.get(code);
            String status = (t != null && t.getAudioStatus() != null)
                    ? t.getAudioStatus().toUpperCase(Locale.ROOT)
                    : "PENDING";
            if ("READY".equals(status)) {
                ready++;
            } else if (status.startsWith("FAILED")) {
                failed++;
            }
            if (t != null) {
                audioStatusByLanguage.put(code, t.getAudioStatus());
            }
            languages.add(AdminPoiLanguageDto.builder()
                    .languageCode(code)
                    .languageName(LANGUAGE_NAMES.getOrDefault(code, code))
                    .audioStatus(status)
                    .audioDurationSeconds(t != null ? t.getAudioDurationSeconds() : null)
                    .errorReason(t != null ? t.getAudioErrorReason() : null)
                    .lastAttemptAt(t != null ? t.getAudioLastAttemptAt() : null)
                    .build());
        }

        int total = SUPPORTED_LANGUAGES.size();
        AdminPoiLanguageSummaryDto summary = AdminPoiLanguageSummaryDto.builder()
                .total(total)
                .ready(ready)
                .pending(total - ready - failed)
                .failed(failed)
                .build();

        return new LanguageAggregate(languages, summary, audioStatusByLanguage);
    }

    private static final class LanguageAggregate {
        private final List<AdminPoiLanguageDto> languages;
        private final AdminPoiLanguageSummaryDto summary;
        private final Map<String, String> audioStatusByLanguage;

        private LanguageAggregate(
                List<AdminPoiLanguageDto> languages,
                AdminPoiLanguageSummaryDto summary,
                Map<String, String> audioStatusByLanguage) {
            this.languages = languages;
            this.summary = summary;
            this.audioStatusByLanguage = audioStatusByLanguage;
        }
    }

    private List<String> buildAttentionReasons(
            Poi poi, List<AdminPoiLanguageDto> languages, Map<String, PoiTranslation> translationsByLang) {
        List<String> reasons = new ArrayList<>();

        if ("MAINTENANCE".equalsIgnoreCase(poi.getStatus())) {
            reasons.add("Đang bảo trì");
        }

        PoiTranslation vi = translationsByLang.get(DEFAULT_LANG);
        if (vi == null || isBlank(vi.getTitle()) || isBlank(vi.getDescription())) {
            reasons.add("Thiếu nội dung tiếng Việt");
        }

        if (PublishStatus.FAILED.equals(poi.getPublishStatus())) {
            reasons.add("Phát hành thất bại");
        }

        LocalDateTime now = TimeUtils.nowUtc();
        for (AdminPoiLanguageDto lang : languages) {
            String name = lang.getLanguageName();
            String status = lang.getAudioStatus();
            if ("FAILED_TTS".equals(status)) {
                reasons.add(name + ": lỗi tổng hợp giọng đọc");
            } else if ("FAILED_TRANSLATION".equals(status)) {
                reasons.add(name + ": lỗi dịch nội dung");
            } else if ("FAILED".equals(status)) {
                reasons.add(name + ": lỗi xử lý audio");
            } else if ("PENDING".equals(status) || "PROCESSING".equals(status) || "GENERATING".equals(status)) {
                LocalDateTime attemptAt = lang.getLastAttemptAt();
                if (attemptAt == null) {
                    PoiTranslation t = translationsByLang.get(lang.getLanguageCode());
                    attemptAt = t != null ? t.getUpdatedAt() : null;
                }
                if (attemptAt != null && attemptAt.plusMinutes(pendingTimeoutMinutes).isBefore(now)) {
                    reasons.add(name + ": chờ xử lý quá " + pendingTimeoutMinutes + " phút");
                }
            }
        }

        return reasons;
    }

    private String resolveOverallStatus(Poi poi, List<String> attentionReasons) {
        if ("INACTIVE".equalsIgnoreCase(poi.getStatus())) {
            return "HIDDEN";
        }
        return attentionReasons.isEmpty() ? "ACTIVE" : "NEEDS_ATTENTION";
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private AdminPoiDetailDto mapToAdminDetail(Poi poi, List<PoiTranslation> translations, PoiTranslation primaryVi) {
        Map<String, AdminPoiTranslationDto> mapped = new LinkedHashMap<>();
        Map<String, PoiTranslation> translationsByLang = new LinkedHashMap<>();
        if (primaryVi != null && primaryVi.getLanguageCode() != null) {
            mapped.put(primaryVi.getLanguageCode(), toAdminTranslation(primaryVi));
            translationsByLang.put(primaryVi.getLanguageCode(), primaryVi);
        }
        if (translations != null) {
            for (PoiTranslation t : translations) {
                if (t.getLanguageCode() != null) {
                    translationsByLang.putIfAbsent(t.getLanguageCode(), t);
                }
                mapped.putIfAbsent(t.getLanguageCode(), toAdminTranslation(t));
            }
        }

        LanguageAggregate aggregate = aggregateLanguages(translationsByLang);
        List<String> attentionReasons = buildAttentionReasons(poi, aggregate.languages, translationsByLang);

        return AdminPoiDetailDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .slug(poi.getSlug())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .address(poi.getAddress())
                .thumbnailUrl(poi.getThumbnailUrl())
                .premiumPrice(poi.getPremiumPrice())
                .zoneId(poi.getZone() != null ? poi.getZone().getId() : null)
                .zoneCode(poi.getZone() != null ? poi.getZone().getCode() : null)
                .categoryId(poi.getCategory() != null ? poi.getCategory().getId() : null)
                .categoryCode(poi.getCategory() != null ? poi.getCategory().getCode() : null)
                .categoryNameVi(poi.getCategory() != null ? poi.getCategory().getNameVi() : null)
                .routeId(poi.getRoute() != null ? poi.getRoute().getId() : null)
                .routeName(poi.getRoute() != null ? poi.getRoute().getName() : null)
                .stopOrder(poi.getStopOrder())
                .status(poi.getStatus())
                .version(poi.getVersion())
                .publishStatus(poi.getPublishStatus())
                .publishAttempts(poi.getPublishAttempts())
                .lastPublishAttemptAt(poi.getLastPublishAttemptAt())
                .overallStatus(resolveOverallStatus(poi, attentionReasons))
                .attentionReasons(attentionReasons)
                .languageSummary(aggregate.summary)
                .languages(aggregate.languages)
                .translations(mapped)
                .build();
    }

    private AdminPoiTranslationDto toAdminTranslation(PoiTranslation t) {
        return AdminPoiTranslationDto.builder()
                .languageCode(t.getLanguageCode())
                .title(t.getTitle())
                .summary(t.getSummary())
                .description(t.getDescription())
                .historicalSignificance(t.getHistoricalSignificance())
                .audioUrl(t.getAudioUrl())
                .audioDurationSeconds(t.getAudioDurationSeconds())
                .audioStatus(t.getAudioStatus())
                .source(t.getSource())
                .errorReason(t.getAudioErrorReason())
                .lastAttemptAt(t.getAudioLastAttemptAt())
                .build();
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    @Override
    public PoiPublishStatusDto getPublishStatus(Long poiId) {
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        return PoiMapper.toPublishStatus(poi);
    }

    @Override
    public List<PoiPublishStatusDto> getPublishStatuses(String status) {
        String normalized = status == null ? PublishStatus.FAILED : status.trim().toUpperCase(Locale.ROOT);
        if (!PUBLISH_STATUSES.contains(normalized)) {
            throw new BadRequestException("status must be one of " + PUBLISH_STATUSES);
        }
        return poiRepository.findByPublishStatus(normalized).stream()
                .map(PoiMapper::toPublishStatus)
                .toList();
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public PoiPublishStatusDto republish(Long poiId) {
        poiPublishService.republish(poiId);
        return getPublishStatusFresh(poiId);
    }

    private PoiPublishStatusDto getPublishStatusFresh(Long poiId) {
        return poiRepository.findById(poiId).map(PoiMapper::toPublishStatus)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
    }

    @Override
    public AdminAudioStatusDto getAudioStatus() {
        List<Poi> pois = poiRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        Map<Long, Map<String, PoiTranslation>> translationsByPoi =
                loadTranslations(pois.stream().map(Poi::getId).toList());

        List<AdminAudioPoiDto> items = new ArrayList<>(pois.size());
        int ready = 0;
        int pending = 0;
        int failed = 0;
        for (Poi poi : pois) {
            Map<String, PoiTranslation> byLang = translationsByPoi.getOrDefault(poi.getId(), Map.of());
            LanguageAggregate aggregate = aggregateLanguages(byLang);
            ready += aggregate.summary.getReady();
            pending += aggregate.summary.getPending();
            failed += aggregate.summary.getFailed();
            items.add(AdminAudioPoiDto.builder()
                    .id(poi.getId())
                    .code(poi.getCode())
                    .name(poi.getName())
                    .status(poi.getStatus())
                    .publishStatus(poi.getPublishStatus())
                    .allReady(aggregate.summary.getReady() == aggregate.summary.getTotal())
                    .languages(aggregate.languages)
                    .build());
        }

        return AdminAudioStatusDto.builder()
                .generatedAt(TimeUtils.nowUtc())
                .totalPois(pois.size())
                .readyLanguages(ready)
                .pendingLanguages(pending)
                .failedLanguages(failed)
                .allReady(pending == 0 && failed == 0)
                .pois(items)
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AudioRegenerationResultDto regenerateAudio(Long poiId, List<String> languages) {
        poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + poiId));
        List<PoiTranslation> translations = translationRepository.findByPoiId(poiId);
        List<String> selected = resolveAudioLanguages(translations, languages);

        if (selected.isEmpty()) {
            return AudioRegenerationResultDto.builder()
                    .poiId(poiId)
                    .languages(List.of())
                    .requestedLanguages(0)
                    .message("Tất cả ngôn ngữ đã READY, không cần tạo lại audio.")
                    .build();
        }

        resetAudioTranslations(poiId, selected);
        String publishStatus = poiPublishService.republish(poiId, true, selected);
        log.info("Admin requested audio regeneration for poiId={}, languages={}, publishStatus={}",
                poiId, selected, publishStatus);

        return AudioRegenerationResultDto.builder()
                .poiId(poiId)
                .languages(selected)
                .requestedLanguages(selected.size())
                .publishStatus(publishStatus)
                .message("Đã xếp hàng tạo lại audio cho " + selected.size() + " ngôn ngữ.")
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AudioRegenerationBatchDto regenerateNonReadyAudio() {
        List<Poi> pois = poiRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<Long> requestedPois = new ArrayList<>();
        List<String> failures = new ArrayList<>();
        int languageCount = 0;
        int skipped = 0;

        for (Poi poi : pois) {
            List<PoiTranslation> translations = translationRepository.findByPoiId(poi.getId());
            List<String> nonReady = resolveAudioLanguages(translations, null);
            if (nonReady.isEmpty()) {
                skipped++;
                continue;
            }
            try {
                AudioRegenerationResultDto result = regenerateAudio(poi.getId(), nonReady);
                if (result.getRequestedLanguages() > 0) {
                    requestedPois.add(poi.getId());
                    languageCount += result.getRequestedLanguages();
                } else {
                    skipped++;
                }
            } catch (RuntimeException ex) {
                log.warn("Cannot regenerate audio for poiId={}: {}", poi.getId(), ex.getMessage());
                failures.add("POI " + poi.getId() + ": " + ex.getMessage());
            }
        }

        return AudioRegenerationBatchDto.builder()
                .poiCount(requestedPois.size())
                .languageCount(languageCount)
                .skippedPoiCount(skipped)
                .poiIds(requestedPois)
                .failures(failures)
                .build();
    }

    /**
     * Danh sách ngôn ngữ cần tạo lại:
     * - languages rỗng/null: mọi ngôn ngữ chưa READY (kể cả hàng bản dịch còn thiếu).
     * - languages chỉ định: tạo lại đúng các ngôn ngữ đó, kể cả đang READY.
     */
    private List<String> resolveAudioLanguages(List<PoiTranslation> translations, List<String> requested) {
        Map<String, PoiTranslation> byLang = new HashMap<>();
        for (PoiTranslation translation : translations) {
            if (translation.getLanguageCode() != null) {
                byLang.put(translation.getLanguageCode().toLowerCase(Locale.ROOT), translation);
            }
        }

        if (requested == null || requested.isEmpty()) {
            List<String> nonReady = new ArrayList<>();
            for (String code : SUPPORTED_LANGUAGES) {
                PoiTranslation translation = byLang.get(code);
                String status = translation != null && translation.getAudioStatus() != null
                        ? translation.getAudioStatus().toUpperCase(Locale.ROOT)
                        : "PENDING";
                if (!"READY".equals(status)) {
                    nonReady.add(code);
                }
            }
            return nonReady;
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String raw : requested) {
            if (raw == null) {
                continue;
            }
            for (String part : raw.split(",")) {
                String code = part.trim().toLowerCase(Locale.ROOT);
                if (code.isEmpty()) {
                    continue;
                }
                if (!SUPPORTED_LANGUAGES.contains(code)) {
                    throw new BadRequestException("Ngôn ngữ không được hỗ trợ: " + part
                            + ". Chỉ hỗ trợ: " + String.join(", ", SUPPORTED_LANGUAGES));
                }
                normalized.add(code);
            }
        }
        return new ArrayList<>(normalized);
    }

    private void resetAudioTranslations(Long poiId, List<String> languages) {
        if (transactionTemplate == null) {
            throw new IllegalStateException("TransactionTemplate is required to regenerate audio");
        }
        Set<String> selected = Set.copyOf(languages);
        transactionTemplate.executeWithoutResult(status -> {
            LocalDateTime now = TimeUtils.nowUtc();
            for (PoiTranslation translation : translationRepository.findByPoiId(poiId)) {
                String code = translation.getLanguageCode() != null
                        ? translation.getLanguageCode().toLowerCase(Locale.ROOT) : null;
                if (code == null || !selected.contains(code)) {
                    continue;
                }
                translation.setAudioStatus("PENDING");
                translation.setAudioUrl(null);
                translation.setAudioDurationSeconds(0);
                translation.setAudioErrorReason(null);
                translation.setAudioLastAttemptAt(null);
                translation.setUpdatedAt(now);
                translationRepository.save(translation);
            }
        });
    }

    private Route resolveRoute(CreatePoiRequest request, Zone zone) {
        boolean hasRoute = request.getRouteId() != null;
        boolean hasStop = request.getStopOrder() != null;
        if (hasRoute != hasStop) {
            throw new BadRequestException("routeId and stopOrder must be provided together");
        }
        if (!hasRoute) {
            return null;
        }
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + request.getRouteId()));
        if (!Objects.equals(route.getZone().getId(), zone.getId())) {
            throw new BadRequestException("Route " + route.getId() + " does not belong to zone " + zone.getId());
        }
        if (poiRepository.existsByRouteIdAndStopOrder(route.getId(), request.getStopOrder())) {
            throw new BadRequestException("stopOrder " + request.getStopOrder() + " already used in route " + route.getId());
        }
        return route;
    }

    private PoiDetailDto resolveDetailDto(Poi poi, String requestedLang) {
        String lang = (requestedLang != null && !requestedLang.isBlank()) ? requestedLang.trim().toLowerCase(Locale.ROOT) : DEFAULT_LANG;

        Optional<PoiTranslation> translationOpt = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), lang);
        boolean isFallback = false;

        PoiTranslation translation;
        if (DEFAULT_LANG.equalsIgnoreCase(lang)) {
            translation = translationOpt.orElse(null);
        } else if (translationOpt.isPresent()) {
            // Trả văn bản bản dịch ngay cả khi audio chưa sẵn sàng (PENDING/PROCESSING/FAILED...):
            // văn bản không còn bị khóa theo audio_status. Audio thiếu -> client tự xử lý (audioUrl null).
            translation = translationOpt.get();
        } else {
            // Chỉ fallback sang tiếng Việt khi hoàn toàn CHƯA có hàng bản dịch cho ngôn ngữ yêu cầu.
            isFallback = true;
            translation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), DEFAULT_LANG)
                    .orElse(null);
        }

        return mapToDetailDto(poi, translation, isFallback);
    }

    private PoiDetailDto mapToDetailDto(Poi poi, PoiTranslation translation, boolean isFallback) {
        PoiDetailDto.PoiDetailDtoBuilder builder = PoiDetailDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .slug(poi.getSlug())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .address(poi.getAddress())
                .thumbnailUrl(poi.getThumbnailUrl())
                .zoneId(poi.getZone().getId())
                .zoneCode(poi.getZone().getCode())
                .categoryCode(poi.getCategory().getCode())
                .routeId(poi.getRoute() != null ? poi.getRoute().getId() : null)
                .stopOrder(poi.getStopOrder())
                .premiumPrice(poi.getPremiumPrice())
                .isFallbackLanguage(isFallback)
                .chapters(loadDetailChapters(poi, translation));

        if (translation != null) {
            builder.languageCode(translation.getLanguageCode())
                    .title(translation.getTitle())
                    .summary(translation.getSummary())
                    .description(translation.getDescription())
                    .historicalSignificance(translation.getHistoricalSignificance())
                    .audioUrl(translation.getAudioUrl())
                    .audioDurationSeconds(translation.getAudioDurationSeconds())
                    .audioStatus(translation.getAudioStatus());
        } else {
            builder.languageCode(DEFAULT_LANG)
                    .title(poi.getName())
                    .summary("")
                    .description("")
                    .audioStatus("PENDING");
        }

        return builder.build();
    }

    /** Chap của ngôn ngữ đang truy vấn; thiếu thì fallback tiếng Việt (đồng bộ fallback narration). */
    private List<PoiGuideChapterDto> loadDetailChapters(Poi poi, PoiTranslation translation) {
        String lang = (translation != null && translation.getLanguageCode() != null)
                ? translation.getLanguageCode() : DEFAULT_LANG;
        Set<String> langs = new java.util.LinkedHashSet<>();
        if (lang != null) {
            langs.add(lang);
        }
        if (!DEFAULT_LANG.equalsIgnoreCase(lang)) {
            // Fallback tiếng Việt để UI luôn có nội dung khi bản dịch chap chưa có.
            langs.add(DEFAULT_LANG);
        }

        List<PoiChapter> chapters = chapterRepository.findByPoiIdAndIsActiveTrueOrderByChapterOrderAsc(poi.getId());
        if (chapters.isEmpty()) {
            return List.of();
        }
        List<Long> chapterIds = chapters.stream().map(PoiChapter::getId).toList();
        Map<Long, Map<String, PoiChapterTranslation>> byChapter = new HashMap<>();
        for (PoiChapterTranslation ct : chapterTranslationRepository.findByChapterIdIn(chapterIds)) {
            byChapter.computeIfAbsent(ct.getChapter().getId(), k -> new LinkedHashMap<>())
                    .putIfAbsent(ct.getLanguageCode(), ct);
        }

        List<PoiGuideChapterDto> result = new ArrayList<>();
        for (PoiChapter chapter : chapters) {
            for (String code : langs) {
                PoiChapterTranslation ct = byChapter
                        .getOrDefault(chapter.getId(), Map.of())
                        .get(code);
                if (ct == null) {
                    continue;
                }
                result.add(PoiGuideChapterDto.builder()
                        .order(chapter.getChapterOrder())
                        .title(ct.getTitle())
                        .narrationText(ct.getNarrationText())
                        .audioUrl(ct.getAudioUrl())
                        .audioDurationSeconds(ct.getAudioDurationSeconds())
                        .audioStatus(ct.getAudioStatus())
                        .build());
                break; // ngôn ngữ ưu tiên đầu tiên có chap là dừng
            }
        }
        return result;
    }
}
