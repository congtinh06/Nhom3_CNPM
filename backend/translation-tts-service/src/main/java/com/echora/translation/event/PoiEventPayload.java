package com.echora.translation.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

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
    /** Ngôn ngữ có văn bản do người viết -> dùng nguyên văn, không dịch máy. */
    private Map<String, AuthoredPoiText> authoredTexts;
}
