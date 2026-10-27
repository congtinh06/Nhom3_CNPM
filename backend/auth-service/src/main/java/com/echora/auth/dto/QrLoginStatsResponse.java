package com.echora.auth.dto;

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
public class QrLoginStatsResponse {

    private Range range;
    private Totals totals;
    private Rates rates;
    private Durations durations;
    private List<SeriesPoint> series;
    private List<StatusCount> statusBreakdown;
    private List<DeviceCount> devices;
    private List<TopUser> topUsers;

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
        private long created;
        private long scanned;
        private long approved;
        private long consumed;
        private long denied;
        private long expired;
        private long cancelled;
        private long pending;
        private long active;
        private long distinctUsers;
        // Het han truoc khi thiet bi di dong quet ma.
        private long expiredUnscanned;
        // Da quet nhung khong xac nhan kip truoc khi ma het han.
        private long expiredScanned;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Rates {
        private double scanRate;
        private double approvalRate;
        private double successRate;
        private double expiredRate;
        private double expiredUnscannedRate;
        private double expiredScannedRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Durations {
        private double averageScanSeconds;
        private double averageApproveSeconds;
        private double averageLoginSeconds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeriesPoint {
        private String bucket;
        private long created;
        private long scanned;
        private long approved;
        private long consumed;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeviceCount {
        private String name;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopUser {
        private Long userId;
        private String fullName;
        private String email;
        private long count;
    }
}
