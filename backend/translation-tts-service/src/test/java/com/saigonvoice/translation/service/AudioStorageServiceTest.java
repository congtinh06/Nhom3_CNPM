package com.saigonvoice.translation.service;

import com.saigonvoice.translation.exception.TtsExecutionException;
import com.saigonvoice.translation.tts.TtsVoiceProvider;
import com.saigonvoice.translation.tts.runner.EdgeTtsRunner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AudioStorageServiceTest {

    @TempDir
    Path tempStorageDir;

    private TtsVoiceProvider voiceProvider;
    private EdgeTtsRunner edgeTtsRunner;
    private AudioStorageServiceImpl storageService;

    private static final String VALID_HASH = "c6058aa86f5e0249240ce39c549bc35cbb64f58bd3cadd00ec4f7cf61206ee2c";
    private static final String HASH_8 = "c6058aa8";

    @BeforeEach
    void setUp() {
        voiceProvider = mock(TtsVoiceProvider.class);
        edgeTtsRunner = mock(EdgeTtsRunner.class);
        when(voiceProvider.getVoice(anyString())).thenReturn("en-US-AvaNeural");

        storageService = new AudioStorageServiceImpl(
                voiceProvider,
                edgeTtsRunner,
                tempStorageDir.toString(),
                ""
        );
    }

    @Test
    @DisplayName("Should synthesize and store audio atomically when file does not exist")
    void testStoreAudio_success() {
        when(edgeTtsRunner.synthesize(eq("en-US-AvaNeural"), eq("Hello World"), any(Path.class), any(Path.class)))
                .thenAnswer(invocation -> {
                    Path out = invocation.getArgument(2);
                    Files.write(out, new byte[]{1, 2, 3, 4, 5});
                    return 12;
                });

        AudioStorageResult result = storageService.storeAudio(101, "en", VALID_HASH, "Hello World");

        assertNotNull(result);
        assertEquals("poi_101_en_" + HASH_8 + ".mp3", result.fileName());
        assertEquals("/api/tts/audio/poi_101_en_" + HASH_8 + ".mp3", result.audioUrl());
        assertEquals(12, result.durationSeconds());
        assertTrue(result.newlyGenerated());
        assertTrue(Files.exists(result.filePath()));
    }

    @Test
    @DisplayName("Should reuse existing non-empty file idempotently without calling edge-tts")
    void testStoreAudio_idempotentReuse() throws IOException {
        String fileName = "poi_101_en_" + HASH_8 + ".mp3";
        Path existingFile = tempStorageDir.resolve(fileName);
        Files.write(existingFile, new byte[]{10, 20, 30});

        AudioStorageResult result = storageService.storeAudio(101, "en", VALID_HASH, "Hello World");

        assertNotNull(result);
        assertEquals(fileName, result.fileName());
        assertEquals("/api/tts/audio/" + fileName, result.audioUrl());
        assertFalse(result.newlyGenerated());

        // edge-tts should NOT have been invoked
        verify(edgeTtsRunner, never()).synthesize(anyString(), anyString(), any(Path.class), any(Path.class));
    }

    @Test
    @DisplayName("Should clean up temp files and leave no partial file when synthesis fails")
    void testStoreAudio_atomicWrite_cleansUpOnRunnerFailure() throws IOException {
        when(edgeTtsRunner.synthesize(anyString(), anyString(), any(Path.class), any(Path.class)))
                .thenAnswer(invocation -> {
                    Path tempOut = invocation.getArgument(2);
                    // Write partial content then fail
                    Files.write(tempOut, new byte[]{9, 9, 9});
                    throw new TtsExecutionException(1, "Synthesizer crashed");
                });

        assertThrows(TtsExecutionException.class, () ->
                storageService.storeAudio(101, "en", VALID_HASH, "Hello World")
        );

        String finalName = "poi_101_en_" + HASH_8 + ".mp3";
        assertFalse(Files.exists(tempStorageDir.resolve(finalName)));

        // Verify no .tmp files remain in the storage directory
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(tempStorageDir)) {
            for (Path path : stream) {
                assertFalse(path.getFileName().toString().startsWith(".tmp_"),
                        "Found leftover temp file: " + path);
            }
        }
    }

    @Test
    @DisplayName("Should reject invalid poiId, lang, contentHash, and text before touching filesystem")
    void testStoreAudio_validationFailures() {
        // Invalid poiId
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(0, "en", VALID_HASH, "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(-5, "en", VALID_HASH, "text"));

        // Invalid lang
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "e", VALID_HASH, "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "EN", VALID_HASH, "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "engl", VALID_HASH, "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "../", VALID_HASH, "text"));

        // Invalid contentHash
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "en", "short_hash", "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "en", VALID_HASH.toUpperCase(), "text"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "en", "../" + VALID_HASH.substring(3), "text"));

        // Blank text
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "en", VALID_HASH, "   "));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.storeAudio(1, "en", VALID_HASH, null));
    }

    @Test
    @DisplayName("Should reject path traversal attempts and invalid formats in resolveAudioPath")
    void testResolveAudioPath_pathTraversalRejected() {
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("../poi_1_vi_12345678.mp3"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("..%2fpoi_1_vi_12345678.mp3"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("/etc/passwd"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("poi_1_vi_12345678.mp3.exe"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("poi_1_vi_12345678.wav"));
        assertThrows(IllegalArgumentException.class, () ->
                storageService.resolveAudioPath("poi_abc_vi_12345678.mp3"));

        // Valid name resolves cleanly inside base dir
        Path resolved = storageService.resolveAudioPath("poi_101_en_" + HASH_8 + ".mp3");
        assertEquals(tempStorageDir.resolve("poi_101_en_" + HASH_8 + ".mp3").normalize(), resolved);
    }

    @Test
    @DisplayName("Should prepend publicBaseUrl when configured")
    void testPublicBaseUrl_prepending() {
        AudioStorageServiceImpl customStorage = new AudioStorageServiceImpl(
                voiceProvider,
                edgeTtsRunner,
                tempStorageDir.toString(),
                "https://cdn.saigonvoice.com/"
        );

        when(edgeTtsRunner.synthesize(anyString(), anyString(), any(Path.class), any(Path.class)))
                .thenAnswer(invocation -> {
                    Files.write(invocation.getArgument(2), new byte[]{1, 2});
                    return null;
                });

        AudioStorageResult result = customStorage.storeAudio(101, "en", VALID_HASH, "Text");
        assertEquals("https://cdn.saigonvoice.com/api/tts/audio/poi_101_en_" + HASH_8 + ".mp3", result.audioUrl());
    }
}
