package com.echora.content.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiGuideTranslationDto {

    private String languageCode;
    private String title;
    private String summary;
    private String description;
    private String historicalSignificance;
    private String audioUrl;
    private Integer audioDurationSeconds;
    private String audioStatus;
    private String source;

    // Phân đoạn bài thuyết minh (chap) theo ngôn ngữ, đã sắp theo chapterOrder.
    private List<PoiGuideChapterDto> chapters;
}
