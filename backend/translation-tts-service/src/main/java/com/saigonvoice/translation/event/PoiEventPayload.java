package com.saigonvoice.translation.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PoiEventPayload implements Serializable {
    private Long poiId;
    private String poiCode;
    private Long zoneId;
    private String sourceLanguage;
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private List<String> targetLanguages;
}
