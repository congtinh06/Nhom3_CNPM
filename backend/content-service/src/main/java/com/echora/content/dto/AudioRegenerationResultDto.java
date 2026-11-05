package com.echora.content.dto;

import lombok.*;

import java.util.List;

/** Kết quả yêu cầu tạo lại audio cho một POI. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioRegenerationResultDto {

    private Long poiId;
    private List<String> languages;
    private int requestedLanguages;
    private String publishStatus;
    private String message;
}
