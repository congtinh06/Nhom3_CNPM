package com.saigonvoice.translation.tts;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TtsTextBuilderTest {

    @Test
    @DisplayName("Should build text from all 4 fields in exact order separated by blank line")
    void testBuildText_allFieldsPresent() {
        String title = "Nhà thờ Đức Bà";
        String summary = "Công trình kiến trúc Gothic nổi tiếng";
        String description = "Tọa lạc tại trung tâm Quận 1, xây dựng từ năm 1877.";
        String historicalSignificance = "Biểu tượng lịch sử văn hóa của Sài Gòn.";

        String result = TtsTextBuilder.buildText(title, summary, description, historicalSignificance);

        String expected = "Nhà thờ Đức Bà\n\n"
                + "Công trình kiến trúc Gothic nổi tiếng\n\n"
                + "Tọa lạc tại trung tâm Quận 1, xây dựng từ năm 1877.\n\n"
                + "Biểu tượng lịch sử văn hóa của Sài Gòn.";

        assertEquals(expected, result);
    }

    @Test
    @DisplayName("Should skip null and blank fields while maintaining relative order")
    void testBuildText_skipsNullAndBlankFields() {
        String title = "  Bưu điện Trung tâm  ";
        String summary = null;
        String description = "   ";
        String historicalSignificance = "Điểm đến lịch sử.";

        String result = TtsTextBuilder.buildText(title, summary, description, historicalSignificance);

        String expected = "Bưu điện Trung tâm\n\nĐiểm đến lịch sử.";
        assertEquals(expected, result);
    }

    @Test
    @DisplayName("Should return empty string (never null) when all fields are null or blank")
    void testBuildText_allFieldsBlankOrNull() {
        String result1 = TtsTextBuilder.buildText(null, null, null, null);
        assertNotNull(result1);
        assertEquals("", result1);

        String result2 = TtsTextBuilder.buildText("  ", "\t", "\n", "   ");
        assertNotNull(result2);
        assertEquals("", result2);
    }

    @Test
    @DisplayName("Should trim per-field whitespace correctly")
    void testBuildText_trimsFields() {
        String result = TtsTextBuilder.buildText("  Tiêu đề  ", "  Tóm tắt\n  ", null, "  Ý nghĩa  ");
        assertEquals("Tiêu đề\n\nTóm tắt\n\nÝ nghĩa", result);
    }
}
