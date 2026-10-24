package com.echora.translation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Proper-noun glossary component loaded at startup.
 * Applies fixed translations to known Vietnamese titles for target languages.
 */
@Slf4j
@Component
public class TranslationGlossary {

    public static final String DEFAULT_GLOSSARY_PATH = "glossary.json";

    // Key: normalized Vietnamese title (trimmed, lowercased with Locale.ROOT)
    // Value: Map of normalized target language code (trimmed, lowercased) -> fixed translated title
    private final Map<String, Map<String, String>> glossaryEntries;

    public TranslationGlossary() {
        this(new ObjectMapper(), DEFAULT_GLOSSARY_PATH);
    }

    public TranslationGlossary(ObjectMapper objectMapper) {
        this(objectMapper, DEFAULT_GLOSSARY_PATH);
    }

    @Autowired
    public TranslationGlossary(
            ObjectMapper objectMapper,
            @Value("${app.translation.glossary-path:glossary.json}") String resourcePath
    ) {
        this.glossaryEntries = loadGlossary(objectMapper, resourcePath);
    }

    /**
     * Look up a fixed translation for a Vietnamese title and target language.
     * Lookup is an EXACT match on the trimmed title, case-insensitive (Locale.ROOT).
     * No substring replacement is performed.
     *
     * @param viTitle    the Vietnamese title to look up
     * @param targetLang the target language code (e.g. "en", "ja", "ko")
     * @return Optional containing the translated title if present in glossary, or empty
     */
    public Optional<String> lookup(String viTitle, String targetLang) {
        if (viTitle == null || targetLang == null) {
            return Optional.empty();
        }
        String cleanTitle = viTitle.trim();
        String cleanLang = targetLang.trim();
        if (cleanTitle.isEmpty() || cleanLang.isEmpty()) {
            return Optional.empty();
        }

        String key = cleanTitle.toLowerCase(Locale.ROOT);
        String lang = cleanLang.toLowerCase(Locale.ROOT);

        Map<String, String> langMap = glossaryEntries.get(key);
        if (langMap == null) {
            return Optional.empty();
        }

        String translated = langMap.get(lang);
        if (translated == null || translated.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(translated);
    }

    private Map<String, Map<String, String>> loadGlossary(ObjectMapper objectMapper, String resourcePath) {
        Map<String, Map<String, String>> normalizedMap = new HashMap<>();
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (!resource.exists()) {
                log.warn("Glossary resource '{}' not found on classpath. Initializing empty glossary.", resourcePath);
                return Collections.emptyMap();
            }

            try (InputStream is = resource.getInputStream()) {
                Map<String, Map<String, String>> rawData = objectMapper.readValue(
                        is,
                        new TypeReference<Map<String, Map<String, String>>>() {}
                );

                if (rawData != null) {
                    for (Map.Entry<String, Map<String, String>> entry : rawData.entrySet()) {
                        String rawTitle = entry.getKey();
                        Map<String, String> rawLangMap = entry.getValue();

                        if (rawTitle != null && !rawTitle.isBlank() && rawLangMap != null) {
                            String normKey = rawTitle.trim().toLowerCase(Locale.ROOT);
                            Map<String, String> normLangMap = new HashMap<>();

                            for (Map.Entry<String, String> langEntry : rawLangMap.entrySet()) {
                                String langCode = langEntry.getKey();
                                String translation = langEntry.getValue();
                                if (langCode != null && translation != null && !translation.isBlank()) {
                                    normLangMap.put(langCode.trim().toLowerCase(Locale.ROOT), translation.trim());
                                }
                            }
                            normalizedMap.put(normKey, Collections.unmodifiableMap(normLangMap));
                        }
                    }
                }
            }
            log.info("Loaded {} proper-noun glossary entries from '{}'", normalizedMap.size(), resourcePath);
        } catch (Exception e) {
            log.error("Failed to load glossary from '{}'", resourcePath, e);
            throw new IllegalStateException("Failed to load translation glossary from " + resourcePath, e);
        }
        return Collections.unmodifiableMap(normalizedMap);
    }
}
