package com.saigonvoice.content.messaging;

import com.saigonvoice.content.config.RabbitMQConfig;
import com.saigonvoice.content.entity.Poi;
import com.saigonvoice.content.entity.PoiTranslation;
import com.saigonvoice.content.event.PoiAudioFailedEvent;
import com.saigonvoice.content.event.PoiAudioReadyEvent;
import com.saigonvoice.content.repository.PoiRepository;
import com.saigonvoice.content.repository.PoiTranslationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class PoiAudioEventListener {

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_POI_AUDIO_READY)
    @Transactional
    public void handleAudioEvent(Object event) {
        if (event instanceof PoiAudioReadyEvent readyEvent) {
            handleAudioReady(readyEvent);
        } else if (event instanceof PoiAudioFailedEvent failedEvent) {
            handleAudioFailed(failedEvent);
        } else {
            log.warn("Received unknown event type on audio queue: {}", event != null ? event.getClass().getName() : "null");
        }
    }

    private void handleAudioReady(PoiAudioReadyEvent event) {
        log.info("Processing PoiAudioReadyEvent: poiId={}, lang={}, status={}", 
                event.getPoiId(), event.getLanguageCode(), event.getAudioStatus());

        Poi poi = poiRepository.findById(event.getPoiId()).orElse(null);
        if (poi == null) {
            log.error("POI id={} not found when handling audio ready event", event.getPoiId());
            return;
        }

        PoiTranslation translation = translationRepository
                .findByPoiIdAndLanguageCode(event.getPoiId(), event.getLanguageCode())
                .orElse(PoiTranslation.builder()
                        .poi(poi)
                        .languageCode(event.getLanguageCode())
                        .build());

        if (event.getTitle() != null && !event.getTitle().isBlank()) {
            translation.setTitle(event.getTitle());
        }
        if (event.getSummary() != null && !event.getSummary().isBlank()) {
            translation.setSummary(event.getSummary());
        }
        if (event.getDescription() != null && !event.getDescription().isBlank()) {
            translation.setDescription(event.getDescription());
        }
        if (event.getHistoricalSignificance() != null) {
            translation.setHistoricalSignificance(event.getHistoricalSignificance());
        }

        translation.setAudioUrl(event.getAudioUrl());
        translation.setAudioDurationSeconds(event.getAudioDurationSeconds() != null ? event.getAudioDurationSeconds() : 0);
        translation.setAudioStatus(event.getAudioStatus() != null ? event.getAudioStatus() : "READY");
        translation.setContentHash(event.getContentHash());
        translation.setUpdatedAt(LocalDateTime.now());

        translationRepository.save(translation);
        log.info("Successfully updated translation and audio for POI id={}, lang={}", event.getPoiId(), event.getLanguageCode());
    }

    private void handleAudioFailed(PoiAudioFailedEvent event) {
        log.warn("Processing PoiAudioFailedEvent: poiId={}, lang={}, error={}", 
                event.getPoiId(), event.getLanguageCode(), event.getErrorMessage());

        translationRepository.findByPoiIdAndLanguageCode(event.getPoiId(), event.getLanguageCode())
                .ifPresent(translation -> {
                    translation.setAudioStatus(event.getAudioStatus() != null ? event.getAudioStatus() : "FAILED_TTS");
                    translation.setUpdatedAt(LocalDateTime.now());
                    translationRepository.save(translation);
                    log.info("Updated audio status to {} for POI id={}, lang={}", translation.getAudioStatus(), event.getPoiId(), event.getLanguageCode());
                });
    }
}
