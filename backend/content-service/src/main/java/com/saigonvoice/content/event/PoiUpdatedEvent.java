package com.saigonvoice.content.event;

import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiUpdatedEvent implements Serializable {
    private Long poiId;
    private String poiCode;
    private Long zoneId;
    private String sourceLanguage; // "vi"
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private List<String> targetLanguages; // e.g. ["en", "ja", "ko"]
}
