package com.echora.analytics.service;

import com.echora.analytics.dto.AnalyticsSummaryResponse;
import com.echora.analytics.dto.AnalyticsTrendsResponse;

public interface AnalyticsSummaryService {
    AnalyticsSummaryResponse getSummary();

    /**
     * Chuỗi xu hướng theo ngày phục vụ biểu đồ dashboard tổng quan.
     * Ngày mỗi bucket được tính theo múi giờ Việt Nam (UTC+7).
     */
    AnalyticsTrendsResponse getTrends(int days);
}
