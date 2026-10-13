package com.saigonvoice.translation.service;

import com.saigonvoice.translation.entity.TranslationJob;
import com.saigonvoice.translation.event.AuthoredPoiText;
import com.saigonvoice.translation.event.PoiAudioFailedEvent;
import com.saigonvoice.translation.event.PoiAudioReadyEvent;
import com.saigonvoice.translation.event.PoiEventPayload;
import com.saigonvoice.translation.exception.TranslationQuotaExceededException;
import com.saigonvoice.translation.exception.TtsExecutionException;
import com.saigonvoice.translation.exception.TtsUnsupportedVoiceException;
import com.saigonvoice.translation.messaging.PoiAudioEventPublisher;
import com.saigonvoice.translation.provider.TranslatedPoiContent;
import com.saigonvoice.translation.repository.TranslationJobRepository;
import com.saigonvoice.translation.tts.TtsVoiceProvider;
import com.saigonvoice.translation.util.ContentHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PoiPipelineServiceTest {

    private TranslationCacheService translationCacheService;
    private AudioStorageService audioStorageService;
    private TtsVoiceProvider ttsVoiceProvider;
    private TranslationJobRepository translationJobRepository;
    private PoiAudioEventPublisher eventPublisher;
    private PoiPipelineServiceImpl pipelineService;

    private Map<String, TranslationJob> jobStore;

    @BeforeEach
    void setUp() {
        translationCacheService = mock(TranslationCacheService.class);
        audioStorageService = mock(AudioStorageService.class);
        ttsVoiceProvider = mock(TtsVoiceProvider.class);
        translationJobRepository = mock(TranslationJobRepository.class);
        eventPublisher = mock(PoiAudioEventPublisher.class);

        jobStore = new HashMap<>();

        // In-memory mock for translationJobRepository
        when(translationJobRepository.findByPoiIdAndLanguageCodeAndContentHash(anyLong(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    long poiId = inv.getArgument(0);
                    String lang = inv.getArgument(1);
                    String hash = inv.getArgument(2);
                    String key = poiId + "_" + lang + "_" + hash;
                    return Optional.ofNullable(jobStore.get(key));
                });

        when(translationJobRepository.save(any(TranslationJob.class)))
                .thenAnswer(inv -> {
                    TranslationJob job = inv.getArgument(0);
                    String key = job.getPoiId() + "_" + job.getLanguageCode() + "_" + job.getContentHash();
                    jobStore.put(key, job);
                    return job;
                });

        // Default voice provider: supports vi, en, ja, ko
        when(ttsVoiceProvider.getVoice(anyString())).thenAnswer(inv -> {
            String lang = inv.getArgument(0);
            return switch (lang) {
                case "vi" -> "vi-VN-HoaiMyNeural";
                case "en" -> "en-US-AvaNeural";
                case "ja" -> "ja-JP-NanamiNeural";
                case "ko" -> "ko-KR-SunHiNeural";
                default -> throw new TtsUnsupportedVoiceException("Unsupported: " + lang);
            };
        });

        // Default audio storage returns dummy result
        when(audioStorageService.storeAudio(anyLong(), anyString(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    long poiId = inv.getArgument(0);
                    String lang = inv.getArgument(1);
                    String hash = inv.getArgument(2);
                    String hash8 = hash.substring(0, 8);
                    String fileName = "poi_" + poiId + "_" + lang + "_" + hash8 + ".mp3";
                    return new AudioStorageResult(fileName, "/api/tts/audio/" + fileName, Path.of(fileName), 15, true);
                });

        pipelineService = new PoiPipelineServiceImpl(
                translationCacheService,
                audioStorageService,
                ttsVoiceProvider,
                translationJobRepository,
                eventPublisher
        );
    }

    @Test
    @DisplayName("Happy path: vi+en+ja+ko translates 3 times, never for vi, preserves vi verbatim, publishes 4 ready events")
    void testHappyPath_vi_en_ja_ko() {
        String viTitle = "  Dinh  Độc  Lập  ";
        String viSummary = "Di tích  lịch sử\r\nquốc gia";
        String viDesc = "Tọa lạc tại   Quận 1, TP.HCM.\r\nĐịa chỉ  cụ thể.";
        String viHist = "Ý nghĩa  lịch sử sâu sắc.";

        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(101L)
                .poiCode("POI_01")
                .zoneId(1L)
                .sourceLanguage("vi")
                .title(viTitle)
                .summary(viSummary)
                .description(viDesc)
                .historicalSignificance(viHist)
                .targetLanguages(List.of("en", "ja", "ko"))
                .build();

        // Stub translation
        when(translationCacheService.getOrTranslate(eq("en"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("Independence Palace", "Historical site", "Located in District 1", "History"));
        when(translationCacheService.getOrTranslate(eq("ja"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("統一会堂", "歴史的遺跡", "1区に位置する", "歴史的意義"));
        when(translationCacheService.getOrTranslate(eq("ko"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("통일궁", "역사 유적지", "1군에 위치", "역사적 의미"));

        pipelineService.processPoiEvent(event);

        // Verify translation called 3 times, NEVER for vi
        verify(translationCacheService, times(3)).getOrTranslate(anyString(), any(), any(), any(), any());
        verify(translationCacheService, never()).getOrTranslate(eq("vi"), any(), any(), any(), any());

        // Verify audio storage called 4 times
        verify(audioStorageService, times(4)).storeAudio(eq(101L), anyString(), anyString(), anyString());

        // Capture published ready events
        ArgumentCaptor<PoiAudioReadyEvent> readyCaptor = ArgumentCaptor.forClass(PoiAudioReadyEvent.class);
        verify(eventPublisher, times(4)).publishAudioReady(readyCaptor.capture());
        List<PoiAudioReadyEvent> readyEvents = readyCaptor.getAllValues();

        // Verify "vi" event carries source text VERBATIM (double spaces and \r\n preserved byte-for-byte)
        PoiAudioReadyEvent viReady = readyEvents.stream()
                .filter(e -> "vi".equals(e.getLanguageCode()))
                .findFirst()
                .orElseThrow();
        assertEquals(viTitle, viReady.getTitle());
        assertEquals(viSummary, viReady.getSummary());
        assertEquals(viDesc, viReady.getDescription());
        assertEquals(viHist, viReady.getHistoricalSignificance());
        assertArrayEquals(viTitle.getBytes(StandardCharsets.UTF_8),
                viReady.getTitle().getBytes(StandardCharsets.UTF_8),
                "vi title must be byte-for-byte equal to input");
        assertArrayEquals(viDesc.getBytes(StandardCharsets.UTF_8),
                viReady.getDescription().getBytes(StandardCharsets.UTF_8),
                "vi description must be byte-for-byte equal to input");
        assertEquals("READY", viReady.getAudioStatus());
        assertEquals(ContentHashUtils.computeHash("vi", viTitle, viSummary, viDesc, viHist), viReady.getContentHash());

        // Verify hash matches ContentHashUtils for each language
        for (PoiAudioReadyEvent e : readyEvents) {
            String expectedHash = ContentHashUtils.computeHash(e.getLanguageCode(), viTitle, viSummary, viDesc, viHist);
            assertEquals(expectedHash, e.getContentHash());
            assertEquals("READY", e.getAudioStatus());
        }

        // Verify with InOrder that publishAudioReady happens BEFORE the save of DONE for each language
        InOrder inOrder = inOrder(eventPublisher, translationJobRepository);
        for (PoiAudioReadyEvent ready : readyEvents) {
            inOrder.verify(eventPublisher).publishAudioReady(argThat(r -> r.getLanguageCode().equals(ready.getLanguageCode())));
            inOrder.verify(translationJobRepository).save(argThat(j -> j.getLanguageCode().equals(ready.getLanguageCode()) && "DONE".equals(j.getStatus())));
        }

        // Verify all 4 jobs saved as DONE
        assertEquals(4, jobStore.size());
        assertTrue(jobStore.values().stream().allMatch(j -> "DONE".equals(j.getStatus())));
    }

    @Test
    @DisplayName("Authored en: dùng nguyên văn (không dịch máy), hash tính từ chính bản en, TTS đọc tiêu đề + mô tả")
    void testAuthoredLanguage_usedVerbatim() {
        String viTitle = "Dinh Độc Lập";
        String viSummary = "Tóm tắt tiếng Việt";
        String viDesc = "Mô tả tiếng Việt";
        String authoredTitle = "Independence Palace";
        String authoredSummary = "Authored EN summary";
        String authoredDesc = "Authored EN description.\n\nSecond paragraph.";

        Map<String, AuthoredPoiText> authored = Map.of("en", AuthoredPoiText.builder()
                .title(authoredTitle)
                .summary(authoredSummary)
                .description(authoredDesc)
                .historicalSignificance(null)
                .build());

        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(909L)
                .poiCode("POI_09")
                .sourceLanguage("vi")
                .title(viTitle)
                .summary(viSummary)
                .description(viDesc)
                .targetLanguages(List.of("en"))
                .authoredTexts(authored)
                .build();

        pipelineService.processPoiEvent(event);

        // Không gọi nhà cung cấp dịch máy cho "en"
        verify(translationCacheService, never()).getOrTranslate(eq("en"), any(), any(), any(), any());

        ArgumentCaptor<PoiAudioReadyEvent> readyCaptor = ArgumentCaptor.forClass(PoiAudioReadyEvent.class);
        verify(eventPublisher, times(2)).publishAudioReady(readyCaptor.capture());
        PoiAudioReadyEvent viReady = readyCaptor.getAllValues().stream()
                .filter(e -> "vi".equals(e.getLanguageCode())).findFirst().orElseThrow();
        PoiAudioReadyEvent enReady = readyCaptor.getAllValues().stream()
                .filter(e -> "en".equals(e.getLanguageCode())).findFirst().orElseThrow();

        // vi giữ nguyên bản nguồn
        assertEquals(viTitle, viReady.getTitle());
        // en dùng nguyên văn bản authored
        assertEquals(authoredTitle, enReady.getTitle());
        assertEquals(authoredSummary, enReady.getSummary());
        assertEquals(authoredDesc, enReady.getDescription());
        assertEquals("READY", enReady.getAudioStatus());

        String expectedHash = ContentHashUtils.computeHash("en", authoredTitle, authoredSummary, authoredDesc, null);
        assertEquals(expectedHash, enReady.getContentHash());

        // TTS chỉ đánh tiếng tiêu đề + mô tả
        ArgumentCaptor<String> spokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(audioStorageService).storeAudio(eq(909L), eq("en"), eq(expectedHash), spokenCaptor.capture());
        assertEquals(authoredTitle + "\n\n" + authoredDesc, spokenCaptor.getValue());
    }

    @Test
    @DisplayName("Idempotency: duplicate delivery skips languages that are already DONE")
    void testIdempotency_duplicateDeliverySkipped() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(202L)
                .poiCode("POI_02")
                .title("Bưu điện")
                .description("Mô tả")
                .targetLanguages(List.of("en"))
                .build();

        when(translationCacheService.getOrTranslate(eq("en"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("Central Post Office", "Summary", "Description", null));

        // First delivery
        pipelineService.processPoiEvent(event);
        verify(eventPublisher, times(2)).publishAudioReady(any()); // vi and en

        // Second delivery of same event
        pipelineService.processPoiEvent(event);

        // Verify no additional translation or publishing calls occurred
        verify(translationCacheService, times(1)).getOrTranslate(anyString(), any(), any(), any(), any());
        verify(audioStorageService, times(2)).storeAudio(eq(202L), anyString(), anyString(), anyString());
        verify(eventPublisher, times(2)).publishAudioReady(any());
    }

    @Test
    @DisplayName("Quota exceeded in language en publishes failed event without text; ja, ko and vi still succeed")
    void testLanguageQuotaExceeded_failedWithoutText_othersSucceed() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(303L)
                .title("Nhà thờ Đức Bà")
                .description("Chi tiết")
                .targetLanguages(List.of("en", "ja", "ko"))
                .build();

        when(translationCacheService.getOrTranslate(eq("en"), any(), any(), any(), any()))
                .thenThrow(new TranslationQuotaExceededException("Daily quota of 50000 reached"));

        when(translationCacheService.getOrTranslate(eq("ja"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("教会", "概要", "詳細", null));
        when(translationCacheService.getOrTranslate(eq("ko"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("성당", "요약", "설명", null));

        pipelineService.processPoiEvent(event);

        // 3 ready events (vi, ja, ko)
        verify(eventPublisher, times(3)).publishAudioReady(any());

        // 1 failed event (en)
        ArgumentCaptor<PoiAudioFailedEvent> failedCaptor = ArgumentCaptor.forClass(PoiAudioFailedEvent.class);
        verify(eventPublisher, times(1)).publishAudioFailed(failedCaptor.capture());
        PoiAudioFailedEvent enFailed = failedCaptor.getValue();

        assertEquals("en", enFailed.getLanguageCode());
        assertEquals("FAILED_TRANSLATION", enFailed.getAudioStatus());
        // Quota error must publish WITHOUT text
        assertNull(enFailed.getTitle());
        assertNull(enFailed.getSummary());
        assertNull(enFailed.getDescription());
        assertNotNull(enFailed.getContentHash());
    }

    @Test
    @DisplayName("TTS failure for ja publishes failed event WITH translated text; others unaffected")
    void testTtsFails_failedWithText_othersUnaffected() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(404L)
                .title("Chợ Bến Thành")
                .description("Ngôi chợ cổ")
                .targetLanguages(List.of("en", "ja"))
                .build();

        when(translationCacheService.getOrTranslate(eq("en"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("Ben Thanh Market", "Summary", "Description", null));
        when(translationCacheService.getOrTranslate(eq("ja"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("ベンタイン市場", "概要", "詳細", null));

        // TTS fails specifically for ja
        when(audioStorageService.storeAudio(eq(404L), eq("ja"), anyString(), anyString()))
                .thenThrow(new TtsExecutionException(1, "Synthesis crash"));

        pipelineService.processPoiEvent(event);

        // 2 ready events: vi and en
        verify(eventPublisher, times(2)).publishAudioReady(any());

        // 1 failed event: ja
        ArgumentCaptor<PoiAudioFailedEvent> failedCaptor = ArgumentCaptor.forClass(PoiAudioFailedEvent.class);
        verify(eventPublisher, times(1)).publishAudioFailed(failedCaptor.capture());
        PoiAudioFailedEvent jaFailed = failedCaptor.getValue();

        assertEquals("ja", jaFailed.getLanguageCode());
        assertEquals("FAILED_TTS", jaFailed.getAudioStatus());
        // Failed TTS must include translated text so frontend can use Web Speech API
        assertEquals("ベンタイン市場", jaFailed.getTitle());
        assertEquals("概要", jaFailed.getSummary());
        assertEquals("詳細", jaFailed.getDescription());
    }

    @Test
    @DisplayName("Unsupported voice language ('zh') skips translation and publishes failed without text")
    void testUnsupportedVoiceLanguage_noTranslateCall_failedWithoutText() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(505L)
                .title("Bảo tàng")
                .description("Mô tả bảo tàng")
                .targetLanguages(List.of("zh"))
                .build();

        pipelineService.processPoiEvent(event);

        // Translation provider should NEVER be called for "zh"
        verify(translationCacheService, never()).getOrTranslate(eq("zh"), any(), any(), any(), any());

        // 1 ready for vi
        verify(eventPublisher, times(1)).publishAudioReady(argThat(r -> "vi".equals(r.getLanguageCode())));

        // 1 failed for zh
        ArgumentCaptor<PoiAudioFailedEvent> failedCaptor = ArgumentCaptor.forClass(PoiAudioFailedEvent.class);
        verify(eventPublisher, times(1)).publishAudioFailed(failedCaptor.capture());
        PoiAudioFailedEvent zhFailed = failedCaptor.getValue();

        assertEquals("zh", zhFailed.getLanguageCode());
        assertEquals("FAILED_TTS", zhFailed.getAudioStatus());
        assertNull(zhFailed.getTitle());
    }

    @Test
    @DisplayName("Invalid incoming event throws AmqpRejectAndDontRequeueException")
    void testValidationFailures_throwsAmqpRejectAndDontRequeue() {
        assertThrows(AmqpRejectAndDontRequeueException.class, () -> pipelineService.processPoiEvent(null));

        assertThrows(AmqpRejectAndDontRequeueException.class, () ->
                pipelineService.processPoiEvent(PoiEventPayload.builder().poiId(null).title("T").description("D").targetLanguages(List.of()).build()));

        assertThrows(AmqpRejectAndDontRequeueException.class, () ->
                pipelineService.processPoiEvent(PoiEventPayload.builder().poiId(0L).title("T").description("D").targetLanguages(List.of()).build()));

        assertThrows(AmqpRejectAndDontRequeueException.class, () ->
                pipelineService.processPoiEvent(PoiEventPayload.builder().poiId(1L).title("   ").description("D").targetLanguages(List.of()).build()));

        assertThrows(AmqpRejectAndDontRequeueException.class, () ->
                pipelineService.processPoiEvent(PoiEventPayload.builder().poiId(1L).title("T").description("").targetLanguages(List.of()).build()));

        assertThrows(AmqpRejectAndDontRequeueException.class, () ->
                pipelineService.processPoiEvent(PoiEventPayload.builder().poiId(1L).title("T").description("D").targetLanguages(null).build()));
    }

    @Test
    @DisplayName("Target languages normalization: trim, lowercase, ignore blank/invalid, dedup, vi not duplicated")
    void testTargetLanguagesNormalization() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(606L)
                .title("Tiêu đề")
                .description("Mô tả")
                .targetLanguages(List.of(" EN ", "ja", "EN", "", "   ", "invalid_long_code", "vi"))
                .build();

        when(translationCacheService.getOrTranslate(anyString(), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("Title", "Sum", "Desc", null));

        pipelineService.processPoiEvent(event);

        // Languages processed: vi (implicit, once), en (distinct), ja (distinct) -> total 3
        verify(audioStorageService, times(3)).storeAudio(eq(606L), anyString(), anyString(), anyString());
        verify(translationCacheService, times(2)).getOrTranslate(anyString(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Publish failure propagates exception and leaves status TRANSLATED without saving DONE; redelivery republishes")
    void testPublishFailure_propagatesAndRedeliveryRepublishes() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(707L)
                .title("Tiêu đề")
                .description("Mô tả")
                .targetLanguages(List.of())
                .build();

        // First delivery: publish fails with AmqpException
        doThrow(new AmqpException("Broker unavailable"))
                .doNothing()
                .when(eventPublisher).publishAudioReady(any());

        assertThrows(AmqpException.class, () -> pipelineService.processPoiEvent(event));

        // Verify status was left as TRANSLATED (never marked DONE when publish throws)
        TranslationJob viJob = jobStore.values().iterator().next();
        assertEquals("TRANSLATED", viJob.getStatus());

        // Verify with InOrder that DONE was NEVER saved when publish threw
        verify(translationJobRepository, never()).save(argThat(j -> "DONE".equals(j.getStatus())));

        // Redelivery succeeds
        pipelineService.processPoiEvent(event);
        assertEquals("DONE", viJob.getStatus());

        // Verify redelivery published again (total 2 publishes)
        verify(eventPublisher, times(2)).publishAudioReady(any());

        // Verify with InOrder that publishAudioReady happens BEFORE the save of DONE
        InOrder inOrder = inOrder(eventPublisher, translationJobRepository);
        inOrder.verify(eventPublisher).publishAudioReady(any(PoiAudioReadyEvent.class)); // 1st attempt (failed)
        inOrder.verify(eventPublisher).publishAudioReady(any(PoiAudioReadyEvent.class)); // 2nd attempt (succeeded)
        inOrder.verify(translationJobRepository).save(argThat(j -> "DONE".equals(j.getStatus())));
    }

    @Test
    @DisplayName("Ready event never marks DONE before TTS succeeds")
    void testReadyEventNeverMarksDoneBeforeTtsSucceeded() {
        PoiEventPayload event = PoiEventPayload.builder()
                .poiId(808L)
                .title("Tiêu đề")
                .description("Mô tả")
                .targetLanguages(List.of("en"))
                .build();

        when(translationCacheService.getOrTranslate(eq("en"), any(), any(), any(), any()))
                .thenReturn(new TranslatedPoiContent("Title", "Sum", "Desc", null));

        when(audioStorageService.storeAudio(eq(808L), eq("en"), anyString(), anyString()))
                .thenThrow(new TtsExecutionException(1, "TTS failed"));

        pipelineService.processPoiEvent(event);

        // "en" job should be FAILED_TTS, never DONE
        String enKey = "808_en_" + ContentHashUtils.computeHash("en", "Tiêu đề", null, "Mô tả", null);
        TranslationJob enJob = jobStore.get(enKey);
        assertNotNull(enJob);
        assertEquals("FAILED_TTS", enJob.getStatus());

        // "en" was never saved as DONE and ready was never published for "en"
        verify(translationJobRepository, never()).save(argThat(j -> "en".equals(j.getLanguageCode()) && "DONE".equals(j.getStatus())));
        verify(eventPublisher, never()).publishAudioReady(argThat(r -> "en".equals(r.getLanguageCode())));

        // For "vi" (which succeeded), verify with InOrder that publishAudioReady happened BEFORE save of DONE
        InOrder inOrder = inOrder(eventPublisher, translationJobRepository);
        inOrder.verify(eventPublisher).publishAudioReady(argThat(r -> "vi".equals(r.getLanguageCode())));
        inOrder.verify(translationJobRepository).save(argThat(j -> "vi".equals(j.getLanguageCode()) && "DONE".equals(j.getStatus())));
    }
}
