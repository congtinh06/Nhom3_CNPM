package com.echora.translation.provider;

public interface TranslationProvider {

    String name();

    TranslatedText translate(String sourceText, String sourceLang, String targetLang);

    default boolean cacheable() {
        return true;
    }
}
