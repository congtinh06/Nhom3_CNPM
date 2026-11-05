package com.echora.content.service;

import com.echora.content.entity.Poi;
import com.echora.content.entity.PoiTranslation;
import com.echora.content.entity.TranslationSource;
import com.echora.content.event.PoiAudioFailedEvent;
import com.echora.content.event.PoiAudioProgressEvent;
import com.echora.content.event.PoiAudioReadyEvent;
import com.echora.content.exception.ResourceNotFoundException;
import com.echora.content.repository.PoiRepository;
import com.echora.content.repository.PoiTranslationRepository;
import com.echora.content.util.ContentHashUtils;
import com.echora.content.util.TimeUtils;
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
    public static final String STATUS_GENERATING = "GENERATING";
    public static final String STATUS_FAILED_TTS = "FAILED_TTS";
    public static final String STATUS_FAILED = "FAILED";

    private final PoiRepository poiRepository;
    private final PoiTranslationRepository translationRepository;

    /**
     * Đánh dấu ngôn ngữ đang tổng hợp audio. Event chỉ có tác dụng khi hash còn khớp nội dung
     * nguồn hiện tại; event đến muộn của phiên bản cũ bị bỏ qua.
     */
    @Transactional
    public void applyAudioGenerating(PoiAudioProgressEvent event) {
        if (event == null) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.progress payload: empty body");
        }
        List<String> missing = new ArrayList<>();
        if (event.getPoiId() == null) missing.add("poiId");
        if (isBlank(event.getLanguageCode())) missing.add("languageCode");
        if (isBlank(event.getContentHash())) missing.add("contentHash");
        if (!missing.isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.progress payload, missing " + missing);
        }

        String lang = normalizeLang(event.getLanguageCode());
        Poi poi = findPoiOrThrow(event.getPoiId(), "poi.audio.progress");

        PoiTranslation viTranslation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), "vi")
                .orElse(null);
        if (viTranslation == null) {
            log.warn("Missing source 'vi' translation for POI id={}, cannot verify contentHash for poi.audio.progress (lang={}). Rejecting to DLQ.",
                    poi.getId(), lang);
            throw new AmqpRejectAndDontRequeueException("Missing source 'vi' translation for POI id=" + poi.getId());
        }

        String expectedHash = expectedHashFor(poi.getId(), lang, viTranslation);
        if (!event.getContentHash().equalsIgnoreCase(expectedHash)) {
            log.info("Ignoring stale poi.audio.progress for poiId={}, lang={}: event hash {} does not match current content hash {}",
                    poi.getId(), lang, event.getContentHash(), expectedHash);
            return;
        }

        PoiTranslation translation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), lang).orElse(null);
        if (translation == null) {
            // Bản dịch chưa tồn tại: poi.audio.ready sau đó sẽ tạo hàng mới. Không tạo hàng rỗng ở đây
            // vì các cột title/summary/description là NOT NULL.
            log.info("poi.audio.progress for poiId={}, lang={} has no translation row yet; waiting for ready event",
                    poi.getId(), lang);
            return;
        }
        if (STATUS_READY.equalsIgnoreCase(translation.getAudioStatus())
                && event.getContentHash().equalsIgnoreCase(translation.getContentHash())) {
            log.info("Ignoring late poi.audio.progress for poiId={}, lang={}: translation is already READY with matching contentHash {}",
                    poi.getId(), lang, event.getContentHash());
            return;
        }

        translation.setAudioStatus(STATUS_GENERATING);
        translation.setAudioUrl(null);
        translation.setAudioDurationSeconds(0);
        translation.setAudioErrorReason(null);
        translation.setAudioLastAttemptAt(TimeUtils.nowUtc());
        translation.setUpdatedAt(TimeUtils.nowUtc());
        translationRepository.save(translation);

        log.info("poi.audio.progress applied: poiId={}, lang={}", poi.getId(), lang);
    }

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
        if (isBlank(event.getContentHash())) missing.add("contentHash");
        if (!missing.isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.ready payload, missing " + missing);
        }

        String lang = normalizeLang(event.getLanguageCode());
        Poi poi = findPoiOrThrow(event.getPoiId(), "poi.audio.ready");

        // Kiểm tra contentHash so với nội dung tiếng Việt hiện tại trong DB
        PoiTranslation viTranslation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), "vi")
                .orElse(null);
        if (viTranslation == null) {
            log.warn("Missing source 'vi' translation for POI id={}, cannot verify contentHash for poi.audio.ready (lang={}). Rejecting to DLQ.",
                    poi.getId(), lang);
            throw new AmqpRejectAndDontRequeueException("Missing source 'vi' translation for POI id=" + poi.getId());
        }

        String expectedHash = expectedHashFor(poi.getId(), lang, viTranslation);
        if (!event.getContentHash().equalsIgnoreCase(expectedHash)) {
            log.info("Ignoring stale poi.audio.ready for poiId={}, lang={}: event hash {} does not match current content hash {}",
                    poi.getId(), lang, event.getContentHash(), expectedHash);
            return;
        }

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
        translation.setAudioErrorReason(null);
        translation.setAudioLastAttemptAt(TimeUtils.nowUtc());
        translation.setUpdatedAt(TimeUtils.nowUtc());
        translationRepository.save(translation);

        log.info("poi.audio.ready applied: poiId={}, lang={}", poi.getId(), lang);
    }

    @Transactional
    public void applyAudioFailed(PoiAudioFailedEvent event) {
        if (event == null) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.failed payload: empty body");
        }
        List<String> missing = new ArrayList<>();
        if (event.getPoiId() == null) missing.add("poiId");
        if (isBlank(event.getLanguageCode())) missing.add("languageCode");
        if (isBlank(event.getContentHash())) missing.add("contentHash");
        if (!missing.isEmpty()) {
            throw new AmqpRejectAndDontRequeueException("Invalid poi.audio.failed payload, missing " + missing);
        }

        String lang = normalizeLang(event.getLanguageCode());
        Poi poi = findPoiOrThrow(event.getPoiId(), "poi.audio.failed");

        // Kiểm tra contentHash so với nội dung tiếng Việt hiện tại trong DB
        PoiTranslation viTranslation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), "vi")
                .orElse(null);
        if (viTranslation == null) {
            log.warn("Missing source 'vi' translation for POI id={}, cannot verify contentHash for poi.audio.failed (lang={}). Rejecting to DLQ.",
                    poi.getId(), lang);
            throw new AmqpRejectAndDontRequeueException("Missing source 'vi' translation for POI id=" + poi.getId());
        }

        String expectedHash = expectedHashFor(poi.getId(), lang, viTranslation);
        if (!event.getContentHash().equalsIgnoreCase(expectedHash)) {
            log.info("Ignoring stale poi.audio.failed for poiId={}, lang={}: event hash {} does not match current content hash {}",
                    poi.getId(), lang, event.getContentHash(), expectedHash);
            return;
        }

        PoiTranslation translation = translationRepository.findByPoiIdAndLanguageCode(poi.getId(), lang).orElse(null);

        // Quy tắc 2: Nếu bản dịch hiện tại đã READY và content_hash của nó bằng đúng event.contentHash:
        // bỏ qua event (failed đến muộn không được hạ cấp bản READY cùng phiên bản)
        if (translation != null
                && STATUS_READY.equalsIgnoreCase(translation.getAudioStatus())
                && event.getContentHash().equalsIgnoreCase(translation.getContentHash())) {
            log.info("Ignoring late poi.audio.failed for poiId={}, lang={}: translation is already READY with matching contentHash {}",
                    poi.getId(), lang, event.getContentHash());
            return;
        }

        boolean hasText = !isBlank(event.getTitle()) && !isBlank(event.getSummary()) && !isBlank(event.getDescription());

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
            translation.setAudioStatus(STATUS_FAILED_TTS);
        } else {
            // Quy tắc 1: Event failed KHÔNG kèm text (hasText = false) mà bản dịch đã tồn tại: text hiện có là của phiên bản cũ,
            // không được gắn FAILED_TTS (trạng thái dùng được). Thay vào đó đặt audio_status = 'FAILED', audio_url = null,
            // cập nhật content_hash, giữ nguyên text.
            translation.setAudioStatus(STATUS_FAILED);
        }
        translation.setContentHash(event.getContentHash());
        translation.setAudioUrl(null);
        translation.setAudioDurationSeconds(0);
        translation.setAudioErrorReason(truncate(event.getErrorMessage(), 500));
        translation.setAudioLastAttemptAt(TimeUtils.nowUtc());
        translation.setUpdatedAt(TimeUtils.nowUtc());
        translationRepository.save(translation);

        log.warn("poi.audio.failed applied: poiId={}, lang={}, status={}, error={}",
                poi.getId(), lang, translation.getAudioStatus(), event.getErrorMessage());
    }

    /**
     * Hash kỳ vọng để đối chiếu event.
     * - Với ngôn ngữ có bản dịch do người viết (translation_source = MANUAL): hash tính từ chính văn bản đó.
     * - Các ngôn ngữ còn lại (dịch máy): hash tính từ bản tiếng Việt nguồn, như quy ước cũ.
     */
    private String expectedHashFor(Long poiId, String lang, PoiTranslation viTranslation) {
        PoiTranslation source = viTranslation;
        if (!"vi".equalsIgnoreCase(lang)) {
            PoiTranslation target = translationRepository.findByPoiIdAndLanguageCode(poiId, lang).orElse(null);
            if (target != null && TranslationSource.MANUAL.name().equalsIgnoreCase(target.getSource())) {
                source = target;
            }
        }
        return ContentHashUtils.computeHash(
                lang,
                source.getTitle(),
                source.getSummary(),
                source.getDescription(),
                source.getHistoricalSignificance()
        );
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

    private static String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
