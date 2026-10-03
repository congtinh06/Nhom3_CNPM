package com.antiphishing.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Số liệu thống kê tổng quan cho trang Stats Dashboard.
 * Tên trường khớp 1-1 với interface `StatsData` ở frontend (types/report.ts).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsResponse {
    private long totalScans;           // Tổng số báo cáo đã ghi nhận
    private long phishingDetected;     // Số báo cáo kết luận là giả mạo (isPhishing = true)
    private String phishingPercentage; // Tỷ lệ giả mạo, ví dụ "24,3%"
    private long safeLinks;            // Số báo cáo kết luận an toàn (isPhishing = false)
    private long webScans;             // Tổng báo cáo kênh WEB
    private long smsScans;             // Tổng báo cáo kênh SMS
    private long webSafe;              // Báo cáo WEB an toàn
    private long webPhishing;          // Báo cáo WEB giả mạo
    private long smsSafe;              // Báo cáo SMS an toàn
    private long smsPhishing;          // Báo cáo SMS giả mạo
}
