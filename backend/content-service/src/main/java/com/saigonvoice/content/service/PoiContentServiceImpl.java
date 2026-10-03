package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiPublishStatusDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.entity.Category;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.entity.PublishStatus;
import com.saigonvoice.content.entity.Route;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.messaging.PoiPublishRequestedEvent;
import com.saigonvoice.content.repository.CategoryRepository;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import com.saigonvoice.content.repository.RouteRepository;
import com.saigonvoice.content.repository.ZoneRepository;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
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

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;
    private final ZoneRepository zoneRepository;
    private final CategoryRepository categoryRepository;
    private final RouteRepository routeRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final PoiPublishService poiPublishService;

    @Override
    public List<PoiSummaryDto> getPois(Long zoneId) {
        List<Poi> pois = zoneId != null
                ? poiRepository.findByZoneIdAndStatus(zoneId, "ACTIVE")
                : poiRepository.findByStatus("ACTIVE");
        return pois.stream().map(PoiMapper::toSummary).toList();
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
    public List<PoiBoundingBoxDto> getPoisInBoundingBox(
            Long zoneId, BigDecimal minLat, BigDecimal maxLat, BigDecimal minLng, BigDecimal maxLng) {
        if (minLat.compareTo(maxLat) > 0 || minLng.compareTo(maxLng) > 0) {
            throw new BadRequestException("minLat/minLng must be <= maxLat/maxLng");
        }
        return poiRepository.findInBoundingBox(zoneId, minLat, maxLat, minLng, maxLng).stream()
                .map(PoiMapper::toBoundingBox)
                .toList();
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
                .status("ACTIVE")
                .publishStatus(PublishStatus.PENDING)
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
        return poiRepository.findAll().stream()
                .filter(p -> normalized.equals(p.getPublishStatus()))
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
        if (translationOpt.isPresent()) {
            translation = translationOpt.get();
        } else {
            // Fallback sang tiếng Việt nếu không có ngôn ngữ yêu cầu
            isFallback = !DEFAULT_LANG.equalsIgnoreCase(lang);
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
                .isFallbackLanguage(isFallback);

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
}
