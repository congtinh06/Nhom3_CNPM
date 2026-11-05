package com.echora.content.service;

import com.echora.content.dto.AdminAudioStatusDto;
import com.echora.content.dto.AudioRegenerationResultDto;
import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.exception.BadRequestException;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiAudioAdminServiceTest {

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
    @Mock private TransactionTemplate transactionTemplate;

    private PoiContentServiceImpl service;
    private Poi poi;
    private PoiTranslation vi;
    private PoiTranslation en;
    private PoiTranslation ja;

    @BeforeEach
    void setUp() {
        service = new PoiContentServiceImpl(
                poiRepository,
                translationRepository,
                chapterRepository,
                chapterTranslationRepository,
                zoneRepository,
                categoryRepository,
                routeRepository,
                applicationEventPublisher,
                poiPublishService,
                routeStopsSynchronizer,
                transactionTemplate);

        poi = Poi.builder()
                .id(1L)
                .code("POI_1")
                .name("Dinh Độc Lập")
                .status("ACTIVE")
                .publishStatus("PUBLISHED")
                .build();

        vi = PoiTranslation.builder()
                .id(11L).poi(poi).languageCode("vi")
                .title("Dinh Độc Lập").summary("Tóm tắt").description("Mô tả")
                .audioStatus("READY").audioUrl("/audio/vi.mp3").audioDurationSeconds(30)
                .build();
        en = PoiTranslation.builder()
                .id(12L).poi(poi).languageCode("en")
                .title("Independence Palace").summary("Summary").description("Description")
                .audioStatus("FAILED_TTS").audioErrorReason("Edge TTS timeout")
                .audioUrl(null).audioDurationSeconds(0)
                .build();
        ja = PoiTranslation.builder()
                .id(13L).poi(poi).languageCode("ja")
                .title("統一会堂").summary("概要").description("説明")
                .audioStatus("PENDING")
                .build();

    }

    private void stubTransactionTemplate() {
        doAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Consumer<org.springframework.transaction.TransactionStatus> action = invocation.getArgument(0);
            action.accept(null);
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    @Test
    @DisplayName("getAudioStatus: tổng hợp READY/PENDING/FAILED và đánh dấu POI chưa đủ 4 ngôn ngữ")
    void testGetAudioStatus_aggregatesAllLanguages() {
        when(poiRepository.findAll(any(Sort.class))).thenReturn(List.of(poi));
        when(translationRepository.findByPoiIdIn(any())).thenReturn(List.of(vi, en, ja));

        AdminAudioStatusDto status = service.getAudioStatus();

        assertThat(status.getTotalPois()).isEqualTo(1);
        assertThat(status.getReadyLanguages()).isEqualTo(1);
        assertThat(status.getFailedLanguages()).isEqualTo(1);
        assertThat(status.getPendingLanguages()).isEqualTo(2); // ja + ko còn thiếu
        assertThat(status.isAllReady()).isFalse();
        assertThat(status.getPois()).hasSize(1);
        assertThat(status.getPois().get(0).isAllReady()).isFalse();
        assertThat(status.getPois().get(0).getLanguages())
                .extracting("languageCode", "audioStatus")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("vi", "READY"),
                        org.assertj.core.groups.Tuple.tuple("en", "FAILED_TTS"),
                        org.assertj.core.groups.Tuple.tuple("ja", "PENDING"),
                        org.assertj.core.groups.Tuple.tuple("ko", "PENDING"));
    }

    @Test
    @DisplayName("regenerateAudio: chỉ định en -> reset PENDING và gửi event force đúng ngôn ngữ")
    void testRegenerateAudio_explicitLanguage_resetsAndPublishesForce() {
        stubTransactionTemplate();
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));
        when(translationRepository.findByPoiId(1L)).thenReturn(List.of(vi, en, ja));
        when(poiPublishService.republish(1L, true, List.of("en"))).thenReturn("PUBLISHED");

        AudioRegenerationResultDto result = service.regenerateAudio(1L, List.of("en"));

        assertThat(result.getRequestedLanguages()).isEqualTo(1);
        assertThat(result.getLanguages()).containsExactly("en");
        assertThat(result.getPublishStatus()).isEqualTo("PUBLISHED");

        ArgumentCaptor<PoiTranslation> captor = ArgumentCaptor.forClass(PoiTranslation.class);
        verify(translationRepository).save(captor.capture());
        PoiTranslation saved = captor.getValue();
        assertThat(saved.getLanguageCode()).isEqualTo("en");
        assertThat(saved.getAudioStatus()).isEqualTo("PENDING");
        assertThat(saved.getAudioErrorReason()).isNull();
        assertThat(saved.getAudioUrl()).isNull();
        assertThat(saved.getAudioDurationSeconds()).isZero();
        // vi READY không bị đụng tới
        assertThat(vi.getAudioStatus()).isEqualTo("READY");
    }

    @Test
    @DisplayName("regenerateAudio: không truyền ngôn ngữ -> chọn các ngôn ngữ chưa READY")
    void testRegenerateAudio_withoutLanguages_selectsNonReady() {
        stubTransactionTemplate();
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));
        when(translationRepository.findByPoiId(1L)).thenReturn(List.of(vi, en, ja));
        when(poiPublishService.republish(eq(1L), eq(true), any())).thenReturn("PUBLISHED");

        AudioRegenerationResultDto result = service.regenerateAudio(1L, null);

        assertThat(result.getLanguages()).containsExactly("en", "ja", "ko");
        verify(poiPublishService).republish(1L, true, List.of("en", "ja", "ko"));
    }

    @Test
    @DisplayName("regenerateAudio: ngôn ngữ lạ bị từ chối trước khi publish")
    void testRegenerateAudio_invalidLanguage_rejected() {
        when(poiRepository.findById(1L)).thenReturn(Optional.of(poi));
        when(translationRepository.findByPoiId(1L)).thenReturn(List.of(vi));

        assertThatThrownBy(() -> service.regenerateAudio(1L, List.of("fr")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fr");

        verifyNoInteractions(poiPublishService);
    }
}
