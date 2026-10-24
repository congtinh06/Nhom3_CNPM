package com.echora.analytics.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsSummaryResponse {

    private long totalVisits;
    private Map<String, Long> visitsByTrigger;
    private long onlineVisitors;
    private long totalScans;
    private Map<String, Long> scansByTrigger;
    private long totalAudioPlays;
    private long audioCompleted;
    private Map<String, Long> playsByLanguage;
    private List<TopPoiDto> topPois;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopPoiDto {
        private Long poiId;
        private String name;
        private long scans;
        private long plays;
    }
}
