package com.echora.analytics.service;

import com.echora.analytics.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Xoá toàn bộ sự kiện analytics (VISIT/SCAN/AUDIO_PLAY) — dùng cho nút
 * "Đặt lại số liệu" trên dashboard quản trị. Chỉ xóa bảng analytics_event,
 * không đụng dữ liệu của các phân hệ khác.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsAdminResetService {

    private final AnalyticsEventRepository analyticsEventRepository;

    @Transactional
    public long resetAllEvents() {
        int deleted = analyticsEventRepository.deleteAllAnalyticsEvents();
        log.info("Analytics admin reset: deleted {} events from analytics_event", deleted);
        return deleted;
    }
}
