package com.echora.translation.tts;

import java.util.ArrayList;
import java.util.List;

public final class TtsTextBuilder {

    private TtsTextBuilder() {
    }

    /**
     * Builds spoken text from title, summary, description, and historicalSignificance
     * in exactly this order, skipping blank/null fields, joined by a blank line ("\n\n").
     * Never returns null.
     *
     * D1-Fix (Q3): Include all 4 fields so audio guide has complete content context.
     */
    public static String buildText(String title, String summary, String description, String historicalSignificance) {
        List<String> parts = new ArrayList<>(4);
        appendIfNotBlank(parts, title);
        appendIfNotBlank(parts, summary);
        appendIfNotBlank(parts, description);
        appendIfNotBlank(parts, historicalSignificance);

        if (parts.isEmpty()) {
            return "";
        }
        return String.join("\n\n", parts);
    }

    /**
     * Builds the exact narration text rendered in the reading section.
     * The audio must match what the user reads, so only the description is spoken.
     */
    public static String buildNarrationText(String description) {
        return buildText(null, null, description, null);
    }

    /**
     * Legacy overload for backward compatibility (title + description only).
     * Deprecated: use buildText(title, summary, description, historicalSignificance) instead.
     */
    @Deprecated
    public static String buildText(String title, String description) {
        return buildText(title, null, description, null);
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
