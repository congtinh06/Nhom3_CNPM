package com.saigonvoice.content.event;

import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

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
    /** Ngôn ngữ có văn bản do người viết (translation_source = MANUAL) -> dùng nguyên văn. */
    private Map<String, AuthoredPoiText> authoredTexts;
}
