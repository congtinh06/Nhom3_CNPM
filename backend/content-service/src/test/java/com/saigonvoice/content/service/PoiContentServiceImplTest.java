package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.CreatePoiRequest;
import com.saigonvoice.content.dto.PoiBoundingBoxDto;
import com.saigonvoice.content.dto.PoiDetailDto;
import com.saigonvoice.content.dto.PoiSummaryDto;
import com.saigonvoice.content.entity.Category;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiContentServiceImplTest {

    @Mock private PoiRepository poiRepository;
    @Mock private PoiTranslationRepository translationRepository;
    @Mock private ZoneRepository zoneRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private RouteRepository routeRepository;
    @Mock private ApplicationEventPublisher applicationEventPublisher;
    @Mock private PoiPublishService poiPublishService;

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
}
