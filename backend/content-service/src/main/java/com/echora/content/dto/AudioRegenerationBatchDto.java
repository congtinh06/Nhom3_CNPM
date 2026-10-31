package com.echora.content.dto;

import lombok.*;

import java.util.List;

/** Kết quả yêu cầu tạo lại audio cho mọi ngôn ngữ chưa READY. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AudioRegenerationBatchDto {

    private int poiCount;
    private int languageCount;
    private int skippedPoiCount;
    private List<Long> poiIds;
    private List<String> failures;
}
