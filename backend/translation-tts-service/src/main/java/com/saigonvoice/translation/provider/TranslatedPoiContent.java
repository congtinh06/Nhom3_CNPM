package com.saigonvoice.translation.provider;

public record TranslatedPoiContent(
        String title,
        String summary,
        String description,
        String historicalSignificance
) {
}
