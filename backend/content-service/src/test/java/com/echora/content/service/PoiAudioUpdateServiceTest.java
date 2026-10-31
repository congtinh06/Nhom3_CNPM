package com.echora.content.service;

import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.event.PoiAudioFailedEvent;
import com.echora.content.event.PoiAudioProgressEvent;
import com.echora.content.event.PoiAudioReadyEvent;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.PoiTranslationRepository;
import com.echora.content.util.ContentHashUtils;
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
    @DisplayName("applyAudioGenerating: hash khớp -> chuyển GENERATING, xóa audio cũ")
    void testApplyAudioGenerating_matchingHash_setsGenerating() {
        String currentHash = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V2", "Tóm tắt V2", "Mô tả V2", "Ý nghĩa V2");
        PoiTranslation existing = PoiTranslation.builder()
                .id(20L).poi(poi).languageCode("en")
                .title("Old").summary("Old").description("Old")
                .audioStatus("FAILED_TTS").audioUrl("/old.mp3").audioDurationSeconds(10)
                .audioErrorReason("old error")
                .build();
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en"))
                .thenReturn(Optional.of(existing));

        poiAudioUpdateService.applyAudioGenerating(PoiAudioProgressEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("GENERATING")
                .contentHash(currentHash)
                .build());

        ArgumentCaptor<PoiTranslation> captor = ArgumentCaptor.forClass(PoiTranslation.class);
        verify(translationRepository).save(captor.capture());
        PoiTranslation saved = captor.getValue();
        assertThat(saved.getAudioStatus()).isEqualTo("GENERATING");
        assertThat(saved.getAudioUrl()).isNull();
        assertThat(saved.getAudioDurationSeconds()).isZero();
        assertThat(saved.getAudioErrorReason()).isNull();
        assertThat(saved.getAudioLastAttemptAt()).isNotNull();
    }

    @Test
    @DisplayName("applyAudioGenerating: hash cũ -> bỏ qua, không hạ cấp bản mới")
    void testApplyAudioGenerating_staleHash_isIgnored() {
        String staleHash = ContentHashUtils.computeHash(
                "en", "Tiêu đề V1", "Tóm tắt V1", "Mô tả V1", "Ý nghĩa V1");

        poiAudioUpdateService.applyAudioGenerating(PoiAudioProgressEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("GENERATING")
                .contentHash(staleHash)
                .build());

        verify(translationRepository, never()).save(any());
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

    @Test
    @DisplayName("applyAudioFailed: failed có text, hash khớp -> FAILED_TTS như hiện tại")
    void testApplyAudioFailed_MatchingContentHash_SavesFailedTts() {
        String currentHashV2 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V2", "Tóm tắt V2", "Mô tả V2", "Ý nghĩa V2");

        PoiAudioFailedEvent event = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS error")
                .title("Title V2 EN")
                .summary("Summary V2 EN")
                .description("Description V2 EN")
                .contentHash(currentHashV2)
                .build();

        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en"))
                .thenReturn(Optional.empty());

        poiAudioUpdateService.applyAudioFailed(event);

        ArgumentCaptor<PoiTranslation> captor = ArgumentCaptor.forClass(PoiTranslation.class);
        verify(translationRepository).save(captor.capture());
        PoiTranslation saved = captor.getValue();

        assertThat(saved.getLanguageCode()).isEqualTo("en");
        assertThat(saved.getTitle()).isEqualTo("Title V2 EN");
        assertThat(saved.getAudioStatus()).isEqualTo("FAILED_TTS");
        assertThat(saved.getAudioUrl()).isNull();
        assertThat(saved.getContentHash()).isEqualTo(currentHashV2);
    }

    @Test
    @DisplayName("applyAudioFailed: failed không text trên bản PENDING có text cũ -> status FAILED, không phải FAILED_TTS, giữ nguyên text")
    void testApplyAudioFailed_NoTextOnPendingWithOldText_SetsStatusFailed() {
        String currentHashV2 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V2", "Tóm tắt V2", "Mô tả V2", "Ý nghĩa V2");

        // Bản dịch en đã tồn tại (đang PENDING từ đợt update trước, có text cũ)
        PoiTranslation existingPending = PoiTranslation.builder()
                .id(20L)
                .poi(poi)
                .languageCode("en")
                .title("Old Title EN")
                .summary("Old Summary EN")
                .description("Old Desc EN")
                .historicalSignificance("Old Hist EN")
                .audioStatus("PENDING")
                .build();

        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en"))
                .thenReturn(Optional.of(existingPending));

        // Event failed KHÔNG có text (hasText = false)
        PoiAudioFailedEvent eventNoText = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS timeout")
                .contentHash(currentHashV2)
                .build();

        poiAudioUpdateService.applyAudioFailed(eventNoText);

        ArgumentCaptor<PoiTranslation> captor = ArgumentCaptor.forClass(PoiTranslation.class);
        verify(translationRepository).save(captor.capture());
        PoiTranslation saved = captor.getValue();

        assertThat(saved.getAudioStatus()).isEqualTo("FAILED");
        assertThat(saved.getAudioUrl()).isNull();
        assertThat(saved.getContentHash()).isEqualTo(currentHashV2);
        // Text cũ được giữ nguyên
        assertThat(saved.getTitle()).isEqualTo("Old Title EN");
        assertThat(saved.getSummary()).isEqualTo("Old Summary EN");
    }

    @Test
    @DisplayName("applyAudioFailed: failed đến sau khi bản dịch đã READY cùng hash -> bỏ qua, không gọi save")
    void testApplyAudioFailed_ArrivesAfterReadyWithSameHash_IsIgnored() {
        String currentHashV2 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V2", "Tóm tắt V2", "Mô tả V2", "Ý nghĩa V2");

        // Bản dịch en đã READY với cùng hash
        PoiTranslation existingReady = PoiTranslation.builder()
                .id(20L)
                .poi(poi)
                .languageCode("en")
                .title("Title V2 EN")
                .audioUrl("http://audio.mp3")
                .audioStatus("READY")
                .contentHash(currentHashV2)
                .build();

        when(translationRepository.findByPoiIdAndLanguageCode(100L, "en"))
                .thenReturn(Optional.of(existingReady));

        PoiAudioFailedEvent lateEvent = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS timeout")
                .contentHash(currentHashV2)
                .build();

        poiAudioUpdateService.applyAudioFailed(lateEvent);

        verify(translationRepository, never()).save(any());
    }

    @Test
    @DisplayName("applyAudioFailed: event của phiên bản cũ (stale hash) gửi đến sau khi đã cập nhật -> bị bỏ qua")
    void testApplyAudioFailed_StaleEventFromPreviousVersion_IsIgnored() {
        String staleHashV1 = ContentHashUtils.computeHash(
                "en", "Tiêu đề tiếng Việt V1", "Tóm tắt V1", "Mô tả V1", "Ý nghĩa V1");

        PoiAudioFailedEvent staleEvent = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS error")
                .contentHash(staleHashV1)
                .build();

        poiAudioUpdateService.applyAudioFailed(staleEvent);

        verify(translationRepository, never()).save(any());
    }

    @Test
    @DisplayName("applyAudioFailed: thiếu contentHash (null hoặc rỗng) -> ném AmqpRejectAndDontRequeueException vào DLQ ngay")
    void testApplyAudioFailed_MissingContentHash_RejectsToDlq() {
        PoiAudioFailedEvent nullHashEvent = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS error")
                .contentHash(null)
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioFailed(nullHashEvent))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("missing [contentHash]");

        PoiAudioFailedEvent emptyHashEvent = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS error")
                .contentHash("   ")
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioFailed(emptyHashEvent))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("missing [contentHash]");
    }

    @Test
    @DisplayName("applyAudioFailed: không có bản dịch vi để đối chiếu hash -> ghi log WARN và ném AmqpRejectAndDontRequeueException vào DLQ")
    void testApplyAudioFailed_MissingViTranslation_LogsWarnAndRejectsToDlq() {
        when(translationRepository.findByPoiIdAndLanguageCode(100L, "vi"))
                .thenReturn(Optional.empty());

        PoiAudioFailedEvent event = PoiAudioFailedEvent.builder()
                .poiId(100L)
                .languageCode("en")
                .audioStatus("FAILED_TTS")
                .errorMessage("Edge TTS error")
                .contentHash("somehash")
                .build();

        assertThatThrownBy(() -> poiAudioUpdateService.applyAudioFailed(event))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class)
                .hasMessageContaining("Missing source 'vi' translation");

        verify(translationRepository, never()).save(any());
    }
}
