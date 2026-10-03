package com.saigonvoice.content.event;

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
    private String audioStatus; // "FAILED_TTS"
    private String errorMessage;
}
