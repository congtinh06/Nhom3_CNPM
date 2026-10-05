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
        String title = "Chợ Tân Định";
        String summary = "";
        String desc = null;
        String hist = null;

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(true);
        when(translationProvider.name()).thenReturn("mymemory");
        when(translationProvider.translate(eq(title), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Tan Dinh Market"));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        assertEquals("Tan Dinh Market", result.title());
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
    @DisplayName("Pipeline test: Glossary title hit uses glossary translation and never calls translationProvider for title")
    void testPipeline_glossaryHit_neverCallsTranslationProviderForTitle_andTranslatesOtherFields() {
        String targetLang = "en";
        String title = "Chợ Bến Thành";
        String summary = "Ngôi chợ nổi tiếng";
        String desc = "Mô tả chi tiết chợ";
        String hist = "Ý nghĩa lịch sử";

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(true);
        when(translationProvider.name()).thenReturn("mymemory");
        when(translationProvider.translate(eq(summary), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Famous market"));
        when(translationProvider.translate(eq(desc), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Detailed market description"));
        when(translationProvider.translate(eq(hist), eq("vi"), eq("en")))
                .thenReturn(new TranslatedText("Historical significance"));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        // Title comes from glossary, other fields from provider
        assertEquals("Ben Thanh Market", result.title());
        assertEquals("Famous market", result.summary());
        assertEquals("Detailed market description", result.description());
        assertEquals("Historical significance", result.historicalSignificance());

        // PROOF: TranslationProvider is NEVER called for the glossary title
        verify(translationProvider, never()).translate(eq("Chợ Bến Thành"), any(), any());
        verify(translationProvider, times(1)).translate(eq(summary), eq("vi"), eq("en"));
        verify(translationProvider, times(1)).translate(eq(desc), eq("vi"), eq("en"));
        verify(translationProvider, times(1)).translate(eq(hist), eq("vi"), eq("en"));

        // Saved cache contains glossary title
        ArgumentCaptor<TranslationCache> captor = ArgumentCaptor.forClass(TranslationCache.class);
        verify(translationCacheRepository, times(1)).save(captor.capture());
        assertEquals("Ben Thanh Market", captor.getValue().getTitle());
    }

    @Test
    @DisplayName("Pipeline test: Glossary title hit with pre-existing cache overrides bad cached title without calling provider")
    void testPipeline_glossaryHit_overridesBadCachedTitle_withoutCallingProvider() {
        String targetLang = "en";
        String title = "Chợ Bến Thành";
        String summary = "Tóm tắt";
        String desc = "Mô tả";
        String hist = null;

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        // Pre-existing cache entity containing the bad MT title "4. Ben Thanh Market"
        TranslationCache cachedEntity = TranslationCache.builder()
                .contentHash(expectedHash)
                .languageCode("en")
                .title("4. Ben Thanh Market")
                .summary("Cached summary")
                .description("Cached description")
                .historicalSignificance(null)
                .build();

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.of(cachedEntity));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        // Title must be the glossary title ("Ben Thanh Market"), not the cached "4. Ben Thanh Market"
        assertEquals("Ben Thanh Market", result.title());
        assertEquals("Cached summary", result.summary());
        assertEquals("Cached description", result.description());

        // Provider is never called
        verifyNoInteractions(translationProvider);
    }

    @Test
    @DisplayName("Pipeline test: Missing language in glossary falls back to normal provider flow for title")
    void testPipeline_glossaryMissingLanguage_fallsBackToProvider() {
        String targetLang = "fr";
        String title = "Chợ Bến Thành";
        String summary = "Tóm tắt";
        String desc = "Mô tả";
        String hist = null;

        String expectedHash = ContentHashUtils.computeHash(targetLang, title, summary, desc, hist);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(false);
        when(translationProvider.name()).thenReturn("seed");
        when(translationProvider.translate(eq(title), eq("vi"), eq("fr")))
                .thenReturn(new TranslatedText("Marché Ben Thanh"));
        when(translationProvider.translate(eq(summary), eq("vi"), eq("fr")))
                .thenReturn(new TranslatedText("Résumé"));
        when(translationProvider.translate(eq(desc), eq("vi"), eq("fr")))
                .thenReturn(new TranslatedText("Description"));

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, hist);

        assertEquals("Marché Ben Thanh", result.title());
        verify(translationProvider, times(1)).translate(eq(title), eq("vi"), eq("fr"));
    }

    @Test
    @DisplayName("Pipeline test: Glossary title hit with case and whitespace variants never calls provider for title")
    void testPipeline_glossaryHit_caseAndWhitespaceVariants_neverCallsProviderForTitle() {
        String targetLang = "JA";
        String title = "  CHỢ BẾN THÀNH  ";
        String summary = "";
        String desc = "";

        String expectedHash = ContentHashUtils.computeHash("ja", title, summary, desc, null);

        when(translationCacheRepository.findByContentHash(expectedHash)).thenReturn(Optional.empty());
        when(translationProvider.cacheable()).thenReturn(false);
        when(translationProvider.name()).thenReturn("seed");

        TranslatedPoiContent result = cacheService.getOrTranslate(targetLang, title, summary, desc, null);

        assertEquals("ベンタイン市場", result.title());
        verify(translationProvider, never()).translate(any(), any(), any());
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
