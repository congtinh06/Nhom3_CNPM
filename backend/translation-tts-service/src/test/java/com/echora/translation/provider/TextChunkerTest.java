package com.echora.translation.provider;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TextChunkerTest {

    @Test
    @DisplayName("Empty or null text returns empty chunk list")
    void testEmptyOrNull() {
        assertTrue(TextChunker.split(null, 100).isEmpty());
        assertTrue(TextChunker.split("", 100).isEmpty());
        assertTrue(TextChunker.split("   ", 100).isEmpty());
    }

    @Test
    @DisplayName("Text within maxBytes returns single chunk")
    void testWithinMaxBytes() {
        String text = "Bưu điện Trung tâm thành phố";
        List<String> chunks = TextChunker.split(text, 100);
        assertEquals(1, chunks.size());
        assertEquals(text, chunks.get(0));
    }

    @Test
    @DisplayName("Splits long text across sentence boundaries while keeping bytes within limit")
    void testSentenceSplitting() {
        String sentence1 = "Câu thứ nhất dài vừa phải.";
        String sentence2 = "Câu thứ hai tiếp tục mạch văn.";
        String sentence3 = "Câu thứ ba kết thúc toàn bộ đoạn văn ngắn.";
        String fullText = sentence1 + " " + sentence2 + " " + sentence3;

        // Ensure maxBytes is smaller than fullText but enough for individual sentences
        int maxBytes = 45;
        List<String> chunks = TextChunker.split(fullText, maxBytes);

        assertTrue(chunks.size() > 1);
        for (String chunk : chunks) {
            assertTrue(chunk.getBytes(StandardCharsets.UTF_8).length <= maxBytes,
                    "Chunk exceeds maxBytes: " + chunk);
        }

        // Reassembled text contains all sentences
        String reassembled = String.join(" ", chunks);
        assertTrue(reassembled.contains("Câu thứ nhất"));
        assertTrue(reassembled.contains("Câu thứ hai"));
        assertTrue(reassembled.contains("Câu thứ ba"));
    }

    @Test
    @DisplayName("Hard slices oversized word without breaking UTF-8 characters")
    void testHardSliceOversizedWord() {
        String longWord = "ĐạiHọcBáchKhoaThànhPhốHồChíMinhViệtNam".repeat(5);
        int maxBytes = 30;

        List<String> chunks = TextChunker.split(longWord, maxBytes);
        assertFalse(chunks.isEmpty());

        for (String chunk : chunks) {
            assertTrue(chunk.getBytes(StandardCharsets.UTF_8).length <= maxBytes);
            // Verify valid UTF-8 string roundtrip
            byte[] bytes = chunk.getBytes(StandardCharsets.UTF_8);
            String recovered = new String(bytes, StandardCharsets.UTF_8);
            assertEquals(chunk, recovered);
        }
    }
}
