package com.echora.translation.service;

import com.echora.translation.entity.TranslationJob;
import com.echora.translation.event.AuthoredPoiText;
import com.echora.translation.event.PoiAudioFailedEvent;
import com.echora.translation.event.PoiAudioProgressEvent;
import com.echora.translation.event.PoiAudioReadyEvent;
import com.echora.translation.event.PoiEventPayload;
import com.echora.translation.exception.TranslationException;
import com.echora.translation.exception.TranslationQuotaExceededException;
import com.echora.translation.exception.TtsException;
import com.echora.translation.exception.TtsUnsupportedVoiceException;
import com.echora.translation.messaging.PoiAudioEventPublisher;
import com.echora.translation.provider.TranslatedPoiContent;
import com.echora.translation.repository.TranslationJobRepository;
import com.echora.translation.tts.TtsTextBuilder;
import com.echora.translation.tts.TtsVoiceProvider;
import com.echora.translation.util.ContentHashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.beans.factory.annotation.Value;
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

    // Giá trị mặc định 1 để unit test tạo trực tiếp không phải chờ backoff; Spring ghi đè từ application.yml.
    @Value("${app.tts.retry.max-attempts:3}")
    private int ttsMaxAttempts = 1;

    @Value("${app.tts.retry.initial-backoff-ms:1000}")
    private long ttsInitialBackoffMs = 0;

    @Value("${app.tts.retry.multiplier:2.0}")
    private double ttsBackoffMultiplier = 2.0;

    @Value("${app.tts.retry.max-backoff-ms:8000}")
    private long ttsMaxBackoffMs = 8000;

    @Override
    public void processPoiEvent(PoiEventPayload event) {
        // 1. Validate incoming event
        validateEvent(event);

        boolean force = Boolean.TRUE.equals(event.getForceRegenerate());
        // 2. Build distinct normalized languages list ("vi" always first)
        Set<String> languages = resolveLanguages(event.getTargetLanguages());
        if (force) {
            Set<String> forced = resolveForceLanguages(event.getForceLanguages());
            if (!forced.isEmpty()) {
                languages = forced;
            }
        }
        log.info("Processing POI event for poiId={}, languages={}, force={}", event.getPoiId(), languages, force);

        boolean quotaWarned = false;

        // 3. Process each language INDEPENDENTLY
        for (String lang : languages) {
            try {
                quotaWarned = processLanguage(event, lang, quotaWarned, force);
            } catch (AmqpRejectAndDontRequeueException e) {
                throw e;
            } catch (Exception e) {
                // If the error is a broker/DB or unexpected exception, propagate so retry/DLQ handles it
                log.error("Fatal error processing poiId={}, lang={}: {}", event.getPoiId(), lang, e.getMessage());
                throw e;
            }
        }
    }

    private boolean processLanguage(PoiEventPayload event, String lang, boolean quotaWarned, boolean force) {
        // Ngôn ngữ có văn bản do người viết (MANUAL) được dùng nguyên văn, không dịch máy.
        AuthoredPoiText authored = resolveAuthoredText(event, lang);

        // 4. Hash the narration text that is actually spoken/shown (description only).
        // Title/summary/historicalSignificance are shown elsewhere in the UI (hero/intro),
        // so including them here made the audio drift away from the reading body.
        String sourceDescription = (authored != null) ? authored.getDescription() : event.getDescription();
        String contentHash = ContentHashUtils.computeNarrationHash(lang, sourceDescription);

        // 5. Idempotency on translation_job. Admin force regeneration reopens a DONE job.
        TranslationJob job = getOrCreateJob(event.getPoiId(), lang, contentHash);
        if ("DONE".equals(job.getStatus())) {
            if (!force) {
                log.info("Job already DONE for poiId={}, lang={}, hash={}. Skipping.", event.getPoiId(), lang, contentHash);
                return quotaWarned;
            }
            job.setStatus("RECEIVED");
            job.setAttempts(job.getAttempts() + 1);
            job.setErrorMessage(null);
            job.setUpdatedAt(LocalDateTime.now());
            job = translationJobRepository.save(job);
            log.info("Force regeneration reopens DONE job for poiId={}, lang={}, hash={}",
                    event.getPoiId(), lang, contentHash);
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

        // 8. TTS & Audio Storage: speak exactly the description rendered in the reading
        // section (title/summary already appear in the hero and must not be duplicated).
        String spokenText = TtsTextBuilder.buildNarrationText(targetDescription);
        eventPublisher.publishAudioProgress(PoiAudioProgressEvent.builder()
                .poiId(event.getPoiId())
                .languageCode(lang)
                .audioStatus("GENERATING")
                .contentHash(contentHash)
                .message("Đang tổng hợp audio")
                .build());

        AudioStorageResult storageResult;
        try {
            storageResult = storeAudioWithRetry(event.getPoiId(), lang, contentHash, spokenText, force);
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

    private Set<String> resolveForceLanguages(List<String> forceLanguages) {
        Set<String> languages = new LinkedHashSet<>();
        if (forceLanguages == null) {
            return languages;
        }
        for (String raw : forceLanguages) {
            if (raw == null) {
                continue;
            }
            for (String part : raw.split(",")) {
                String normalized = part.trim().toLowerCase(Locale.ROOT);
                if (normalized.matches("^[a-z]{2,3}$")) {
                    languages.add(normalized);
                }
            }
        }
        return languages;
    }

    private AudioStorageResult storeAudioWithRetry(
            Long poiId, String lang, String contentHash, String spokenText, boolean force) {
        int maxAttempts = Math.max(1, ttsMaxAttempts);
        long backoffMs = Math.max(0, ttsInitialBackoffMs);
        TtsException lastError = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return force
                        ? audioStorageService.storeAudio(poiId, lang, contentHash, spokenText, true)
                        : audioStorageService.storeAudio(poiId, lang, contentHash, spokenText);
            } catch (TtsUnsupportedVoiceException ex) {
                // Lỗi cấu hình giọng đọc: thử lại không giúp gì.
                throw ex;
            } catch (TtsException ex) {
                lastError = ex;
                if (attempt >= maxAttempts) {
                    throw ex;
                }
                log.warn("TTS attempt {}/{} failed for poiId={}, lang={}: {}. Retrying in {}ms",
                        attempt, maxAttempts, poiId, lang, ex.getMessage(), backoffMs);
                sleepBeforeRetry(backoffMs);
                backoffMs = nextBackoff(backoffMs);
            }
        }
        throw lastError != null ? lastError : new TtsException("TTS failed without a specific error");
    }

    private long nextBackoff(long currentBackoffMs) {
        long maxBackoffMs = Math.max(0, ttsMaxBackoffMs);
        double multiplier = ttsBackoffMultiplier > 1.0 ? ttsBackoffMultiplier : 1.0;
        long next = (long) Math.min(maxBackoffMs, Math.max(0, currentBackoffMs) * multiplier);
        return Math.max(0, next);
    }

    private void sleepBeforeRetry(long backoffMs) {
        if (backoffMs <= 0) {
            return;
        }
        try {
            Thread.sleep(backoffMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new TtsException("Interrupted while waiting to retry TTS", ex);
        }
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
