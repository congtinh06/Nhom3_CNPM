package com.echora.content.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ContentHashUtilsTest {

    @Test
    @DisplayName("clean: null hoặc khoảng trắng trả về rỗng, ngược lại cắt khoảng trắng hai đầu")
    void testClean() {
        assertThat(ContentHashUtils.clean(null)).isEmpty();
        assertThat(ContentHashUtils.clean("")).isEmpty();
        assertThat(ContentHashUtils.clean("   ")).isEmpty();
        assertThat(ContentHashUtils.clean("  hello world  ")).isEqualTo("hello world");
    }

    @Test
    @DisplayName("computeHash: Test Vector 1 (đầy đủ 5 trường) phải ra đúng c6058aa8...ee2c")
    void testVector1() {
        String hash = ContentHashUtils.computeHash(
                "en",
                "Bưu điện Trung tâm",
                "Tóm tắt mẫu",
                "Mô tả chi tiết",
                "Ý nghĩa lịch sử"
        );
        assertThat(hash).isEqualTo("c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c");
    }

    @Test
    @DisplayName("computeHash: Test Vector 2 (trường ý nghĩa lịch sử null/rỗng) phải ra đúng e86ff203...01f9")
    void testVector2() {
        String hashNull = ContentHashUtils.computeHash(
                "ja",
                "Nhà thờ Đức Bà",
                "Tóm tắt kiến trúc",
                "Mô tả nhà thờ",
                null
        );
        assertThat(hashNull).isEqualTo("e86ff203fb7b2bbb6e6f8b89ef5207559429dc40b58e117229392d20203e01f9");

        String hashWhitespace = ContentHashUtils.computeHash(
                "ja",
                "  Nhà thờ Đức Bà  ",
                "  Tóm tắt kiến trúc  ",
                "  Mô tả nhà thờ  ",
                "    "
        );
        assertThat(hashWhitespace).isEqualTo("e86ff203fb7b2bbb6e6f8b89ef5207559429dc40b58e117229392d20203e01f9");
    }

    @Test
    @DisplayName("computeNarrationHash: chỉ phụ thuộc language + description, khớp translation-tts-service")
    void testNarrationHash_descriptionOnly() {
        String hash = ContentHashUtils.computeNarrationHash("en", "  Mô tả  ");
        assertThat(hash).isEqualTo("04cf13e6e3d82006111124487b653111718446c09ca97a80709f6eaa33829409");
        assertThat(ContentHashUtils.computeNarrationHash("EN", "Mô tả")).isEqualTo(hash);
    }
}
