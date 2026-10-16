package com.saigonvoice.translation.controller;

import com.saigonvoice.translation.service.AudioStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpHeaders;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.ResourceRegionHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AudioControllerTest {

    @TempDir
    Path tempDir;

    private AudioStorageService audioStorageService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        audioStorageService = mock(AudioStorageService.class);
        AudioController controller = new AudioController(audioStorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new ResourceHttpMessageConverter(), new ResourceRegionHttpMessageConverter())
                .build();
    }

    @Test
    @DisplayName("Should return 200 OK with audio/mpeg and Accept-Ranges header for valid file")
    void testGetAudio_success() throws Exception {
        String fileName = "poi_101_en_c6058aa8.mp3";
        Path realFile = tempDir.resolve(fileName);
        Files.write(realFile, new byte[1024]);

        when(audioStorageService.resolveAudioPath(fileName)).thenReturn(realFile);

        mockMvc.perform(get("/api/tts/audio/" + fileName))
                .andExpect(status().isOk())
                .andExpect(content().contentType("audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));

        verify(audioStorageService).resolveAudioPath(fileName);
    }

    @Test
    @DisplayName("Should support HTTP Range request with 206 Partial Content")
    void testGetAudio_withRangeHeader() throws Exception {
        String fileName = "poi_101_en_c6058aa8.mp3";
        Path realFile = tempDir.resolve(fileName);
        Files.write(realFile, new byte[2048]);

        when(audioStorageService.resolveAudioPath(fileName)).thenReturn(realFile);

        mockMvc.perform(get("/api/tts/audio/" + fileName)
                        .header(HttpHeaders.RANGE, "bytes=0-499"))
                .andExpect(status().isPartialContent())
                .andExpect(content().contentType("audio/mpeg"))
                .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
    }

    @Test
    @DisplayName("Should return 404 Not Found when file does not exist")
    void testGetAudio_notFound() throws Exception {
        String fileName = "poi_999_en_12345678.mp3";
        Path nonExistent = tempDir.resolve(fileName);

        when(audioStorageService.resolveAudioPath(fileName)).thenReturn(nonExistent);

        mockMvc.perform(get("/api/tts/audio/" + fileName))
                .andExpect(status().isNotFound())
                .andExpect(header().doesNotExist(HttpHeaders.CACHE_CONTROL));
    }

    @Test
    @DisplayName("Should return 400 Bad Request without touching filesystem for invalid file names")
    void testGetAudio_invalidFileNames_rejectedImmediately() throws Exception {
        String[] invalidNames = {
                "poi_abc_en_12345678.mp3",       // non-numeric poiId
                "poi_1_e_12345678.mp3",          // lang too short
                "poi_1_engl_12345678.mp3",       // lang too long
                "poi_1_EN_12345678.mp3",         // uppercase lang
                "poi_1_vi_1234567.mp3",          // hash7 instead of hash8
                "poi_1_vi_123456789.mp3",        // hash9 instead of hash8
                "poi_1_vi_1234567z.mp3",         // non-hex character
                "poi_1_vi_12345678.wav",         // wrong extension
                "poi_1_vi_12345678.mp3.exe",     // double extension
                "something_else.mp3"
        };

        for (String invalidName : invalidNames) {
            mockMvc.perform(get("/api/tts/audio/" + invalidName))
                    .andExpect(status().isBadRequest())
                    .andExpect(header().doesNotExist(HttpHeaders.CACHE_CONTROL));
        }

        // Verify storageService was never invoked for any of these
        verifyNoInteractions(audioStorageService);
    }
}
