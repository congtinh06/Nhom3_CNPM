package com.saigonvoice.translation.tts;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TtsTextBuilderTest {

    @Test
    @DisplayName("Should build spoken text from title and description in that order, separated by a blank line")
    void testBuildText_titleAndDescription() {
        String title = "Nhà thờ Đức Bà";
        String description = "Tọa lạc tại trung tâm Quận 1, xây dựng từ năm 1877.";

        String result = TtsTextBuilder.buildText(title, description);

        String expected = "Nhà thờ Đức Bà\n\nTọa lạc tại trung tâm Quận 1, xây dựng từ năm 1877.";
        assertEquals(expected, result);
    }

    @Test
    @DisplayName("Should skip null and blank fields while maintaining order")
    void testBuildText_skipsNullAndBlankFields() {
        String title = "  Bưu điện Trung tâm  ";
        String description = "   ";

        String result = TtsTextBuilder.buildText(title, null);
        assertEquals("Bưu điện Trung tâm", result);

        String result2 = TtsTextBuilder.buildText(null, "   ");
        assertEquals("", result2);
    }

    @Test
    @DisplayName("Should return empty string (never null) when both fields are null or blank")
    void testBuildText_allFieldsBlankOrNull() {
        String result1 = TtsTextBuilder.buildText(null, null);
        assertNotNull(result1);
        assertEquals("", result1);

        String result2 = TtsTextBuilder.buildText("  ", "\t");
        assertNotNull(result2);
        assertEquals("", result2);
    }

    @Test
    @DisplayName("Should trim whitespace")
    void testBuildText_trimsFields() {
        String result = TtsTextBuilder.buildText("  Tiêu đề  ", "  Tóm tắt\n  ");
        assertEquals("Tiêu đề\n\nTóm tắt", result);
    }
}