package com.echora.translation.event;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiAudioFailedEvent implements Serializable {
    private Long poiId;
    private String languageCode;
    private String audioStatus; // "FAILED_TTS" or "FAILED_TRANSLATION"
    private String errorMessage;
    private String contentHash;

    // Optional fields: sent when translation succeeded but TTS failed
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
}
