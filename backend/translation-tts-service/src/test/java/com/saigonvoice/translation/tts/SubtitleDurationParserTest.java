package com.saigonvoice.translation.tts;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SubtitleDurationParserTest {

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("Should extract duration from the last cue in multi-cue subtitle file")
    void testParseDuration_multiCue() throws IOException {
        String content = """
                1
                00:00:00,100 --> 00:00:01,687
                Câu thứ nhất.

                2
                00:00:01,637 --> 00:00:05,075
                Câu thứ hai dài hơn một chút để xem kết quả.
                """;
        Path subFile = tempDir.resolve("test.vtt");
        Files.writeString(subFile, content);

        Integer duration = SubtitleDurationParser.parseDurationSeconds(subFile);
        // 5.075s rounds to 5s
        assertEquals(5, duration);
    }

    @Test
    @DisplayName("Should handle dot format (00:00:02.800) and round up/down correctly")
    void testParseDuration_dotFormat() throws IOException {
        String content = """
                1
                00:00:00.000 --> 00:01:23.650
                Long audio snippet.
                """;
        Path subFile = tempDir.resolve("test_dot.vtt");
        Files.writeString(subFile, content);

        Integer duration = SubtitleDurationParser.parseDurationSeconds(subFile);
        // 1 min 23.65s = 83.65s -> rounds to 84s
        assertEquals(84, duration);
    }

    @Test
    @DisplayName("Should return null for empty, corrupted, or non-existent file")
    void testParseDuration_invalidFiles() throws IOException {
        assertNull(SubtitleDurationParser.parseDurationSeconds(null));
        assertNull(SubtitleDurationParser.parseDurationSeconds(tempDir.resolve("non_existent.vtt")));

        Path emptyFile = tempDir.resolve("empty.vtt");
        Files.createFile(emptyFile);
        assertNull(SubtitleDurationParser.parseDurationSeconds(emptyFile));

        Path corruptFile = tempDir.resolve("corrupt.vtt");
        Files.writeString(corruptFile, "Not a subtitle file at all\nNo timestamps here");
        assertNull(SubtitleDurationParser.parseDurationSeconds(corruptFile));
    }
}
