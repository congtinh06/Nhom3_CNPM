package com.echora.content.event;

import lombok.*;

import java.io.Serializable;

/**
 * Payload routing key poi.audio.failed (translation-tts-service -> content-service).
 * Bắt buộc: poiId, languageCode, contentHash.
 * Tùy chọn: title/summary/description/historicalSignificance - gửi kèm khi DỊCH thành công
 * nhưng TTS thất bại, để content-service lưu bản dịch với audio_status = FAILED_TTS
 * (Frontend đọc bản dịch bằng Web Speech API thay cho file MP3).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiAudioFailedEvent implements Serializable {
    private Long poiId;
    private String languageCode;
    private String audioStatus; // "FAILED_TTS"
    private String errorMessage;

    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private String contentHash;
}
