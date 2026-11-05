package com.echora.translation.tts;

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

    @Test
    @DisplayName("Q3-FIX: buildText should include title, summary, description, historicalSignificance in order")
    void testBuildText_Q3_includesAllFourFields() {
        String title = "Nhà thờ Đức Bà";
        String summary = "Công trình kiến trúc Gothic nổi tiếng";
        String description = "Xây dựng từ năm 1877, tọa lạc tại Quận 1";
        String historicalSignificance = "Biểu tượng của thành phố Hồ Chí Minh";

        String result = TtsTextBuilder.buildText(title, summary, description, historicalSignificance);

        String expected = "Nhà thờ Đức Bà\n\nCông trình kiến trúc Gothic nổi tiếng\n\nXây dựng từ năm 1877, tọa lạc tại Quận 1\n\nBiểu tượng của thành phố Hồ Chí Minh";
        assertEquals(expected, result);
    }

    @Test
    @DisplayName("Q3-FIX: buildText should skip null/blank fields but preserve order of non-blank fields")
    void testBuildText_Q3_skipsBlankFieldsPreservesOrder() {
        // Test: title + description (skip summary and historicalSignificance)
        String result1 = TtsTextBuilder.buildText("Tiêu đề", null, "Mô tả", null);
        assertEquals("Tiêu đề\n\nMô tả", result1);

        // Test: title + summary (skip description and historicalSignificance)
        String result2 = TtsTextBuilder.buildText("Tiêu đề", "Tóm tắt", null, null);
        assertEquals("Tiêu đề\n\nTóm tắt", result2);

        // Test: all blank except description
        String result3 = TtsTextBuilder.buildText(null, "  ", "Mô tả chi tiết", null);
        assertEquals("Mô tả chi tiết", result3);
    }

    @Test
    @DisplayName("Q3-FIX: buildText should never return null, always return empty string if all fields blank")
    void testBuildText_Q3_allFieldsBlank() {
        String result = TtsTextBuilder.buildText(null, "  ", "", null);
        assertNotNull(result);
        assertEquals("", result);
    }
}