package com.saigonvoice.translation.service;

import com.saigonvoice.translation.entity.TranslationJob;
import com.saigonvoice.translation.event.AuthoredPoiText;
import com.saigonvoice.translation.event.PoiAudioFailedEvent;
import com.saigonvoice.translation.event.PoiAudioReadyEvent;
import com.saigonvoice.translation.event.PoiEventPayload;
import com.saigonvoice.translation.exception.TranslationException;
import com.saigonvoice.translation.exception.TranslationQuotaExceededException;
import com.saigonvoice.translation.exception.TtsException;
import com.saigonvoice.translation.exception.TtsUnsupportedVoiceException;
import com.saigonvoice.translation.messaging.PoiAudioEventPublisher;
import com.saigonvoice.translation.provider.TranslatedPoiContent;
import com.saigonvoice.translation.repository.TranslationJobRepository;
import com.saigonvoice.translation.tts.TtsTextBuilder;
import com.saigonvoice.translation.tts.TtsVoiceProvider;
import com.saigonvoice.translation.util.ContentHashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiPipelineServiceImpl implements PoiPipelineService {

    private final TranslationCacheService translationCacheService;
    private final AudioStorageService audioStorageService;
    private final TtsVoiceProvider ttsVoiceProvider;
    private final TranslationJobRepository translationJobRepository;
    private final PoiAudioEventPublisher eventPublisher;

    @Override
    public void processPoiEvent(PoiEventPayload event) {
        // 1. Validate incoming event
        validateEvent(event);

        // 2. Build distinct normalized languages list ("vi" always first)
        Set<String> languages = resolveLanguages(event.getTargetLanguages());
        log.info("Processing POI event for poiId={}, languages={}", event.getPoiId(), languages);

        boolean quotaWarned = false;

        // 3. Process each language INDEPENDENTLY
        for (String lang : languages) {
            try {
                quotaWarned = processLanguage(event, lang, quotaWarned);
            } catch (AmqpRejectAndDontRequeueException e) {
                throw e;
            } catch (Exception e) {
                // If the error is a broker/DB or unexpected exception, propagate so retry/DLQ handles it
                log.error("Fatal error processing poiId={}, lang={}: {}", event.getPoiId(), lang, e.getMessage());
                throw e;
            }
        }
    }

    private boolean processLanguage(PoiEventPayload event, String lang, boolean quotaWarned) {
        // Ngôn ngữ có văn bản do người viết (MANUAL) được dùng nguyên văn, không dịch máy.
        AuthoredPoiText authored = resolveAuthoredText(event, lang);

        // 4. Compute contentHash: authored -> from that language's own text; otherwise from Vietnamese source
        String contentHash = (authored != null)
                ? ContentHashUtils.computeHash(
                        lang,
                        authored.getTitle(),
                        authored.getSummary(),
                        authored.getDescription(),
                        authored.getHistoricalSignificance())
                : ContentHashUtils.computeHash(
                        lang,
                        event.getTitle(),
                        event.getSummary(),
                        event.getDescription(),
                        event.getHistoricalSignificance());

        // 5. Idempotency on translation_job
        TranslationJob job = getOrCreateJob(event.getPoiId(), lang, contentHash);
        if ("DONE".equals(job.getStatus())) {
            log.info("Job already DONE for poiId={}, lang={}, hash={}. Skipping.", event.getPoiId(), lang, contentHash);
            return quotaWarned;
        }

        String targetTitle;
        String targetSummary;
        String targetDescription;
        String targetHistorical;

        if (authored != null) {
            // 6a. Authored language: use verbatim, no translation provider
            targetTitle = authored.getTitle();
            targetSummary = authored.getSummary();
            targetDescription = authored.getDescription();
            targetHistorical = authored.getHistoricalSignificance();

            job.setStatus("TRANSLATED");
            job.setUpdatedAt(LocalDateTime.now());
            job = translationJobRepository.save(job);
        } else if ("vi".equals(lang)) {
            // 6b. Language "vi": verbatim, no translation provider
            targetTitle = event.getTitle();
            targetSummary = event.getSummary();
            targetDescription = event.getDescription();
            targetHistorical = event.getHistoricalSignificance();

            job.setStatus("TRANSLATED");
            job.setUpdatedAt(LocalDateTime.now());
            job = translationJobRepository.save(job);
        } else {
            // 7. Check voice support before translation (save quota)
            try {
                ttsVoiceProvider.getVoice(lang);
            } catch (TtsUnsupportedVoiceException ex) {
                log.warn("Voice not supported for language '{}' (poiId={}). Skipping translation.", lang, event.getPoiId());
                markJobFailed(job, "FAILED_TTS", ex.getMessage());
                eventPublisher.publishAudioFailed(PoiAudioFailedEvent.builder()
                        .poiId(event.getPoiId())
                        .languageCode(lang)
                        .audioStatus("FAILED_TTS")
                        .errorMessage("Unsupported voice for language: " + lang)
                        .contentHash(contentHash)
                        .build());
                return quotaWarned;
            }

            // Translate via TranslationCacheService
            try {
                TranslatedPoiContent translated = translationCacheService.getOrTranslate(
                        lang,
                        event.getTitle(),
                        event.getSummary(),
                        event.getDescription(),
                        event.getHistoricalSignificance()
                );
                targetTitle = translated.title();
                targetSummary = translated.summary();
                targetDescription = translated.description();
                targetHistorical = translated.historicalSignificance();

                job.setStatus("TRANSLATED");
                job.setUpdatedAt(LocalDateTime.now());
                job = translationJobRepository.save(job);

            } catch (TranslationQuotaExceededException ex) {
                if (!quotaWarned) {
                    log.warn("Translation quota exceeded for provider when processing POI {}: {}",
                            event.getPoiId(), ex.getMessage());
                    quotaWarned = true;
                }
                markJobFailed(job, "FAILED_TRANSLATION", "Quota exceeded: " + ex.getMessage());
                eventPublisher.publishAudioFailed(PoiAudioFailedEvent.builder()
                        .poiId(event.getPoiId())
                        .languageCode(lang)
                        .audioStatus("FAILED_TRANSLATION")
                        .errorMessage("Translation quota exceeded: " + ex.getMessage())
                        .contentHash(contentHash)
                        .build());
                return quotaWarned;

            } catch (TranslationException ex) {
                log.warn("Translation error for poiId={}, lang={}: {}", event.getPoiId(), lang, ex.getMessage());
                markJobFailed(job, "FAILED_TRANSLATION", ex.getMessage());
                eventPublisher.publishAudioFailed(PoiAudioFailedEvent.builder()
                        .poiId(event.getPoiId())
                        .languageCode(lang)
                        .audioStatus("FAILED_TRANSLATION")
                        .errorMessage(ex.getMessage())
                        .contentHash(contentHash)
                        .build());
                return quotaWarned;
            }
        }

        // 8. TTS & Audio Storage (chỉ đọc tiêu đề + mô tả)
        String spokenText = TtsTextBuilder.buildText(targetTitle, targetDescription);
        AudioStorageResult storageResult;
        try {
            storageResult = audioStorageService.storeAudio(event.getPoiId(), lang, contentHash, spokenText);
        } catch (TtsException ex) {
            log.warn("TTS error for poiId={}, lang={}: {}", event.getPoiId(), lang, ex.getMessage());
            markJobFailed(job, "FAILED_TTS", ex.getMessage());
            // Publish poi.audio.failed WITH text so clients can use Web Speech API
            eventPublisher.publishAudioFailed(PoiAudioFailedEvent.builder()
                    .poiId(event.getPoiId())
                    .languageCode(lang)
                    .audioStatus("FAILED_TTS")
                    .errorMessage(ex.getMessage())
                    .contentHash(contentHash)
                    .title(targetTitle)
                    .summary(targetSummary)
                    .description(targetDescription)
                    .historicalSignificance(targetHistorical)
                    .build());
            return quotaWarned;
        }

        // 9. Success: Publish poi.audio.ready FIRST, and only after the publish call returns normally save status DONE.
        // At-least-once delivery choice:
        // By publishing poi.audio.ready before saving status DONE in DB:
        // - If publishing throws an exception (e.g. broker down), the job remains in status TRANSLATED
        //   (it is never marked DONE) and the exception propagates for retry/DLQ.
        // - If saving status DONE fails after a successful publish: the exception propagates too, and a subsequent
        //   redelivery will republish the event. This at-least-once republish is acceptable because consumers
        //   (content-service) are idempotent on contentHash.
        PoiAudioReadyEvent readyEvent = PoiAudioReadyEvent.builder()
                .poiId(event.getPoiId())
                .languageCode(lang)
                .title(targetTitle)
                .summary(targetSummary)
                .description(targetDescription)
                .historicalSignificance(targetHistorical)
                .audioUrl(storageResult.audioUrl())
                .audioDurationSeconds(storageResult.durationSeconds())
                .audioStatus("READY")
                .contentHash(contentHash)
                .build();

        eventPublisher.publishAudioReady(readyEvent);

        job.setStatus("DONE");
        job.setErrorMessage(null);
        job.setUpdatedAt(LocalDateTime.now());
        translationJobRepository.save(job);

        return quotaWarned;
    }

    private void validateEvent(PoiEventPayload event) {
        if (event == null) {
            throw new AmqpRejectAndDontRequeueException("POI event body cannot be null");
        }
        if (event.getPoiId() == null || event.getPoiId() <= 0) {
            throw new AmqpRejectAndDontRequeueException("poiId must be a positive number, got: " + event.getPoiId());
        }
        if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("POI title is required and cannot be blank");
        }
        if (event.getDescription() == null || event.getDescription().trim().isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("POI description is required and cannot be blank");
        }
        if (event.getTargetLanguages() == null) {
            throw new AmqpRejectAndDontRequeueException("POI targetLanguages cannot be null");
        }
    }

    /**
     * Trả về văn bản do người viết cho ngôn ngữ nếu có và hợp lệ (title + description không rỗng).
     */
    private AuthoredPoiText resolveAuthoredText(PoiEventPayload event, String lang) {
        Map<String, AuthoredPoiText> map = event.getAuthoredTexts();
        if (map == null) {
            return null;
        }
        AuthoredPoiText text = map.get(lang);
        if (text == null) {
            return null;
        }
        if (isBlank(text.getTitle()) || isBlank(text.getDescription())) {
            return null;
        }
        return text;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private Set<String> resolveLanguages(List<String> targetLanguages) {
        Set<String> languages = new LinkedHashSet<>();
        languages.add("vi");
        for (String raw : targetLanguages) {
            if (raw != null) {
                String normalized = raw.trim().toLowerCase(Locale.ROOT);
                if (normalized.matches("^[a-z]{2,3}$")) {
                    languages.add(normalized);
                }
            }
        }
        return languages;
    }

    private TranslationJob getOrCreateJob(Long poiId, String lang, String contentHash) {
        Optional<TranslationJob> existingOpt =
                translationJobRepository.findByPoiIdAndLanguageCodeAndContentHash(poiId, lang, contentHash);

        if (existingOpt.isPresent()) {
            TranslationJob job = existingOpt.get();
            if (!"DONE".equals(job.getStatus())) {
                job.setAttempts(job.getAttempts() + 1);
                job.setUpdatedAt(LocalDateTime.now());
                return translationJobRepository.save(job);
            }
            return job;
        }

        TranslationJob newJob = TranslationJob.builder()
                .poiId(poiId)
                .languageCode(lang)
                .contentHash(contentHash)
                .status("RECEIVED")
                .attempts(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        try {
            return translationJobRepository.save(newJob);
        } catch (DataIntegrityViolationException ex) {
            log.info("Concurrent insert on translation_job for poiId={}, lang={}, hash={}. Re-fetching.",
                    poiId, lang, contentHash);
            return translationJobRepository.findByPoiIdAndLanguageCodeAndContentHash(poiId, lang, contentHash)
                    .orElseThrow(() -> ex);
        }
    }

    private void markJobFailed(TranslationJob job, String status, String error) {
        job.setStatus(status);
        job.setErrorMessage(truncateError(error));
        job.setUpdatedAt(LocalDateTime.now());
        translationJobRepository.save(job);
    }

    private String truncateError(String msg) {
        if (msg == null) {
            return null;
        }
        return msg.length() > 500 ? msg.substring(0, 497) + "..." : msg;
    }
}
