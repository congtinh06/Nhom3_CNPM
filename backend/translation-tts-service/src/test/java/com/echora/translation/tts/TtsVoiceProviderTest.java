package com.echora.translation.tts;

import com.echora.translation.exception.TtsUnsupportedVoiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TtsVoiceProviderTest {

    private TtsVoiceProvider voiceProvider;

    @BeforeEach
    void setUp() {
        voiceProvider = new TtsVoiceProvider();
        voiceProvider.setVoices(Map.of(
                "vi", "vi-VN-HoaiMyNeural",
                "en", "en-US-AvaNeural",
                "ja", "ja-JP-NanamiNeural",
                "ko", "ko-KR-SunHiNeural"
        ));
    }

    @Test
    @DisplayName("Should successfully look up configured voices")
    void testGetVoice_success() {
        assertEquals("vi-VN-HoaiMyNeural", voiceProvider.getVoice("vi"));
        assertEquals("en-US-AvaNeural", voiceProvider.getVoice("en"));
        assertEquals("ja-JP-NanamiNeural", voiceProvider.getVoice("ja"));
        assertEquals("ko-KR-SunHiNeural", voiceProvider.getVoice("ko"));
    }

    @Test
    @DisplayName("Should handle case-insensitivity and whitespace in language code")
    void testGetVoice_caseInsensitiveAndTrimmed() {
        assertEquals("vi-VN-HoaiMyNeural", voiceProvider.getVoice(" VI "));
        assertEquals("en-US-AvaNeural", voiceProvider.getVoice("En"));
    }

    @Test
    @DisplayName("Should throw TtsUnsupportedVoiceException for unknown language code")
    void testGetVoice_unknownLanguage_throwsException() {
        TtsUnsupportedVoiceException ex = assertThrows(
                TtsUnsupportedVoiceException.class,
                () -> voiceProvider.getVoice("fr")
        );
        assertTrue(ex.getMessage().contains("fr"));
    }

    @Test
    @DisplayName("Should throw TtsUnsupportedVoiceException for null or blank language code")
    void testGetVoice_nullOrBlankLanguage_throwsException() {
        assertThrows(TtsUnsupportedVoiceException.class, () -> voiceProvider.getVoice(null));
        assertThrows(TtsUnsupportedVoiceException.class, () -> voiceProvider.getVoice("   "));
    }
}
