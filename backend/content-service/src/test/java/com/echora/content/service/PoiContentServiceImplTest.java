package com.echora.content.service;

import com.echora.content.dto.AdminPoiDetailDto;
import com.echora.content.dto.AdminPoiListItemDto;
import com.echora.content.dto.CreatePoiRequest;
import com.echora.content.dto.PoiBoundingBoxDto;
import com.echora.content.dto.PoiDetailDto;
import com.echora.content.dto.PoiInternalQrDto;
import com.echora.content.dto.PoiPublishStatusDto;
import com.echora.content.dto.PoiSummaryDto;
import com.echora.content.dto.UpdatePoiRequest;
import com.echora.content.entity.Category;
import com.echora.content.entity.Poi;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiContentServiceImplTest {

    @Mock private PoiRepository poiRepository;
    @Mock private PoiTranslationRepository translationRepository;
    @Mock private PoiChapterRepository chapterRepository;
    @Mock private PoiChapterTranslationRepository chapterTranslationRepository;
    @Mock private ZoneRepository zoneRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private RouteRepository routeRepository;
    @Mock private ApplicationEventPublisher applicationEventPublisher;
    @Mock private PoiPublishService poiPublishService;
    @Mock private RouteStopsSynchronizer routeStopsSynchronizer;

    @InjectMocks
    private PoiContentServiceImpl poiContentService;

    private Zone sampleZone;
    private Category sampleCategory;
    private Poi samplePoi;
    private PoiTranslation viTranslation;

    @BeforeEach
    void setUp() {
        sampleZone = Zone.builder()
                .id(1L).code("D1_HISTORIC").name("Trung tam Quan 1")
                .centerLat(new BigDecimal("10.7769000")).centerLng(new BigDecimal("106.7009000"))
                .radiusMeters(600).isActive(true).build();

        sampleCategory = Category.builder()
                .id(1L).code("ARCHITECTURE").nameVi("Kien truc").nameEn("Architecture").build();

        samplePoi = Poi.builder()
                .id(100L).zone(sampleZone).category(sampleCategory)
                .code("POI_TEST_01").qrToken("qr-test-01").name("Buu Dien Trung Tam")
                .latitude(new BigDecimal("10.7799000")).longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50).status("ACTIVE").build();

        viTranslation = PoiTranslation.builder()
                .id(200L).poi(samplePoi).languageCode("vi")
                .title("Buu Dien Trung Tam").summary("Tom tat").description("Mo ta chi tiet")
                .historicalSignificance("Gia tri lich su").audioStatus("READY")
                .audioUrl("http://localhost:8083/api/tts/audio/test_vi.mp3").audioDurationSeconds(120)
                .build();
    }

    private CreatePoiRequest.CreatePoiRequestBuilder baseRequest() {
        return CreatePoiRequest.builder()
                .zoneId(1L).categoryId(1L).code("POI_NEW_01").qrToken("qr-new-01").name("Diem moi")
                .latitude(new BigDecimal("10.7750000")).longitude(new BigDecimal("106.7050000"))
                .triggerRadiusMeters(50).title("Tieu de").summary("Tom tat").description("Mo ta");
    }

    @Test
    @DisplayName("getPois: return active POI summaries for zone")
    void testGetPois() {
        when(poiRepository.findByZoneIdAndStatus(1L, "ACTIVE")).thenReturn(List.of(samplePoi));

        List<PoiSummaryDto> results = poiContentService.getPois(1L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("POI_TEST_01");
        assertThat(results.get(0).getZoneCode()).isEqualTo("D1_HISTORIC");
        assertThat(results.get(0).getRouteId()).isNull();
    }

    @Test
    @DisplayName("getPoiDetail: returns Vietnamese translation when requested")
    void testGetPoiDetail_Vi() {
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "vi");

        assertThat(detail.getLanguageCode()).isEqualTo("vi");
        assertThat(detail.getAudioStatus()).isEqualTo("READY");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: fallback to Vietnamese when requested Japanese is missing")
    void testGetPoiDetail_FallbackToVi() {
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "ja")).thenReturn(Optional.empty());
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "ja");

        assertThat(detail.getTitle()).isEqualTo("Buu Dien Trung Tam");
        assertThat(detail.isFallbackLanguage()).isTrue();
    }

    @Test
    @DisplayName("getPoiDetail: returns translation when audioStatus is READY (usable)")
    void testGetPoiDetail_UsableStatus_Ready() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central Post Office").audioStatus("READY").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en")).thenReturn(Optional.of(en));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "en");

        assertThat(detail.getLanguageCode()).isEqualTo("en");
        assertThat(detail.getTitle()).isEqualTo("Central Post Office");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: returns translation when audioStatus is FAILED_TTS (usable)")
    void testGetPoiDetail_UsableStatus_FailedTts() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central Post Office").audioStatus("FAILED_TTS").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en")).thenReturn(Optional.of(en));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "en");

        assertThat(detail.getLanguageCode()).isEqualTo("en");
        assertThat(detail.getTitle()).isEqualTo("Central Post Office");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: returns translation text even when audioStatus is PENDING (text is not gated by audio)")
    void testGetPoiDetail_TranslationText_WhenPending() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central Post Office").audioStatus("PENDING").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en")).thenReturn(Optional.of(en));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "en");

        assertThat(detail.getLanguageCode()).isEqualTo("en");
        assertThat(detail.getTitle()).isEqualTo("Central Post Office");
        assertThat(detail.getAudioStatus()).isEqualTo("PENDING");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: returns translation text even when audioStatus is PROCESSING")
    void testGetPoiDetail_TranslationText_WhenProcessing() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central Post Office").audioStatus("PROCESSING").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en")).thenReturn(Optional.of(en));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "en");

        assertThat(detail.getLanguageCode()).isEqualTo("en");
        assertThat(detail.getTitle()).isEqualTo("Central Post Office");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: returns translation text even when audioStatus is FAILED")
    void testGetPoiDetail_TranslationText_WhenFailed() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central Post Office").audioStatus("FAILED").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en")).thenReturn(Optional.of(en));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "en");

        assertThat(detail.getLanguageCode()).isEqualTo("en");
        assertThat(detail.getTitle()).isEqualTo("Central Post Office");
        assertThat(detail.isFallbackLanguage()).isFalse();
    }

    @Test
    @DisplayName("getPoiDetail: throws ResourceNotFoundException if POI not found")
    void testGetPoiDetail_NotFound() {
        when(poiRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.getPoiDetail(999L, "vi"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("POI not found");
    }

    @Test
    @DisplayName("getPoisInBoundingBox: maps repository result to bounding box DTOs")
    void testGetPoisInBoundingBox() {
        BigDecimal minLat = new BigDecimal("10.770"), maxLat = new BigDecimal("10.785");
        BigDecimal minLng = new BigDecimal("106.690"), maxLng = new BigDecimal("106.710");
        when(poiRepository.findInBoundingBox(1L, minLat, maxLat, minLng, maxLng)).thenReturn(List.of(samplePoi));

        List<PoiBoundingBoxDto> results = poiContentService.getPoisInBoundingBox(1L, minLat, maxLat, minLng, maxLng);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getZoneId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getPoisInBoundingBox: rejects inverted box")
    void testGetPoisInBoundingBox_Inverted() {
        assertThatThrownBy(() -> poiContentService.getPoisInBoundingBox(1L,
                new BigDecimal("10.8"), new BigDecimal("10.7"), new BigDecimal("106.6"), new BigDecimal("106.7")))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(poiRepository);
    }

    @Test
    @DisplayName("createPoi: saves POI + VI translation and only raises an internal after-commit event (no direct RabbitMQ call)")
    void testCreatePoi_Success() {
        CreatePoiRequest request = baseRequest().build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode("POI_NEW_01")).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken("qr-new-01")).thenReturn(Optional.empty());
        when(poiRepository.save(any(Poi.class))).thenAnswer(inv -> {
            Poi p = inv.getArgument(0);
            p.setId(105L);
            return p;
        });
        when(translationRepository.save(any(PoiTranslation.class))).thenAnswer(inv -> inv.getArgument(0));

        PoiDetailDto result = poiContentService.createPoi(request);

        assertThat(result.getId()).isEqualTo(105L);
        ArgumentCaptor<PoiPublishRequestedEvent> captor = ArgumentCaptor.forClass(PoiPublishRequestedEvent.class);
        verify(applicationEventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().poiId()).isEqualTo(105L);
        verifyNoInteractions(poiPublishService);
    }

    @Test
    @DisplayName("createPoi: rejects coordinates outside the configured Ho Chi Minh City bounds")
    void testCreatePoi_RejectsOutOfCityCoordinates() {
        CreatePoiRequest request = baseRequest()
                .latitude(new BigDecimal("25.0000000"))
                .longitude(new BigDecimal("25.0000000"))
                .build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("TP.HCM");
        verifyNoInteractions(poiRepository);
    }

    @Test
    @DisplayName("createPoi: accepts coordinates exactly on the configured city boundary")
    void testCreatePoi_AcceptsBoundaryCoordinates() {
        CreatePoiRequest request = baseRequest()
                .latitude(new BigDecimal("10.3000000"))
                .longitude(new BigDecimal("106.3000000"))
                .build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode("POI_NEW_01")).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken("qr-new-01")).thenReturn(Optional.empty());
        when(poiRepository.save(any(Poi.class))).thenAnswer(inv -> inv.getArgument(0));
        when(translationRepository.save(any(PoiTranslation.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(poiContentService.createPoi(request).getLatitude())
                .isEqualByComparingTo("10.3000000");
    }

    @Test
    @DisplayName("createPoi: rejects trigger radius above the configured maximum")
    void testCreatePoi_RejectsTooLargeRadius() {
        CreatePoiRequest request = baseRequest().triggerRadiusMeters(5001).build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Bán kính");
        verifyNoInteractions(poiRepository);
    }

    @Test
    @DisplayName("createPoi: rejects unsupported narration languages")
    void testCreatePoi_RejectsUnsupportedLanguage() {
        CreatePoiRequest request = baseRequest().supportedLanguages(List.of("vi", "fr")).build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fr");
        verifyNoInteractions(poiRepository);
    }

    @Test
    @DisplayName("getPois: only queries ACTIVE POIs, so inactive or junk rows never reach the public list")
    void testGetPois_OnlyActiveRows() {
        when(poiRepository.findByStatus("ACTIVE")).thenReturn(List.of(samplePoi));

        List<PoiSummaryDto> results = poiContentService.getPois(null);

        assertThat(results).extracting(PoiSummaryDto::getCode).containsExactly("POI_TEST_01");
        verify(poiRepository).findByStatus("ACTIVE");
        verify(poiRepository, never()).findAll();
    }


    @Test
    @DisplayName("createPoi: throws BadRequestException if code already exists")
    void testCreatePoi_DuplicateCode() {
        CreatePoiRequest request = baseRequest().code("POI_TEST_01").build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode("POI_TEST_01")).thenReturn(Optional.of(samplePoi));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("POI code already exists");

        verify(poiRepository, never()).save(any());
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("createPoi: routeId without stopOrder is rejected")
    void testCreatePoi_RouteWithoutStopOrder() {
        CreatePoiRequest request = baseRequest().routeId(7L).build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode(any())).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("routeId and stopOrder");
    }

    @Test
    @DisplayName("createPoi: route of another zone is rejected")
    void testCreatePoi_RouteOtherZone() {
        Zone otherZone = Zone.builder().id(2L).code("CHO_LON").build();
        Route route = Route.builder().id(7L).zone(otherZone).name("Tuyen khac").build();
        CreatePoiRequest request = baseRequest().routeId(7L).stopOrder(1).build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode(any())).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken(any())).thenReturn(Optional.empty());
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not belong to zone");
    }

    @Test
    @DisplayName("createPoi: duplicate stopOrder in route is rejected")
    void testCreatePoi_DuplicateStopOrder() {
        Route route = Route.builder().id(7L).zone(sampleZone).name("Tuyen").build();
        CreatePoiRequest request = baseRequest().routeId(7L).stopOrder(2).build();
        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode(any())).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken(any())).thenReturn(Optional.empty());
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.existsByRouteIdAndStopOrder(7L, 2)).thenReturn(true);

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already used");
    }

    private UpdatePoiRequest.UpdatePoiRequestBuilder baseUpdateRequest() {
        return UpdatePoiRequest.builder()
                .version(0L)
                .categoryId(1L)
                .name("Buu Dien Trung Tam")
                .latitude(new BigDecimal("10.7799000"))
                .longitude(new BigDecimal("106.7001000"))
                .triggerRadiusMeters(50)
                .address("So 2 Cong xa Paris")
                .thumbnailUrl("/images/buudien.jpg")
                .title("Buu Dien Trung Tam")
                .summary("Tom tat")
                .description("Mo ta chi tiet")
                .historicalSignificance("Gia tri lich su");
    }

    @Test
    @DisplayName("updatePoi: throws ResourceNotFoundException if POI does not exist (404)")
    void testUpdatePoi_NotFound() {
        UpdatePoiRequest request = baseUpdateRequest().build();
        when(poiRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.updatePoi(999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("POI not found");

        verify(poiRepository, never()).save(any());
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("updatePoi: throws BadRequestException if category does not exist (400)")
    void testUpdatePoi_CategoryNotFound() {
        UpdatePoiRequest request = baseUpdateRequest().categoryId(999L).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.updatePoi(100L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Category not found");

        verify(poiRepository, never()).save(any());
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("updatePoi: changes in Vietnamese content publish poi.updated and reset status to PENDING")
    void testUpdatePoi_VietnameseContentChanged_PublishesEvent() {
        UpdatePoiRequest request = baseUpdateRequest()
                .title("Buu Dien Trung Tam Cap Nhat")
                .description("Mo ta moi hoan toan")
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        samplePoi.setPublishStatus(PublishStatus.PUBLISHED);
        samplePoi.setPublishAttempts(2);

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getTranslations().get("vi").getTitle()).isEqualTo("Buu Dien Trung Tam Cap Nhat");
        assertThat(samplePoi.getPublishStatus()).isEqualTo(PublishStatus.PENDING);
        assertThat(samplePoi.getPublishEventType()).isEqualTo(PublishEventType.POI_UPDATED);
        assertThat(samplePoi.getPublishAttempts()).isEqualTo(0);
        assertThat(viTranslation.getAudioStatus()).isEqualTo("PENDING");

        verify(poiRepository).save(samplePoi);
        verify(translationRepository).save(viTranslation);

        ArgumentCaptor<PoiPublishRequestedEvent> captor = ArgumentCaptor.forClass(PoiPublishRequestedEvent.class);
        verify(applicationEventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().poiId()).isEqualTo(100L);
        assertThat(captor.getValue().routingKey()).isEqualTo("poi.updated");
    }

    @Test
    @DisplayName("updatePoi: only updating coordinates/address/thumbnail does NOT publish event")
    void testUpdatePoi_OnlyMetadataChanged_DoesNotPublish() {
        UpdatePoiRequest request = baseUpdateRequest()
                .latitude(new BigDecimal("10.7812000"))
                .longitude(new BigDecimal("106.7055000"))
                .address("Dia chi moi")
                .thumbnailUrl("/images/new.png")
                .triggerRadiusMeters(70)
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        samplePoi.setPublishStatus(PublishStatus.PUBLISHED);
        samplePoi.setPublishAttempts(1);

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getLatitude()).isEqualTo(new BigDecimal("10.7812000"));
        assertThat(samplePoi.getAddress()).isEqualTo("Dia chi moi");
        assertThat(samplePoi.getPublishStatus()).isEqualTo(PublishStatus.PUBLISHED);
        assertThat(samplePoi.getPublishAttempts()).isEqualTo(1);
        assertThat(viTranslation.getAudioStatus()).isEqualTo("READY");

        verify(poiRepository).save(samplePoi);
        verify(translationRepository).save(viTranslation);
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("updatePoi: does not allow modifying code and qrToken")
    void testUpdatePoi_DoesNotChangeCodeAndQrToken() {
        UpdatePoiRequest request = baseUpdateRequest()
                .name("Ten moi")
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        poiContentService.updatePoi(100L, request);

        assertThat(samplePoi.getCode()).isEqualTo("POI_TEST_01");
        assertThat(samplePoi.getQrToken()).isEqualTo("qr-test-01");
        assertThat(samplePoi.getName()).isEqualTo("Ten moi");
    }

    @Test
    @DisplayName("updatePoi: POI created with error, admin updates only address -> keeps POI_CREATED event type, no event published")
    void testUpdatePoi_PoiCreatedWithError_OnlyAddressChanged_KeepsPoiCreatedEventType() {
        samplePoi.setPublishStatus(PublishStatus.PENDING);
        samplePoi.setPublishEventType(PublishEventType.POI_CREATED);
        samplePoi.setPublishAttempts(1);

        UpdatePoiRequest request = baseUpdateRequest()
                .address("Dia chi moi sau khi loi publish")
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getAddress()).isEqualTo("Dia chi moi sau khi loi publish");
        assertThat(samplePoi.getPublishEventType()).isEqualTo(PublishEventType.POI_CREATED);
        assertThat(samplePoi.getPublishStatus()).isEqualTo(PublishStatus.PENDING);
        assertThat(samplePoi.getPublishAttempts()).isEqualTo(1);
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("updatePoi: POI in PENDING status, content changed -> retains POI_CREATED event type and publishes poi.created")
    void testUpdatePoi_PoiCreatedWithPendingStatus_ContentChanged_KeepsPoiCreatedEventType() {
        samplePoi.setPublishStatus(PublishStatus.PENDING);
        samplePoi.setPublishEventType(PublishEventType.POI_CREATED);
        samplePoi.setPublishAttempts(1);

        UpdatePoiRequest request = baseUpdateRequest()
                .title("Tieu de moi khi van dang PENDING")
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        poiContentService.updatePoi(100L, request);

        assertThat(samplePoi.getPublishEventType()).isEqualTo(PublishEventType.POI_CREATED);
        assertThat(samplePoi.getPublishStatus()).isEqualTo(PublishStatus.PENDING);
        assertThat(samplePoi.getPublishAttempts()).isEqualTo(0);

        ArgumentCaptor<PoiPublishRequestedEvent> captor = ArgumentCaptor.forClass(PoiPublishRequestedEvent.class);
        verify(applicationEventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().routingKey()).isEqualTo("poi.created");
    }

    @Test
    @DisplayName("updatePoi: content changed -> other language translations set audioStatus to PENDING and preserve audioUrl/content")
    void testUpdatePoi_ContentChanged_OtherTranslationsSetPendingAndPreserveAudioUrl() {
        PoiTranslation enTranslation = PoiTranslation.builder()
                .id(201L)
                .poi(samplePoi)
                .languageCode("en")
                .title("Central Post Office")
                .summary("Summary EN")
                .description("Description EN")
                .audioUrl("http://localhost:8083/audio/en.mp3")
                .audioDurationSeconds(90)
                .audioStatus("READY")
                .build();

        PoiTranslation jaTranslation = PoiTranslation.builder()
                .id(202L)
                .poi(samplePoi)
                .languageCode("ja")
                .title("サイゴン中央郵便局")
                .summary("Summary JA")
                .description("Description JA")
                .audioUrl("http://localhost:8083/audio/ja.mp3")
                .audioDurationSeconds(95)
                .audioStatus("READY")
                .build();

        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));
        when(translationRepository.findByPoiId(100L)).thenReturn(List.of(viTranslation, enTranslation, jaTranslation));

        UpdatePoiRequest request = baseUpdateRequest()
                .title("Buu Dien Trung Tam Moi")
                .build();

        samplePoi.setPublishStatus(PublishStatus.PUBLISHED);

        poiContentService.updatePoi(100L, request);

        // vi audioStatus is PENDING
        assertThat(viTranslation.getAudioStatus()).isEqualTo("PENDING");

        // en and ja audioStatus set to PENDING
        assertThat(enTranslation.getAudioStatus()).isEqualTo("PENDING");
        assertThat(jaTranslation.getAudioStatus()).isEqualTo("PENDING");

        // title, summary, description, audioUrl are preserved
        assertThat(enTranslation.getTitle()).isEqualTo("Central Post Office");
        assertThat(enTranslation.getAudioUrl()).isEqualTo("http://localhost:8083/audio/en.mp3");
        assertThat(jaTranslation.getTitle()).isEqualTo("サイゴン中央郵便局");
        assertThat(jaTranslation.getAudioUrl()).isEqualTo("http://localhost:8083/audio/ja.mp3");

        verify(translationRepository).save(enTranslation);
        verify(translationRepository).save(jaTranslation);
    }

    @Test
    @DisplayName("updatePoi: version lệch -> ConflictException (409)")
    void testUpdatePoi_StaleVersion_ThrowsConflict() {
        samplePoi.setVersion(5L);
        UpdatePoiRequest request = baseUpdateRequest().version(0L).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));

        assertThatThrownBy(() -> poiContentService.updatePoi(100L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Nội dung đã được người khác cập nhật");

        verify(poiRepository, never()).save(any());
        verifyNoInteractions(applicationEventPublisher);
    }

    @Test
    @DisplayName("updatePoi: version khớp -> tăng version và trả về version mới")
    void testUpdatePoi_MatchingVersion_IncrementsVersion() {
        samplePoi.setVersion(3L);
        UpdatePoiRequest request = baseUpdateRequest().version(3L).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getVersion()).isEqualTo(4L);
        assertThat(samplePoi.getVersion()).isEqualTo(4L);
    }

    @Test
    @DisplayName("updatePoi: gán route + stopOrder hợp lệ -> cập nhật thành công")
    void testUpdatePoi_AssignsRouteAndStopOrder() {
        Route route = Route.builder().id(7L).zone(sampleZone).name("Tuyen").build();
        UpdatePoiRequest request = baseUpdateRequest().routeId(7L).stopOrder(2).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.existsByRouteIdAndStopOrder(7L, 2)).thenReturn(false);

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getRouteId()).isEqualTo(7L);
        assertThat(result.getStopOrder()).isEqualTo(2);
    }

    @Test
    @DisplayName("updatePoi: di chuyển POI sang tuyến khác -> tuyến cũ được đánh số lại (liên tục)")
    void testUpdatePoi_MovingPoiRenumbersOldRoute() {
        Route oldRoute = Route.builder().id(9L).zone(sampleZone).name("Tuyen cu").build();
        Route newRoute = Route.builder().id(7L).zone(sampleZone).name("Tuyen moi").build();
        samplePoi.setRoute(oldRoute);
        samplePoi.setStopOrder(3);
        UpdatePoiRequest request = baseUpdateRequest().routeId(7L).stopOrder(2).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));
        when(routeRepository.findById(7L)).thenReturn(Optional.of(newRoute));
        when(poiRepository.existsByRouteIdAndStopOrder(7L, 2)).thenReturn(false);

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getRouteId()).isEqualTo(7L);
        verify(routeStopsSynchronizer).renumberRoute(9L);
    }

    @Test
    @DisplayName("updatePoi: gỡ POI khỏi tuyến (routeId null) -> tuyến cũ được đánh số lại")
    void testUpdatePoi_RemovingPoiRenumbersOldRoute() {
        Route oldRoute = Route.builder().id(9L).zone(sampleZone).name("Tuyen cu").build();
        samplePoi.setRoute(oldRoute);
        samplePoi.setStopOrder(2);
        UpdatePoiRequest request = baseUpdateRequest().build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        AdminPoiDetailDto result = poiContentService.updatePoi(100L, request);

        assertThat(result.getRouteId()).isNull();
        assertThat(result.getStopOrder()).isNull();
        verify(routeStopsSynchronizer).renumberRoute(9L);
    }

    @Test
    @DisplayName("updatePoi: stopOrder trùng trong tuyến đích -> BadRequest")
    void testUpdatePoi_DuplicateStopOrder_Rejected() {
        Route route = Route.builder().id(7L).zone(sampleZone).name("Tuyen").build();
        UpdatePoiRequest request = baseUpdateRequest().routeId(7L).stopOrder(2).build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(routeRepository.findById(7L)).thenReturn(Optional.of(route));
        when(poiRepository.existsByRouteIdAndStopOrder(7L, 2)).thenReturn(true);

        assertThatThrownBy(() -> poiContentService.updatePoi(100L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already used");
    }

    @Test
    @DisplayName("getAdminPois: map dòng trang kèm audioStatus theo ngôn ngữ (không N+1)")
    void testGetAdminPois_MapsAudioStatuses() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central").audioStatus("READY").build();
        Pageable pageable = PageRequest.of(0, 20);
        Page<Poi> page = new PageImpl<>(List.of(samplePoi), pageable, 1);
        when(poiRepository.searchAdminPois(any(), any(), any(), any(), any(), any(), any(), any(),
                anyInt(), any(), eq(pageable))).thenReturn(page);
        when(translationRepository.findByPoiIdIn(List.of(100L))).thenReturn(List.of(viTranslation, en));

        Page<AdminPoiListItemDto> result =
                poiContentService.getAdminPois(null, null, null, null, null, null, null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        AdminPoiListItemDto row = result.getContent().get(0);
        assertThat(row.getId()).isEqualTo(100L);
        assertThat(row.getZoneCode()).isEqualTo("D1_HISTORIC");
        assertThat(row.getVersion()).isEqualTo(0L);
        assertThat(row.getAudioStatusByLanguage()).containsEntry("vi", "READY").containsEntry("en", "READY");
    }

    @Test
    @DisplayName("getAdminPois: search được trim + lower-case thành LIKE pattern")
    void testGetAdminPois_SearchPattern() {
        Pageable pageable = PageRequest.of(0, 20);
        when(poiRepository.searchAdminPois(eq(1L), any(), any(), eq("%buu dien%"), any(), any(), any(), any(),
                anyInt(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(samplePoi), pageable, 1));
        when(translationRepository.findByPoiIdIn(List.of(100L))).thenReturn(List.of());

        Page<AdminPoiListItemDto> result =
                poiContentService.getAdminPois(1L, null, null, "  Buu Dien  ", null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getAdminPois: overallStatus/languageStatus được chuẩn hóa hoa thường rồi chuyển xuống repository")
    void testGetAdminPois_NormalizesFilters() {
        Pageable pageable = PageRequest.of(0, 20);
        when(poiRepository.searchAdminPois(any(), any(), any(), any(), any(),
                eq("NEEDS_ATTENTION"), eq("ERROR"), eq(List.of("vi", "en", "ja", "ko")), eq(4),
                any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(samplePoi), pageable, 1));
        when(translationRepository.findByPoiIdIn(List.of(100L))).thenReturn(List.of());

        Page<AdminPoiListItemDto> result =
                poiContentService.getAdminPois(null, null, null, null, null,
                        " needs_attention ", " error ", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getAdminPois: overallStatus lạ -> BadRequest thay vì bỏ qua im lặng")
    void testGetAdminPois_InvalidOverallStatus() {
        Pageable pageable = PageRequest.of(0, 20);

        assertThatThrownBy(() -> poiContentService.getAdminPois(
                null, null, null, null, null, "PUBLISHED", null, pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("overallStatus");
    }

    @Test
    @DisplayName("getAdminPois: languageStatus lạ -> BadRequest")
    void testGetAdminPois_InvalidLanguageStatus() {
        Pageable pageable = PageRequest.of(0, 20);

        assertThatThrownBy(() -> poiContentService.getAdminPois(
                null, null, null, null, null, null, "FAILED", pageable))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("languageStatus");
    }

    @Test
    @DisplayName("getAdminPois: blank filter -> truyền null xuống repository")
    void testGetAdminPois_BlankFiltersBecomeNull() {
        Pageable pageable = PageRequest.of(0, 20);
        when(poiRepository.searchAdminPois(any(), any(), any(), any(), any(), isNull(), isNull(), any(),
                anyInt(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(samplePoi), pageable, 1));
        when(translationRepository.findByPoiIdIn(List.of(100L))).thenReturn(List.of());

        Page<AdminPoiListItemDto> result =
                poiContentService.getAdminPois(null, null, null, null, null, "  ", "  ", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getAdminPoiDetail: trả toàn bộ bản dịch theo ngôn ngữ trong 1 response")
    void testGetAdminPoiDetail_AllTranslations() {
        PoiTranslation en = PoiTranslation.builder().poi(samplePoi).languageCode("en")
                .title("Central").audioStatus("READY").build();
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiId(100L)).thenReturn(List.of(viTranslation, en));

        AdminPoiDetailDto detail = poiContentService.getAdminPoiDetail(100L);

        assertThat(detail.getCategoryId()).isEqualTo(1L);
        assertThat(detail.getVersion()).isEqualTo(0L);
        assertThat(detail.getTranslations()).containsKeys("vi", "en");
        assertThat(detail.getTranslations().get("en").getTitle()).isEqualTo("Central");
    }

    @Test
    @DisplayName("getAdminPoiDetail: ném ResourceNotFoundException khi không tồn tại")
    void testGetAdminPoiDetail_NotFound() {
        when(poiRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.getAdminPoiDetail(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getInternalPoiByQrToken: returns minimal POI internal info with vi title")
    void testGetInternalPoiByQrToken_Success() {
        when(poiRepository.findByQrToken("qr-buu-dien-01")).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        PoiInternalQrDto result = poiContentService.getInternalPoiByQrToken("qr-buu-dien-01");

        assertThat(result.getPoiId()).isEqualTo(100L);
        assertThat(result.getPoiCode()).isEqualTo("POI_TEST_01");
        assertThat(result.getZoneId()).isEqualTo(1L);
        assertThat(result.getLatitude()).isEqualTo(new BigDecimal("10.7799000"));
        assertThat(result.getLongitude()).isEqualTo(new BigDecimal("106.7001000"));
        assertThat(result.getTriggerRadiusMeters()).isEqualTo(50);
        assertThat(result.getTitle()).isEqualTo("Buu Dien Trung Tam");
    }

    @Test
    @DisplayName("getInternalPoiByQrToken: throws ResourceNotFoundException when token not found")
    void testGetInternalPoiByQrToken_NotFound() {
        when(poiRepository.findByQrToken("unknown-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.getInternalPoiByQrToken("unknown-token"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("POI not found with QR token: unknown-token");
    }

    @Test
    @DisplayName("getPublishStatuses: queries by status using findByPublishStatus and never calls findAll")
    void getPublishStatusesQueriesByStatusInsteadOfFindAll() {
        when(poiRepository.findByPublishStatus(PublishStatus.FAILED)).thenReturn(List.of(samplePoi));

        List<PoiPublishStatusDto> result = poiContentService.getPublishStatuses("FAILED");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPoiId()).isEqualTo(100L);
        verify(poiRepository).findByPublishStatus(PublishStatus.FAILED);
        verify(poiRepository, never()).findAll();
    }

    @Test
    @DisplayName("changeStatus: hides an ACTIVE POI, bumps version and persists it")
    void testChangeStatus_HidesPoi() {
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(poiRepository.save(any(Poi.class))).thenAnswer(inv -> inv.getArgument(0));
        when(translationRepository.findByPoiId(100L)).thenReturn(List.of(viTranslation));

        AdminPoiDetailDto result = poiContentService.changeStatus(100L, "inactive");

        assertThat(result.getStatus()).isEqualTo("INACTIVE");
        assertThat(samplePoi.getStatus()).isEqualTo("INACTIVE");
        assertThat(samplePoi.getVersion()).isEqualTo(1L);
        verify(poiRepository).save(samplePoi);
    }

    @Test
    @DisplayName("changeStatus: rejects an unknown status before touching the database")
    void testChangeStatus_RejectsUnknownStatus() {
        assertThatThrownBy(() -> poiContentService.changeStatus(100L, "DELETED"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ACTIVE");

        verifyNoInteractions(poiRepository);
    }

    @Test
    @DisplayName("changeStatus: unknown POI -> ResourceNotFoundException")
    void testChangeStatus_NotFound() {
        when(poiRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> poiContentService.changeStatus(404L, "ACTIVE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("404");
    }
}
