package com.echora.translation.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ContentHashUtilsTest {

    @Test
    @DisplayName("Lock Test Vector 1: 5 fields present")
    void testVector1_allFieldsPresent() {
        String hash = ContentHashUtils.computeHash(
                "en",
                "Bưu điện Trung tâm",
                "Tóm tắt mẫu",
                "Mô tả chi tiết",
                "Ý nghĩa lịch sử"
        );
        assertEquals("c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c", hash);
    }

    @Test
    @DisplayName("Lock Test Vector 2: historicalSignificance is null or empty")
    void testVector2_historicalSignificanceNull() {
        String hashWithNull = ContentHashUtils.computeHash(
                "ja",
                "Nhà thờ Đức Bà",
                "Tóm tắt kiến trúc",
                "Mô tả nhà thờ",
                null
        );
        assertEquals("e86ff203fb7b2bbb6e6f8b89ef5207559429dc40b58e117229392d20203e01f9", hashWithNull);

        String hashWithEmpty = ContentHashUtils.computeHash(
                "ja",
                "Nhà thờ Đức Bà",
                "Tóm tắt kiến trúc",
                "Mô tả nhà thờ",
                ""
        );
        assertEquals("e86ff203fb7b2bbb6e6f8b89ef5207559429dc40b58e117229392d20203e01f9", hashWithEmpty);
    }

    @Test
    @DisplayName("Lock Test Vector 3: inner whitespace preserved, outer trim only, uppercase lang lowercased")
    void testVector3_innerWhitespacePreserved() {
        String hash = ContentHashUtils.computeHash(
                "EN",
                "Bưu điện  Trung tâm",
                "Dòng 1\r\nDòng 2",
                "  Mô tả\tcó tab  ",
                null
        );
        assertEquals("11e77a810cd32c8753d49d1f7e219ab5480e7034702cb05728ec094ca3420699", hash);
    }
}
