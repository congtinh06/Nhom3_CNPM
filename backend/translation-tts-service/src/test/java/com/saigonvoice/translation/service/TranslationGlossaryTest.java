package com.saigonvoice.translation.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class TranslationGlossaryTest {

    private TranslationGlossary glossary;

    @BeforeEach
    void setUp() {
        glossary = new TranslationGlossary();
    }

    @Test
    @DisplayName("Lookup HIT: exact match for 'Chợ Bến Thành' across en, ja, ko")
    void testLookup_hit() {
        Optional<String> en = glossary.lookup("Chợ Bến Thành", "en");
        assertTrue(en.isPresent(), "Expected hit for en");
        assertEquals("Ben Thanh Market", en.get());

        Optional<String> ja = glossary.lookup("Chợ Bến Thành", "ja");
        assertTrue(ja.isPresent(), "Expected hit for ja");
        assertEquals("ベンタイン市場", ja.get());

        Optional<String> ko = glossary.lookup("Chợ Bến Thành", "ko");
        assertTrue(ko.isPresent(), "Expected hit for ko");
        assertEquals("\uBCA4\uD0C4 \uC2DC\uC7A5", ko.get());
    }

    @Test
    @DisplayName("Lookup MISS: unknown title returns Optional.empty()")
    void testLookup_miss_unknownTitle() {
        Optional<String> result = glossary.lookup("Nhà thờ Đức Bà", "en");
        assertTrue(result.isEmpty());

        Optional<String> result2 = glossary.lookup("Dinh Độc Lập", "ja");
        assertTrue(result2.isEmpty());
    }

    @Test
    @DisplayName("Lookup MISS: null and blank titles or languages return Optional.empty()")
    void testLookup_miss_nullAndBlank() {
        assertTrue(glossary.lookup(null, "en").isEmpty());
        assertTrue(glossary.lookup("", "en").isEmpty());
        assertTrue(glossary.lookup("   ", "en").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", null).isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "   ").isEmpty());
    }

    @Test
    @DisplayName("Lookup MISS: substring containment does NOT match (no substring replacement)")
    void testLookup_miss_substringNotMatched() {
        // Appended or prepended text must NOT match
        assertTrue(glossary.lookup("Chợ Bến Thành Quận 1", "en").isEmpty());
        assertTrue(glossary.lookup("Cửa Đông Chợ Bến Thành", "en").isEmpty());
        assertTrue(glossary.lookup("Tham quan Chợ Bến Thành", "ja").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến", "en").isEmpty());
        assertTrue(glossary.lookup("Bến Thành", "en").isEmpty());
    }

    @Test
    @DisplayName("Case and whitespace variants: leading/trailing whitespace and various cases match")
    void testLookup_caseAndWhitespaceVariants() {
        // Leading and trailing spaces
        assertEquals("Ben Thanh Market", glossary.lookup("  Chợ Bến Thành  ", "en").orElseThrow());
        assertEquals("Ben Thanh Market", glossary.lookup("\tChợ Bến Thành\n", "en").orElseThrow());

        // Lowercase
        assertEquals("Ben Thanh Market", glossary.lookup("chợ bến thành", "en").orElseThrow());

        // Uppercase
        assertEquals("Ben Thanh Market", glossary.lookup("CHỢ BẾN THÀNH", "en").orElseThrow());

        // Mixed case with spaces and uppercase language code
        assertEquals("Ben Thanh Market", glossary.lookup("  chợ BẾN Thành  ", "  EN  ").orElseThrow());
        assertEquals("ベンタイン市場", glossary.lookup("CHỢ BẾN THÀNH", "JA").orElseThrow());
        assertEquals("\uBCA4\uD0C4 \uC2DC\uC7A5", glossary.lookup("  chợ bến thành  ", "KO").orElseThrow());
    }

    @Test
    @DisplayName("Missing language fallback: known title but target language not in glossary returns Optional.empty()")
    void testLookup_missingLanguageFallback() {
        // Known title, but languages other than en, ja, ko are not defined in the glossary
        assertTrue(glossary.lookup("Chợ Bến Thành", "fr").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "de").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "es").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "zh").isEmpty());
        assertTrue(glossary.lookup("Chợ Bến Thành", "vi").isEmpty());
    }
}
