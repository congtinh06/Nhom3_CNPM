package com.echora.content.event;

import lombok.*;

import java.io.Serializable;

/** Event tiến trình TTS: content-service chuyển ngôn ngữ sang GENERATING trước khi gọi Edge-TTS. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiAudioProgressEvent implements Serializable {
    private Long poiId;
    private String languageCode;
    private String audioStatus; // "GENERATING"
    private String contentHash;
    private String message;
}
