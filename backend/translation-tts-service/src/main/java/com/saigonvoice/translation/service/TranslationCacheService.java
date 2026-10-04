package com.saigonvoice.translation.service;

import com.saigonvoice.translation.provider.TranslatedPoiContent;

import java.util.Optional;

public interface TranslationCacheService {

    TranslatedPoiContent getOrTranslate(
            String targetLang,
            String title,
            String summary,
            String description,
            String historicalSignificance
    );

    Optional<TranslatedPoiContent> findCached(String contentHash);
}
