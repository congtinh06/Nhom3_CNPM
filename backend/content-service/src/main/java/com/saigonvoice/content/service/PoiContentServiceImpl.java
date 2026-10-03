package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.entity.Category;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.entity.Zone;
import com.saigonvoice.content.event.PoiCreatedEvent;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.messaging.PoiEventPublisher;
import com.saigonvoice.content.repository.CategoryRepository;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import com.saigonvoice.content.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PoiContentServiceImpl implements PoiContentService {

    private static final String DEFAULT_LANG = "vi";
    private static final List<String> SUPPORTED_TARGET_LANGUAGES = List.of("en", "ja", "ko");

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;
    private final ZoneRepository zoneRepository;
    private final CategoryRepository categoryRepository;
    private final PoiEventPublisher poiEventPublisher;

    @Override
    public List<PoiSummaryDto> getPois(Long zoneId) {
        List<Poi> pois;
        if (zoneId != null) {
            pois = poiRepository.findByZoneIdAndStatus(zoneId, "ACTIVE");
        } else {
            pois = poiRepository.findAll().stream()
                    .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                    .toList();
        }

        return pois.stream()
                .map(this::mapToSummaryDto)
                .toList();
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
        return poiRepository.findInBoundingBox(zoneId, minLat, maxLat, minLng, maxLng).stream()
                .map(this::mapToBoundingBoxDto)
                .toList();
    }

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

        Poi poi = Poi.builder()
                .zone(zone)
                .category(category)
                .code(request.getCode())
                .qrToken(request.getQrToken())
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .triggerRadiusMeters(request.getTriggerRadiusMeters() != null ? request.getTriggerRadiusMeters() : 50)
                .address(request.getAddress())
                .thumbnailUrl(request.getThumbnailUrl())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Poi savedPoi = poiRepository.save(poi);

        // Tạo bản dịch tiếng Việt gốc
        PoiTranslation viTranslation = PoiTranslation.builder()
                .poi(savedPoi)
                .languageCode(DEFAULT_LANG)
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .historicalSignificance(request.getHistoricalSignificance())
                .audioStatus("PENDING")
                .updatedAt(LocalDateTime.now())
                .build();

        PoiTranslation savedTranslation = translationRepository.save(viTranslation);

        // Bắn event qua RabbitMQ để translation-tts-service xử lý dịch & sinh audio
        PoiCreatedEvent event = PoiCreatedEvent.builder()
                .poiId(savedPoi.getId())
                .poiCode(savedPoi.getCode())
                .zoneId(savedPoi.getZone().getId())
                .sourceLanguage(DEFAULT_LANG)
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .historicalSignificance(request.getHistoricalSignificance())
                .targetLanguages(SUPPORTED_TARGET_LANGUAGES)
                .build();

        poiEventPublisher.publishPoiCreated(event);

        return mapToDetailDto(savedPoi, savedTranslation, false);
    }

    private PoiDetailDto resolveDetailDto(Poi poi, String requestedLang) {
        String lang = (requestedLang != null && !requestedLang.isBlank()) ? requestedLang.trim().toLowerCase() : DEFAULT_LANG;

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

    private PoiSummaryDto mapToSummaryDto(Poi poi) {
        return PoiSummaryDto.builder()
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
                .categoryNameVi(poi.getCategory().getNameVi())
                .build();
    }

    private PoiBoundingBoxDto mapToBoundingBoxDto(Poi poi) {
        return PoiBoundingBoxDto.builder()
                .id(poi.getId())
                .code(poi.getCode())
                .qrToken(poi.getQrToken())
                .name(poi.getName())
                .latitude(poi.getLatitude())
                .longitude(poi.getLongitude())
                .triggerRadiusMeters(poi.getTriggerRadiusMeters())
                .zoneId(poi.getZone().getId())
                .build();
    }
}
