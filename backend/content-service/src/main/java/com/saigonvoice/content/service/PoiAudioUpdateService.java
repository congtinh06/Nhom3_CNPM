package com.saigonvoice.content.service;

import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.event.PoiAudioFailedEvent;
import com.saigonvoice.content.event.PoiAudioReadyEvent;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import com.saigonvoice.content.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Áp kết quả dịch/TTS từ translation-tts-service vào poi_translation (upsert theo poi_id + language_code).
 * - Payload thiếu trường bắt buộc -> AmqpRejectAndDontRequeueException (không retry, sang DLQ ngay).
 * - Không thấy POI -> ResourceNotFoundException (retry, hết lượt sang DLQ). Không return im lặng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PoiAudioUpdateService {

    public static final String STATUS_READY = "READY";
    public static final String STATUS_FAILED_TTS = "FAILED_TTS";

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;

    @Transactional
    public void applyAudioReady(PoiAudioReadyEvent event) {
        List<String> missing = new ArrayList<>();
        if (event == null) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.ready payload: empty body");
        }
        if (event.getPoiId() == null) missing.add("poiId");
        if (isBlank(event.getLanguageCode())) missing.add("languageCode");
        if (isBlank(event.getTitle())) missing.add("title");
        if (isBlank(event.getSummary())) missing.add("summary");
        if (isBlank(event.getDescription())) missing.add("description");
        if (isBlank(event.getAudioUrl())) missing.add("audioUrl");
        if (!missing.isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.ready payload, missing " + missing);
        }

        String lang = normalizeLang(event.getLanguageCode());
        Poi poi = findPoiOrThrow(event.getPoiId(), "poi.audio.ready");

        PoiTranslation translation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), lang)
                .orElseGet(() -> PoiTranslation.builder().poi(poi).languageCode(lang).build());

        translation.setTitle(event.getTitle());
        translation.setSummary(event.getSummary());
        translation.setDescription(event.getDescription());
        translation.setHistoricalSignificance(event.getHistoricalSignificance());
        translation.setAudioUrl(event.getAudioUrl());
        translation.setAudioDurationSeconds(event.getAudioDurationSeconds() != null ? event.getAudioDurationSeconds() : 0);
        translation.setAudioStatus(STATUS_READY);
        translation.setContentHash(event.getContentHash());
        translation.setUpdatedAt(TimeUtils.nowUtc());
        translationRepository.save(translation);

        log.info("poi.audio.ready applied: poiId={}, lang={}", poi.getId(), lang);
    }

    @Transactional
    public void applyAudioFailed(PoiAudioFailedEvent event) {
        if (event == null || event.getPoiId() == null || isBlank(event.getLanguageCode())) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.failed payload, poiId and languageCode are required");
        }

        String lang = normalizeLang(event.getLanguageCode());
        Poi poi = findPoiOrThrow(event.getPoiId(), "poi.audio.failed");
        boolean hasText = !isBlank(event.getTitle()) && !isBlank(event.getSummary()) && !isBlank(event.getDescription());

        PoiTranslation translation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), lang).orElse(null);
        if (translation == null && !hasText) {
            // Chưa có bản dịch và payload không kèm văn bản: không có gì để lưu, Frontend sẽ fallback bản 'vi'
            log.warn("poi.audio.failed for poiId={}, lang={} has no translation row and no text; nothing stored. error={}",
                    poi.getId(), lang, event.getErrorMessage());
            return;
        }
        if (translation == null) {
            translation = PoiTranslation.builder().poi(poi).languageCode(lang).build();
        }
        if (hasText) {
            translation.setTitle(event.getTitle());
            translation.setSummary(event.getSummary());
            translation.setDescription(event.getDescription());
            translation.setHistoricalSignificance(event.getHistoricalSignificance());
            translation.setContentHash(event.getContentHash());
        }
        translation.setAudioUrl(null);
        translation.setAudioDurationSeconds(0);
        translation.setAudioStatus(STATUS_FAILED_TTS);
        translation.setUpdatedAt(TimeUtils.nowUtc());
        translationRepository.save(translation);

        log.warn("poi.audio.failed applied: poiId={}, lang={}, error={}", poi.getId(), lang, event.getErrorMessage());
    }

    private Poi findPoiOrThrow(Long poiId, String eventName) {
        return poiRepository.findById(poiId)
                .orElseThrow(() -> new ResourceNotFoundException(eventName + " references unknown POI id=" + poiId));
    }

    private static String normalizeLang(String lang) {
        String normalized = lang.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > 10) {
            throw new AmqpRejectAndDontRequeueException("Invalid languageCode: " + lang);
        }
        return normalized;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
