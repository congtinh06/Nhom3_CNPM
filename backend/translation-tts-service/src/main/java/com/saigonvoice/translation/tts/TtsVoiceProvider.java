package com.saigonvoice.translation.tts;

import com.saigonvoice.translation.exception.TtsUnsupportedVoiceException;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "app.tts")
public class TtsVoiceProvider {

    private String command = "edge-tts";
    private long timeoutMs = 30000;
    private Map<String, String> voices = new HashMap<>();

    public String getCommand() {
        return command;
    }

    public void setCommand(String command) {
        this.command = command;
    }

    public long getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(long timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public Map<String, String> getVoices() {
        return voices;
    }

    public void setVoices(Map<String, String> voices) {
        this.voices = voices != null ? voices : new HashMap<>();
    }

    /**
     * Look up configured voice for the given language code.
     * Throws TtsUnsupportedVoiceException if unknown or not configured.
     */
    public String getVoice(String lang) {
        if (lang == null || lang.trim().isEmpty()) {
            throw new TtsUnsupportedVoiceException("Language code cannot be null or empty");
        }
        String normalized = lang.trim().toLowerCase(Locale.ROOT);
        String voice = voices.get(normalized);
        if (voice == null || voice.trim().isEmpty()) {
            throw new TtsUnsupportedVoiceException("No voice configured for language code: " + lang);
        }
        return voice.trim();
    }
}
