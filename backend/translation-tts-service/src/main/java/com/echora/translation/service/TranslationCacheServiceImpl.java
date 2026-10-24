package com.echora.translation.service;

import com.echora.translation.entity.TranslationCache;
import com.echora.translation.exception.TranslationPayloadLimitException;
import com.echora.translation.exception.TranslationProviderException;
import com.echora.translation.provider.TranslatedPoiContent;
import com.echora.translation.provider.TranslatedText;
import com.echora.translation.provider.TranslationProvider;
import com.echora.translation.repository.TranslationCacheRepository;
import com.echora.translation.util.ContentHashUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
public class TranslationCacheServiceImpl implements TranslationCacheService {

    public static final String SOURCE_LANGUAGE = "vi";
    public static final int MAX_TITLE_LENGTH = 255;
    public static final int MAX_SUMMARY_LENGTH = 1000;

    private final TranslationCacheRepository translationCacheRepository;
    private final TranslationProvider translationProvider;
    private final TranslationGlossary translationGlossary;

    public TranslationCacheServiceImpl(
            TranslationCacheRepository translationCacheRepository,
            TranslationProvider translationProvider
    ) {
        this(translationCacheRepository, translationProvider, new TranslationGlossary());
    }

    @Autowired
    public TranslationCacheServiceImpl(
            TranslationCacheRepository translationCacheRepository,
            TranslationProvider translationProvider,
            TranslationGlossary translationGlossary
    ) {
        this.translationCacheRepository = translationCacheRepository;
        this.translationProvider = translationProvider;
        this.translationGlossary = translationGlossary;
    }

    @Override
    @Transactional
    public TranslatedPoiContent getOrTranslate(
            String targetLang,
            String title,
            String summary,
            String description,
            String historicalSignificance
    ) {
        validateTargetLanguage(targetLang);

        String cleanTarget = targetLang.trim().toLowerCase(Locale.ROOT);
        String contentHash = ContentHashUtils.computeHash(cleanTarget, title, summary, description, historicalSignificance);

        Optional<String> glossaryTitleOpt = translationGlossary.lookup(title, cleanTarget);

        Optional<TranslationCache> existing = translationCacheRepository.findByContentHash(contentHash);
        if (existing.isPresent()) {
            TranslationCache cache = existing.get();
            log.info("Translation cache HIT for contentHash={} (targetLang={})", contentHash, cleanTarget);
            String finalTitle = glossaryTitleOpt.orElseGet(cache::getTitle);
            return new TranslatedPoiContent(
                    finalTitle,
                    cache.getSummary(),
                    cache.getDescription(),
                    cache.getHistoricalSignificance()
            );
        }

        log.info("Translation cache MISS for contentHash={}, calling provider '{}' for targetLang={}",
                contentHash, translationProvider.name(), cleanTarget);

        // 1. Translate Title
        String transTitle;
        if (glossaryTitleOpt.isPresent()) {
            transTitle = glossaryTitleOpt.get();
            log.info("Glossary HIT for title '{}' (targetLang={}): '{}'", title, cleanTarget, transTitle);
        } else {
            TranslatedText transTitleResult = translationProvider.translate(title, SOURCE_LANGUAGE, cleanTarget);
            String resultText = transTitleResult != null ? transTitleResult.text() : "";
            if (resultText == null || resultText.trim().isEmpty()) {
                throw new TranslationProviderException("Translated title is empty for targetLang=" + cleanTarget);
            }
            if (resultText.length() > MAX_TITLE_LENGTH) {
                throw new TranslationPayloadLimitException(
                        "Translated title length (" + resultText.length() + ") exceeds maximum column limit (" + MAX_TITLE_LENGTH + ")"
                );
            }
            transTitle = resultText;
        }

        // 2. Translate Summary
        String transSummary = "";
        if (summary != null && !summary.isBlank()) {
            TranslatedText transSummaryResult = translationProvider.translate(summary, SOURCE_LANGUAGE, cleanTarget);
            transSummary = transSummaryResult != null ? transSummaryResult.text() : "";
        }
        if (transSummary.length() > MAX_SUMMARY_LENGTH) {
            throw new TranslationPayloadLimitException(
                    "Translated summary length (" + transSummary.length() + ") exceeds maximum column limit (" + MAX_SUMMARY_LENGTH + ")"
            );
        }

        // 3. Translate Description
        String transDesc = "";
        if (description != null && !description.isBlank()) {
            TranslatedText transDescResult = translationProvider.translate(description, SOURCE_LANGUAGE, cleanTarget);
            transDesc = transDescResult != null ? transDescResult.text() : "";
        }

        // 4. Translate Historical Significance
        String transHist = null;
        if (historicalSignificance != null && !historicalSignificance.isBlank()) {
            TranslatedText transHistResult = translationProvider.translate(historicalSignificance, SOURCE_LANGUAGE, cleanTarget);
            transHist = (transHistResult != null && !transHistResult.text().isBlank()) ? transHistResult.text() : null;
        }

        // Store "" (not null) for empty summary/description as per contract
        String finalSummary = transSummary != null ? transSummary : "";
        String finalDesc = transDesc != null ? transDesc : "";

        if (translationProvider.cacheable()) {
            TranslationCache entity = TranslationCache.builder()
                    .contentHash(contentHash)
                    .languageCode(cleanTarget)
                    .title(transTitle)
                    .summary(finalSummary)
                    .description(finalDesc)
                    .historicalSignificance(transHist)
                    .build();

            try {
                translationCacheRepository.save(entity);
                log.info("Saved translation cache entry for contentHash={} (targetLang={})", contentHash, cleanTarget);
            } catch (DataIntegrityViolationException e) {
                log.info("Concurrent insert collision for contentHash={}, reading saved entity", contentHash);
                return findCached(contentHash).map(cached -> new TranslatedPoiContent(
                        glossaryTitleOpt.orElse(cached.title()),
                        cached.summary(),
                        cached.description(),
                        cached.historicalSignificance()
                )).orElse(new TranslatedPoiContent(transTitle, finalSummary, finalDesc, transHist));
            }
        } else {
            log.debug("Translation provider '{}' is not cacheable; skipping cache save for contentHash={}",
                    translationProvider.name(), contentHash);
        }

        return new TranslatedPoiContent(transTitle, finalSummary, finalDesc, transHist);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TranslatedPoiContent> findCached(String contentHash) {
        if (contentHash == null || contentHash.isBlank()) {
            return Optional.empty();
        }
        return translationCacheRepository.findByContentHash(contentHash.trim())
                .map(cache -> new TranslatedPoiContent(
                        cache.getTitle(),
                        cache.getSummary(),
                        cache.getDescription(),
                        cache.getHistoricalSignificance()
                ));
    }

    private void validateTargetLanguage(String targetLang) {
        if (targetLang == null || targetLang.isBlank()) {
            throw new IllegalArgumentException("targetLang cannot be null or blank");
        }
        if (SOURCE_LANGUAGE.equalsIgnoreCase(targetLang.trim())) {
            throw new IllegalArgumentException(
                    "Target language cannot be 'vi'. Vietnamese is the source language and must not be translated by this service."
            );
        }
    }
}
