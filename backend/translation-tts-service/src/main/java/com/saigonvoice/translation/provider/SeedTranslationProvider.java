package com.saigonvoice.translation.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ConditionalOnProperty(name = "app.translation.provider", havingValue = "seed")
public class SeedTranslationProvider implements TranslationProvider {

    public static final String PROVIDER_NAME = "seed";

    @Override
    public String name() {
        return PROVIDER_NAME;
    }

    @Override
    public TranslatedText translate(String sourceText, String sourceLang, String targetLang) {
        validateLanguages(sourceLang, targetLang);
        if (sourceText == null || sourceText.isBlank()) {
            return new TranslatedText("");
        }
        String cleanTarget = targetLang.trim().toLowerCase(Locale.ROOT);
        return new TranslatedText("[" + cleanTarget + "] " + sourceText);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    private void validateLanguages(String sourceLang, String targetLang) {
        if (sourceLang == null || sourceLang.isBlank()) {
            throw new IllegalArgumentException("sourceLang cannot be null or blank");
        }
        if (targetLang == null || targetLang.isBlank()) {
            throw new IllegalArgumentException("targetLang cannot be null or blank");
        }
        if (sourceLang.trim().equalsIgnoreCase(targetLang.trim())) {
            throw new IllegalArgumentException("Target language cannot be identical to source language: " + sourceLang);
        }
    }
}
