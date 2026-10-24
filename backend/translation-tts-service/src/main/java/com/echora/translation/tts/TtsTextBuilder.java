package com.echora.translation.tts;

import java.util.ArrayList;
import java.util.List;

public final class TtsTextBuilder {

    private TtsTextBuilder() {
    }

    /**
     * Builds spoken text from the title and description only, in exactly this order,
     * skipping blank/null fields, joined by a blank line ("\n\n").
     * Never returns null.
     */
    public static String buildText(String title, String description) {
        List<String> parts = new ArrayList<>(2);
        appendIfNotBlank(parts, title);
        appendIfNotBlank(parts, description);

        if (parts.isEmpty()) {
            return "";
        }
        return String.join("\n\n", parts);
    }

    private static void appendIfNotBlank(List<String> parts, String text) {
        if (text != null) {
            String trimmed = text.trim();
            if (!trimmed.isEmpty()) {
                parts.add(trimmed);
            }
        }
    }
}
