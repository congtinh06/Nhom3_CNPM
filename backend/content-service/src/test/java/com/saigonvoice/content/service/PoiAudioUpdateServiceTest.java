package com.saigonvoice.content.service;

import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.event.PoiAudioReadyEvent;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import com.saigonvoice.content.util.ContentHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.amqp.AmqpRejectAndDontRequeueException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PoiAudioUpdateServiceTest {

    @Mock private PoiRepository poiRepository;
    @Mock private PoiTranslationRepository translationRepository;

    @InjectMocks
    private PoiAudioUpdateService poiAudioUpdateService;

    private Poi poi;
    private PoiTranslation viTranslationV2;

    @BeforeEach
    void setUp() {
        poi = Poi.builder().id(100L).code("POI_TEST").name("Điểm Test").build();
        lenient().when(poiRepository.findById(100L)).thenReturn(Optional.of(poi));

        // DB hiện tại đang lưu bản tiếng Việt phiên bản 2 (sau khi sửa lần 2)
        viTranslationV2 = PoiTranslation.builder()
                .id(1L)
                .poi(poi)
                .languageCode("vi")
                .title("Tiêu đề tiếng Việt V2")
                .summary("Tóm tắt V2")
                .description("Mô tả V2")
                .historicalSignificance("Ý nghĩa V2")
                .audioStatus("PENDING")
                .build();

        lenient().when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi"))
                .thenReturn(Optional.of(viTranslationV2));
    }

    @Test
    @DisplayName("applyAudioReady: sửa nội dung 2 lần liên tiếp, event của lần 1 có contentHash cũ đến sau thì bị bỏ qua")
    void testApplyAudioReady_StaleEventFromPreviousVersion_IsIgnored() {
        // Hash của phiên bản 1 cũ
        String staleHashV1 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V1", "Tóm tắt V1", "Mô tả V1", "Ý nghĩa V1");

        PoiAudioReadyEvent staleEvent = PoiAudioReadyEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .title("Title V1 EN")
                .summary("Summary V1 EN")
                .description("Description V1 EN")
                .audioUrl("http://localhost:8083/audio/en_v1.mp3")
                .audioDurationSeconds(60)
                .audioStatus("READY")
                .contentHash(staleHashV1)
                .build();

        // Thực thi: service nhận event lần 1 khi DB đã sang phiên bản 2
        poiAudioUpdateService.applyAudioReady(staleEvent);

        // Không ghi đè bản dịch và không ném lỗi
        verify(translationRepository, never()).save(any());
    }

    @Test
    @DisplayName("applyAudioReady: contentHash khớp với phiên bản tiếng Việt hiện tại -> lưu bản dịch READY thành công")
    void testApplyAudioReady_MatchingContentHash_SavesTranslation() {
        // Hash khớp với phiên bản 2 hiện tại trong DB
        String currentHashV2 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V2", "Tóm tắt V2", "Mô tả V2", "Ý nghĩa V2");

        PoiAudioReadyEvent freshEvent = PoiAudioReadyEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .title("Title V2 EN")
                .summary("Summary V2 EN")
                .description("Description V2 EN")
                .audioUrl("http://localhost:8083/audio/en_v2.mp3")
                .audioDurationSeconds(80)
                .audioStatus("READY")
                .contentHash(currentHashV2)
                .build();

        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en"))
                .thenReturn(Optional.empty());

        poiAudioUpdateService.applyAudioReady(freshEvent);

        ArgumentCaptor<PoiTranslation> captor = ArgumentCaptor.forClass(PoiTranslation.class);
        verify(translationRepository).save(captor.capture());
        PoiTranslation saved = captor.getValue();

        assertThat(saved.getLanguageCode()).isEqualTo("en");
        assertThat(saved.getTitle()).isEqualTo("Title V2 EN");
        assertThat(saved.getAudioStatus()).isEqualTo("READY");
        assertThat(saved.getAudioUrl()).isEqualTo("http://localhost:8083/audio/en_v2.mp3");
        assertThat(saved.getContentHash()).isEqualTo(currentHashV2);
    }

    @Test
    @DisplayName("applyAudioReady: thiếu contentHash (null hoặc rỗng) -> ném AmqpRejectAndDontRequeueException vào DLQ ngay")
    void testApplyAudioReady_MissingContentHash_RejectsToDlq() {
        PoiAudioReadyEvent nullHashEvent = PoiAudioReadyEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .title("Title")
                .summary("Summary")
                .description("Desc")
                .audioUrl("http://localhost:8083/audio/en.mp3")
                .contentHash(null)
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioReady(nullHashEvent))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("missing [contentHash]");

        PoiAudioReadyEvent emptyHashEvent = PoiAudioReadyEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .title("Title")
                .summary("Summary")
                .description("Desc")
                .audioUrl("http://localhost:8083/audio/en.mp3")
                .contentHash("   ")
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioReady(emptyHashEvent))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("missing [contentHash]");
    }

    @Test
    @DisplayName("applyAudioReady: không có bản dịch vi để đối chiếu hash -> ghi log WARN và ném AmqpRejectAndDontRequeueException vào DLQ")
    void testApplyAudioReady_MissingViTranslation_LogsWarnAndRejectsToDlq() {
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi"))
                .thenReturn(Optional.empty());

        PoiAudioReadyEvent event = PoiAudioReadyEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .title("Title")
                .summary("Summary")
                .description("Desc")
                .audioUrl("http://localhost:8083/audio/en.mp3")
                .contentHash("somehash")
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioReady(event))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("Missing source 'vi' translation");

        verify(translationRepository, never()).save(any());
    }
}
