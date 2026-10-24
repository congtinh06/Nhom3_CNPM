package com.echora.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrAudioStatsResponse {

    private Range range;
    private Totals totals;
    private Rates rates;
    private List<SeriesPoint> series;
    private List<KeyCount> triggers;
    private List<KeyCount> languages;
    private List<TopPoi> topPois;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Range {
        private String from;
        private String to;
        private String bucket;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Totals {
        private long scans;
        private long audioPlays;
        private long audioCompleted;
        private long uniqueSessions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Rates {
        private double scanToPlayRate;
        private double completionRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeriesPoint {
        private String bucket;
        private long scans;
        private long plays;
        private long completed;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KeyCount {
        private String key;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopPoi {
        private Long poiId;
        private String name;
        private long scans;
        private long plays;
        private long completed;
        private double scanToPlayRate;
        private double completionRate;
    }
}
