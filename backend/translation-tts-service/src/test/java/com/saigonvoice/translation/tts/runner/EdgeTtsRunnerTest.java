package com.saigonvoice.translation.tts.runner;

import com.saigonvoice.translation.exception.TtsEmptyOutputException;
import com.saigonvoice.translation.exception.TtsExecutionException;
import com.saigonvoice.translation.exception.TtsTimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class EdgeTtsRunnerTest {

    @TempDir
    Path tempDir;

    private CommandRunner commandRunner;
    private EdgeTtsRunner edgeTtsRunner;

    @BeforeEach
    void setUp() {
        commandRunner = mock(CommandRunner.class);
        edgeTtsRunner = new EdgeTtsRunner(commandRunner, "edge-tts", 5000);
    }

    @Test
    @DisplayName("Should successfully synthesize and return duration from subtitle file")
    void testSynthesize_success() throws IOException {
        Path targetOutput = tempDir.resolve("output.mp3");
        Path targetSub = tempDir.resolve("output.vtt");

        when(commandRunner.run(anyList(), anyLong())).thenAnswer(invocation -> {
            List<String> cmd = invocation.getArgument(0);
            assertTrue(cmd.contains("--voice"));
            assertTrue(cmd.contains("vi-VN-HoaiMyNeural"));
            assertTrue(cmd.contains("--file"));
            assertTrue(cmd.contains("--write-media"));
            assertTrue(cmd.contains("--write-subtitles"));

            // Fake writing non-empty mp3 and vtt
            Files.write(targetOutput, new byte[]{1, 2, 3, 4});
            Files.writeString(targetSub, "1\n00:00:00,000 --> 00:00:03,500\nHello\n");

            return new CommandResult(0, "", "");
        });

        Integer duration = edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", "Xin chào Sài Gòn", targetOutput, targetSub);

        assertEquals(4, duration); // 3.5s rounded
        assertTrue(Files.exists(targetOutput));
        assertEquals(4, Files.size(targetOutput));
    }

    @Test
    @DisplayName("Should pass text starting with dash '-' safely via temp file without CLI option conflict")
    void testSynthesize_textStartingWithDash() {
        Path targetOutput = tempDir.resolve("dash_output.mp3");

        when(commandRunner.run(anyList(), anyLong())).thenAnswer(invocation -> {
            List<String> cmd = invocation.getArgument(0);
            // Verify that text starting with '-' is not in arguments list directly
            assertFalse(cmd.contains("--rate"));
            int fileArgIdx = cmd.indexOf("--file");
            assertTrue(fileArgIdx != -1 && fileArgIdx + 1 < cmd.size());
            Path tempInput = Path.of(cmd.get(fileArgIdx + 1));
            assertTrue(Files.exists(tempInput));
            assertEquals("--rate +50% fake text", Files.readString(tempInput));

            Files.write(targetOutput, new byte[]{1, 2, 3});
            return new CommandResult(0, "", "");
        });

        edgeTtsRunner.synthesize("en-US-AvaNeural", "--rate +50% fake text", targetOutput, null);
        assertTrue(Files.exists(targetOutput));
    }

    @Test
    @DisplayName("Should throw TtsExecutionException when process exits with non-zero code")
    void testSynthesize_nonZeroExit() {
        Path targetOutput = tempDir.resolve("fail.mp3");

        when(commandRunner.run(anyList(), anyLong())).thenReturn(
                new CommandResult(1, "Connection refused", "")
        );

        TtsExecutionException ex = assertThrows(
                TtsExecutionException.class,
                () -> edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", "Test text", targetOutput, null)
        );

        assertEquals(1, ex.getExitCode());
        assertTrue(ex.getStderr().contains("Connection refused"));
    }

    @Test
    @DisplayName("Should throw TtsTimeoutException when runner times out")
    void testSynthesize_timeout() {
        Path targetOutput = tempDir.resolve("timeout.mp3");

        when(commandRunner.run(anyList(), anyLong())).thenThrow(
                new TtsTimeoutException("TTS process timed out after 5000ms")
        );

        assertThrows(
                TtsTimeoutException.class,
                () -> edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", "Test text", targetOutput, null)
        );
    }

    @Test
    @DisplayName("Should throw TtsEmptyOutputException when output file is missing or 0 bytes")
    void testSynthesize_missingOrEmptyOutput() {
        Path targetOutput = tempDir.resolve("empty.mp3");

        when(commandRunner.run(anyList(), anyLong())).thenAnswer(invocation -> {
            // Creates 0-byte file
            Files.createFile(targetOutput);
            return new CommandResult(0, "", "");
        });

        assertThrows(
                TtsEmptyOutputException.class,
                () -> edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", "Test text", targetOutput, null)
        );
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when text is null or blank")
    void testSynthesize_nullOrBlankText() {
        Path targetOutput = tempDir.resolve("dummy.mp3");

        assertThrows(IllegalArgumentException.class,
                () -> edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", null, targetOutput, null));
        assertThrows(IllegalArgumentException.class,
                () -> edgeTtsRunner.synthesize("vi-VN-HoaiMyNeural", "   ", targetOutput, null));
    }
}
