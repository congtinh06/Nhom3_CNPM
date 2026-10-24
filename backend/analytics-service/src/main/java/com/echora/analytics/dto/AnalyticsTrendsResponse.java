package com.echora.analytics.dto;

import lombok.*;

import java.util.List;

/**
 * Chuỗi xu hướng theo ngày phục vụ biểu đồ dashboard tổng quan.
 * Số liệu mỗi ngày được bucket theo múi giờ Việt Nam (UTC+7) để khớp
 * với bucket hiển thị trên trang quản trị.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsTrendsResponse {

    /** Số ngày thực tế của chuỗi (sau khi điền đủ ô trống về 0). */
    private int days;

    /** Chuỗi theo từng ngày, ngày không có sự kiện sẽ có giá trị 0. */
    private List<DailyPointDto> series;

    /** Số liệu của ngày hiện tại (theo múi giờ Việt Nam). */
    private DailyCountsDto today;

    /** Số liệu của ngày trước đó (theo múi giờ Việt Nam) để so sánh % tăng/giảm. */
    private DailyCountsDto yesterday;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyPointDto {
        /** yyyy-MM-dd theo múi giờ Việt Nam. */
        private String date;
        private long visits;
        private long scans;
        private long plays;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyCountsDto {
        private long visits;
        private long scans;
        private long plays;

        public static DailyCountsDto zero() {
            return new DailyCountsDto(0L, 0L, 0L);
        }
    }
}
