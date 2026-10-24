package com.echora.content.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPoiTranslationDto {

    private String languageCode;
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private String audioUrl;
    private Integer audioDurationSeconds;
    private String audioStatus;
    private String source;
    private String errorReason;
    private LocalDateTime lastAttemptAt;
}
