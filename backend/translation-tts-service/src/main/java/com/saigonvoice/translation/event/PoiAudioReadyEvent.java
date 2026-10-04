package com.saigonvoice.translation.event;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiAudioReadyEvent implements Serializable {
    private Long poiId;
    private String languageCode;
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private String audioUrl;
    private Integer audioDurationSeconds;
    private String audioStatus; // "READY"
    private String contentHash;
}
