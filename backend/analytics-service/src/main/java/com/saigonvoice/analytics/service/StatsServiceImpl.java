package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.StatsResponse;
import com.saigonvoice.analytics.entity.ReportChannel;
import com.saigonvoice.analytics.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * Nghiệp vụ thống kê tổng quan tính trực tiếp từ report_db
 * (database-per-service: không join chéo sang service khác).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    static final Locale PERCENTAGE_LOCALE = new Locale("vi", "VN");

    private final ReportRepository repository;

    @Override
    @Transactional(readOnly = true)
    public StatsResponse getStats() {
        long totalScans = repository.count();

        // Báo cáo PENDING có isPhishing = null nên không tính vào nhánh an toàn/giả mạo
        long phishingDetected = repository.countByIsPhishing(Boolean.TRUE);
        long safeLinks = repository.countByIsPhishing(Boolean.FALSE);

        long webScans = repository.countByChannel(ReportChannel.WEB);
        long smsScans = repository.countByChannel(ReportChannel.SMS);

        long webSafe = repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.FALSE);
        long webPhishing = repository.countByChannelAndIsPhishing(ReportChannel.WEB, Boolean.TRUE);
        long smsSafe = repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.FALSE);
        long smsPhishing = repository.countByChannelAndIsPhishing(ReportChannel.SMS, Boolean.TRUE);

        // Định dạng kiểu Việt Nam: "24,3%" (dấu phẩy thập phân) khớp với UI cũ
        double percentage = totalScans > 0 ? (phishingDetected * 100.0) / totalScans : 0.0;
        NumberFormat nf = NumberFormat.getNumberInstance(PERCENTAGE_LOCALE);
        nf.setMinimumFractionDigits(1);
        nf.setMaximumFractionDigits(1);
        String phishingPercentage = nf.format(percentage) + "%";

        log.debug("Thống kê: total={}, phishing={}, safe={}, web={}, sms={}",
                totalScans, phishingDetected, safeLinks, webScans, smsScans);

        return StatsResponse.builder()
                .totalScans(totalScans)
                .phishingDetected(phishingDetected)
                .phishingPercentage(phishingPercentage)
                .safeLinks(safeLinks)
                .webScans(webScans)
                .smsScans(smsScans)
                .webSafe(webSafe)
                .webPhishing(webPhishing)
                .smsSafe(smsSafe)
                .smsPhishing(smsPhishing)
                .build();
    }
}
