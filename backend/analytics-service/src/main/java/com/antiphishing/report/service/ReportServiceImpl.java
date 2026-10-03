package com.antiphishing.report.service;

import com.antiphishing.report.client.LinkVerificationClient;
import com.antiphishing.report.dto.CreateReportRequest;
import com.antiphishing.report.dto.ReportResponse;
import com.antiphishing.report.dto.VerifyRequest;
import com.antiphishing.report.dto.VerifyResponse;
import com.antiphishing.report.entity.Report;
import com.antiphishing.report.entity.ReportStatus;
import com.antiphishing.report.messaging.ReportCreatedEvent;
import com.antiphishing.report.messaging.ReportEventPublisher;
import com.antiphishing.report.repository.ReportRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class ReportServiceImpl implements ReportService {

    private static final String DEFAULT_LOCALE = "vi";

    private final ReportRepository repository;
    private final LinkVerificationClient linkVerificationClient;
    private final ReportEventPublisher eventPublisher;

    public ReportServiceImpl(ReportRepository repository,
                             LinkVerificationClient linkVerificationClient,
                             ReportEventPublisher eventPublisher) {
        this.repository = repository;
        this.linkVerificationClient = linkVerificationClient;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ReportResponse createReport(CreateReportRequest request) {
        String targetUrl = request.getTargetUrl().trim();
        Boolean isPhishing = null;
        Double riskScore = null;
        List<String> reasonCodes = null;
        ReportStatus status = ReportStatus.PENDING;
        String locale = (request.getLocale() == null || request.getLocale().isBlank())
                ? DEFAULT_LOCALE
                : request.getLocale().trim().toLowerCase();

        // 1. Gọi đồng bộ sang link-verification-service qua OpenFeign
        try {
            log.debug("Gọi link-verification-service xác thực URL: {}", targetUrl);
            VerifyResponse verifyRes = linkVerificationClient.verify(new VerifyRequest(targetUrl));
            if (verifyRes != null) {
                isPhishing = verifyRes.isPhishing();
                riskScore = verifyRes.getRiskScore();
                reasonCodes = verifyRes.getReasonCodes();
                status = ReportStatus.VERIFIED;
            }
        } catch (Exception e) {
            // Graceful degradation: Không sập 500, lưu lại trạng thái PENDING để phân tích sau
            log.warn("Không thể kết nối hoặc xác thực từ link-verification-service: {}. Đánh dấu báo cáo trạng thái PENDING.", e.getMessage());
            status = ReportStatus.PENDING;
        }

        // 2. Lưu vào PostgreSQL
        Report report = Report.builder()
                .targetUrl(targetUrl)
                .channel(request.getChannel())
                .reporterContact(request.getReporterContact().trim())
                .description(request.getDescription())
                .isPhishing(isPhishing)
                .riskScore(riskScore)
                .status(status)
                .createdAt(Instant.now())
                .build();

        Report savedReport = repository.save(report);

        // 3. Bắn sự kiện bất đồng bộ lên RabbitMQ (kèm reasonCodes + locale cho narration-service)
        ReportCreatedEvent event = ReportCreatedEvent.builder()
                .reportId(savedReport.getId())
                .targetUrl(savedReport.getTargetUrl())
                .channel(savedReport.getChannel())
                .reporterContact(savedReport.getReporterContact())
                .isPhishing(savedReport.getIsPhishing())
                .riskScore(savedReport.getRiskScore())
                .reasonCodes(reasonCodes)
                .locale(locale)
                .createdAt(savedReport.getCreatedAt())
                .build();

        eventPublisher.publish(event);

        return mapToResponse(savedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getAllReports() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id) {
        Report report = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo với mã ID: " + id));
        return mapToResponse(report);
    }

    private ReportResponse mapToResponse(Report r) {
        return ReportResponse.builder()
                .id(r.getId())
                .targetUrl(r.getTargetUrl())
                .channel(r.getChannel())
                .reporterContact(r.getReporterContact())
                .description(r.getDescription())
                .isPhishing(r.getIsPhishing())
                .riskScore(r.getRiskScore())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
