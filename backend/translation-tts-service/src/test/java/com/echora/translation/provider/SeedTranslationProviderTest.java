package com.echora.translation.provider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SeedTranslationProviderTest {

    private SeedTranslationProvider provider;

    @BeforeEach
    void setUp() {
        provider = new SeedTranslationProvider();
    }

    @Test
    @DisplayName("name() returns 'seed'")
    void testName() {
        assertEquals("seed", provider.name());
    }

    @Test
    @DisplayName("cacheable() returns false for SeedTranslationProvider")
    void testCacheable_returnsFalse() {
        assertFalse(provider.cacheable());
    }

    @Test
    @DisplayName("translate() deterministic output: prefixes Vietnamese text with '[<targetLang>] '")
    void testTranslate_deterministic() {
        TranslatedText enResult = provider.translate("Bưu điện Trung tâm", "vi", "en");
        assertEquals("[en] Bưu điện Trung tâm", enResult.text());

        TranslatedText jaResult = provider.translate("Nhà thờ Đức Bà", "vi", "ja");
        assertEquals("[ja] Nhà thờ Đức Bà", jaResult.text());

        TranslatedText koResult = provider.translate("Chợ Bến Thành", "vi", "ko");
        assertEquals("[ko] Chợ Bến Thành", koResult.text());
    }

    @Test
    @DisplayName("translate() with empty or blank source returns empty TranslatedText")
    void testTranslate_blankOrNull() {
        assertEquals("", provider.translate(null, "vi", "en").text());
        assertEquals("", provider.translate("", "vi", "en").text());
        assertEquals("", provider.translate("   ", "vi", "en").text());
    }

    @Test
    @DisplayName("translate() rejects sourceLang == targetLang with IllegalArgumentException")
    void testTranslate_sameLanguage_throwsException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> provider.translate("Xin chào", "vi", "vi")
        );
        assertTrue(ex.getMessage().contains("identical"));
    }

    @Test
    @DisplayName("translate() rejects null or blank languages")
    void testTranslate_nullOrBlankLanguage_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> provider.translate("Xin chào", null, "en"));
        assertThrows(IllegalArgumentException.class, () -> provider.translate("Xin chào", "vi", null));
        assertThrows(IllegalArgumentException.class, () -> provider.translate("Xin chào", "  ", "en"));
    }
}
