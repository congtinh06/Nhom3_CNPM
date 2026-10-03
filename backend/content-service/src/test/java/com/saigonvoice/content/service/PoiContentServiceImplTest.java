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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiContentServiceImplTest {

    @Mock
    private PoiRepository poiRepository;

    @Mock
    private PoiTranslationRepository translationRepository;

    @Mock
    private ZoneRepository zoneRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private PoiEventPublisher poiEventPublisher;

    @InjectMocks
    private PoiContentServiceImpl poiContentService;

    private Zone sampleZone;
    private Category sampleCategory;
    private Poi samplePoi;
    private PoiTranslation viTranslation;

    @BeforeEach
    void setUp() {
        sampleZone = Zone.builder()
                .id(1L)
                .code("D1_HISTORIC")
                .name("Trung tam Quan 1")
                .centerLat(new BigDecimal("10.7769000"))
                .centerLng(new BigDecimal("10.7009000"))
                .radiusMeters(600)
                .isActive(true)
                .build();

        sampleCategory = Category.builder()
                .id(1L)
                .code("ARCHITECTURE")
                .nameVi("Kien truc")
                .nameEn("Architecture")
                .build();

        samplePoi = Poi.builder()
                .id(100L)
                .zone(sampleZone)
                .category(sampleCategory)
                .code("POI_TEST_01")
                .qrToken("qr-test-01")
                .name("Buu Dien Trung Tam")
                .latitude(new BigDecimal("10.7799000"))
                .longitude(new BigDecimal("10.7001000"))
                .triggerRadiusMeters(50)
                .status("ACTIVE")
                .build();

        viTranslation = PoiTranslation.builder()
                .id(200L)
                .poi(samplePoi)
                .languageCode("vi")
                .title("Buu Dien Trung Tam")
                .summary("Tom tat ve Buu Dien")
                .description("Mo ta chi tiet")
                .historicalSignificance("Gia tri lich su")
                .audioStatus("READY")
                .audioUrl("http://localhost:8085/audio/test_vi.mp3")
                .audioDurationSeconds(120)
                .build();
    }

    @Test
    @DisplayName("getPois: return active POI summaries for zone")
    void testGetPois() {
        when(poiRepository.findByZoneIdAndStatus(1L, "ACTIVE")).thenReturn(List.of(samplePoi));

        List<PoiSummaryDto> results = poiContentService.getPois(1L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("POI_TEST_01");
        assertThat(results.get(0).getZoneCode()).isEqualTo("D1_HISTORIC");
        assertThat(results.get(0).getCategoryCode()).isEqualTo("ARCHITECTURE");
    }

    @Test
    @DisplayName("getPoiDetail: returns Vietnamese translation when requested")
    void testGetPoiDetail_Vi() {
        when(poiRepository.findById(100L)).thenReturn(Optional.of(samplePoi));
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi")).thenReturn(Optional.of(viTranslation));

        PoiDetailDto detail = poiContentService.getPoiDetail(100L, "vi");

        assertThat(detail).isNotNull();
        assertThat(detail.getId()).isEqualTo(100L);
        assertThat(detail.getLanguageCode()).isEqualTo("vi");
        assertThat(detail.getTitle()).isEqualTo("Buu Dien Trung Tam");
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

        assertThat(detail).isNotNull();
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
    void testGetPisInBoundingBox() {
        BigDecimal minLat = new BigDecimal("10.7700000");
        BigDecimal maxLat = new BigDecimal("10.7800000");
        BigDecimal minLng = new BigDecimal("10.6900000");
        BigDecimal maxLng = new BigDecimal("10.7100000");

        when(poiRepository.findInBoundingBox(1L, minLat, maxLat, minLng, maxLng))
                .thenReturn(List.of(samplePoi));

        List<PoiBoundingBoxDto> results = poiContentService.getPoisInBoundingBox(1L, minLat, maxLat, minLng, maxLng);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCode()).isEqualTo("POI_TEST_01");
        assertThat(results.get(0).getZoneId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("createPoi: creates POI, VI translation, and publishes event")
    void testCreatePoi_Success() {
        CreatePoiRequest request = CreatePoiRequest.builder()
                .zoneId(1L)
                .categoryId(1L)
                .code("POI_NEW_01")
                .qrToken("qr-new-01")
                .name("Diem moi")
                .latitude(new BigDecimal("10.7750000"))
                .longitude(new BigDecimal("10.7050000"))
                .triggerRadiusMeters(50)
                .title("Tieu de tieng Viet")
                .summary("Tom tat")
                .description("Mo ta day du")
                .build();

        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode("POI_NEW_01")).thenReturn(Optional.empty());
        when(poiRepository.findByQrToken("qr-new-01")).thenReturn(Optional.empty());

        Poi savedPoi = Poi.builder()
                .id(105L)
                .zone(sampleZone)
                .category(sampleCategory)
                .code(request.getCode())
                .qrToken(request.getQrToken())
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .triggerRadiusMeters(50)
                .status("ACTIVE")
                .build();

        when(poiRepository.save(any(Poi.class))).thenReturn(savedPoi);
        when(translationRepository.save(any(PoiTranslation.class))).thenAnswer(inv -> inv.getArgument(0));

        PoiDetailDto result = poiContentService.createPoi(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(105L);
        assertThat(result.getCode()).isEqualTo("POI_NEW_01");
        verify(poiEventPublisher, times(1)).publishPoiCreated(any(PoiCreatedEvent.class));
    }

    @Test
    @DisplayName("createPoi: throws BadRequestException if code already exists")
    void testCreatePoi_DuplicateCode() {
        CreatePoiRequest request = CreatePoiRequest.builder()
                .zoneId(1L)
                .categoryId(1L)
                .code("POI_TEST_01")
                .qrToken("qr-new-02")
                .name("Diem moi")
                .latitude(new BigDecimal("10.7750000"))
                .longitude(new BigDecimal("10.7050000"))
                .title("Tieu de")
                .summary("Tom tat")
                .description("Mo ta")
                .build();

        when(zoneRepository.findById(1L)).thenReturn(Optional.of(sampleZone));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(poiRepository.findByCode("POI_TEST_01")).thenReturn(Optional.of(samplePoi));

        assertThatThrownBy(() -> poiContentService.createPoi(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("POI code already exists");

        verify(poiRepository, never()).save(any());
        verify(poiEventPublisher, never()).publishPoiCreated(any());
    }
}
