package com.saigonvoice.translation.service;

import com.saigonvoice.translation.entity.TranslationCache;
import com.saigonvoice.translation.exception.TranslationPayloadLimitException;
import com.saigonvoice.translation.provider.TranslatedPoiContent;
import com.saigonvoice.translation.provider.TranslatedText;
import com.saigonvoice.translation.provider.TranslationProvider;
import com.saigonvoice.translation.repository.TranslationCacheRepository;
import com.saigonvoice.translation.util.ContentHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TranslationCacheServiceTest {

    @Mock
    private TranslationCacheRepository translationCacheRepository;

    @Mock
    private TranslationProvider translationProvider;

    private TranslationCacheServiceImpl cacheService;

    @BeforeEach
    void setUp() {
        cacheService = new TranslationCacheServiceImpl(translationCacheRepository, translationProvider);
    }

    @Test
    @DisplayName("Cache HIT skips translation provider call entirely")
    void testCacheHit_skipsProvider() {
        String targetLang = "en";
        String title = "Bưu điện Trung tâm";
        String summary = "Tóm tắt mẫu";
        String desc = "Mô tả chi tiết";
        String hist = "Ý nghĩa lịch sử";

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        TranslationCache cachedEntity = TranslationCache.builder()
                .contentHash(expectedHash)
                .languageCode("en")
                .title("Cached Central Post Office")
                .summary("Cached summary")
                .description("Cached description")
                .historicalSignificance("Cached history")
                .build();

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.of(cachedEntity));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        assertNotNull(result);
        assertEquals("Cached Central Post Office", result.title());
        assertEquals("Cached summary", result.summary());
        assertEquals("Cached description", result.description());
        assertEquals("Cached history", result.historicalSignificance());

        // Verify provider was never invoked
        verifyNoInteractions(translationProvider);
        verify(translationCacheRepository, never()).save(any());
    }

    @Test
    @DisplayName("Non-cacheable provider: repository.save never called, second call invokes provider again")
    void testNonCacheableProvider_neverSavesToCache_andSecondCallInvokesProviderAgain() {
        String targetLang = "en";
        String title = "Bưu điện Trung tâm";
        String summary = "Tóm tắt";
        String desc = "Mô tả";
        String hist = null;

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(false);
        when(translationProvider.name()).thenReturn("seed");
        when(translationProvider.translate(eq(title), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("[en] Bưu điện Trung tâm"));
        when(translationProvider.translate(eq(summary), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("[en] Tóm tắt"));
        when(translationProvider.translate(eq(desc), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("[en] Mô tả"));

        // First call
        TranslatedPoiContent firstResult = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);
        assertEquals("[en] Bưu điện Trung tâm", firstResult.title());

        // Second call with same inputs
        TranslatedPoiContent secondResult = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);
        assertEquals("[en] Bưu điện Trung tâm", secondResult.title());

        // Verify repository.save was NEVER called
        verify(translationCacheRepository, never()).save(any());

        // Verify provider was invoked twice for each field
        verify(translationProvider, times(2)).translate(eq(title), eq("vi"), eq("en"));
        verify(translationProvider, times(2)).translate(eq(summary), eq("vi"), eq("en"));
        verify(translationProvider, times(2)).translate(eq(desc), eq("vi"), eq("en"));
    }

    @Test
    @DisplayName("Cacheable provider: repository.save called once on cache miss")
    void testCacheableProvider_savesToCacheOnce() {
        String targetLang = "ja";
        String title = "Nhà thờ Đức Bà";
        String summary = "Tóm tắt kiến trúc";
        String desc = "Mô tả nhà thờ";
        String hist = "Lịch sử nhà thờ";

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(true);
        when(translationProvider.name()).thenReturn("mymemory");
        when(translationProvider.translate(eq(title), eq("vi"), eq("ja")))
                .thenReturn(new TranslatedText("ノートルダム大聖堂"));
        when(translationProvider.translate(eq(summary), eq("vi"), eq("ja")))
                .thenReturn(new TranslatedText("建築の概要"));
        when(translationProvider.translate(eq(desc), eq("vi"), eq("ja")))
                .thenReturn(new TranslatedText("大聖堂の詳細な説明"));
        when(translationProvider.translate(eq(hist), eq("vi"), eq("ja")))
                .thenReturn(new TranslatedText("教会の歴史"));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        assertNotNull(result);
        assertEquals("ノートルダム大聖堂", result.title());
        assertEquals("建築の概要", result.summary());
        assertEquals("大聖堂の詳細な説明", result.description());
        assertEquals("教会の歴史", result.historicalSignificance());

        ArgumentCaptor<TranslationCache> captor = ArgumentCaptor.forClass(TranslationCache.class);
        verify(translationCacheRepository, times(1)).save(captor.capture());
        TranslationCache saved = captor.getValue();
        assertEquals(expectedHash, saved.getContentHash());
        assertEquals("ja", saved.getLanguageCode());
        assertEquals("ノートルダム大聖堂", saved.getTitle());
    }

    @Test
    @DisplayName("Cache MISS with empty summary/description stores \"\" (not null) in repository for cacheable provider")
    void testCacheMiss_emptySummaryAndDescription_storesEmptyString() {
        String targetLang = "en";
        String title = "Chợ Bến Thành";
        String summary = "";
        String desc = null;
        String hist = null;

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(true);
        when(translationProvider.name()).thenReturn("mymemory");
        when(translationProvider.translate(eq(title), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Ben Thanh Market"));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        assertEquals("Ben Thanh Market", result.title());
        assertEquals("", result.summary());
        assertEquals("", result.description());
        assertNull(result.historicalSignificance());

        ArgumentCaptor<TranslationCache> captor = ArgumentCaptor.forClass(TranslationCache.class);
        verify(translationCacheRepository, times(1)).save(captor.capture());
        TranslationCache saved = captor.getValue();
        assertEquals("", saved.getSummary());
        assertEquals("", saved.getDescription());
        assertNull(saved.getHistoricalSignificance());
    }

    @Test
    @DisplayName("Translated title exceeding 255 chars throws TranslationPayloadLimitException")
    void testTranslatedTitleExceeds255_throwsPayloadLimitException() {
        String targetLang = "en";
        String title = "Tiêu đề";

        String longTitle = "A".repeat(256);
        when(translationCacheRepository.findByContentHash(any())).thenReturn(Optional.empty());
        when(translationProvider.name()).thenReturn("mock");
        when(translationProvider.translate(eq(title), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText(longTitle));

        TranslationPayloadLimitException ex = assertThrows(
                TranslationPayloadLimitException.class,
                () -> cacheService.getOrTranslate(targetLang, title, "tóm tắt", "mô tả", null)
        );

        assertTrue(ex.getMessage().contains("255"));
        verify(translationCacheRepository, never()).save(any());
    }

    @Test
    @DisplayName("Translated summary exceeding 1000 chars throws TranslationPayloadLimitException")
    void testTranslatedSummaryExceeds1000_throwsPayloadLimitException() {
        String targetLang = "en";
        String title = "Tiêu đề";
        String summary = "Tóm tắt";

        String longSummary = "B".repeat(1001);
        when(translationCacheRepository.findByContentHash(any())).thenReturn(Optional.empty());
        when(translationProvider.name()).thenReturn("mock");
        when(translationProvider.translate(eq(title), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Valid Title"));
        when(translationProvider.translate(eq(summary), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText(longSummary));

        TranslationPayloadLimitException ex = assertThrows(
                TranslationPayloadLimitException.class,
                () -> cacheService.getOrTranslate(targetLang, title, summary, "mô tả", null)
        );

        assertTrue(ex.getMessage().contains("1000"));
        verify(translationCacheRepository, never()).save(any());
    }

    @Test
    @DisplayName("Target language 'vi' is rejected with IllegalArgumentException")
    void testTargetLanguageVi_rejected() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cacheService.getOrTranslate("vi", "Tiêu đề", "Tóm tắt", "Mô tả", null)
        );
        assertTrue(ex.getMessage().contains("Vietnamese"));
        verifyNoInteractions(translationProvider);
        verifyNoInteractions(translationCacheRepository);
    }
}
