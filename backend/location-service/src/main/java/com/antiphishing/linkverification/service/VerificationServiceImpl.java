package com.antiphishing.linkverification.service;

import com.antiphishing.linkverification.client.GoogleSafeBrowsingClient;
import com.antiphishing.linkverification.client.MockPhishingClient;
import com.antiphishing.linkverification.client.PhishTankClient;
import com.antiphishing.linkverification.client.PhishuntClient;
import com.antiphishing.linkverification.dto.VerifyRequest;
import com.antiphishing.linkverification.dto.VerifyResponse;
import com.antiphishing.linkverification.entity.VerificationResult;
import com.antiphishing.linkverification.repository.VerificationResultRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class VerificationServiceImpl implements VerificationService {

    private final PhishuntClient phishuntClient;
    private final GoogleSafeBrowsingClient googleSafeBrowsingClient;
    private final PhishTankClient phishTankClient;
    private final MockPhishingClient mockPhishingClient;
    private final ReasonCodeDetector reasonCodeDetector;
    private final VerificationResultRepository repository;

    public VerificationServiceImpl(PhishuntClient phishuntClient,
                                   GoogleSafeBrowsingClient googleSafeBrowsingClient,
                                   PhishTankClient phishTankClient,
                                   MockPhishingClient mockPhishingClient,
                                   ReasonCodeDetector reasonCodeDetector,
                                   VerificationResultRepository repository) {
        this.phishuntClient = phishuntClient;
        this.googleSafeBrowsingClient = googleSafeBrowsingClient;
        this.phishTankClient = phishTankClient;
        this.mockPhishingClient = mockPhishingClient;
        this.reasonCodeDetector = reasonCodeDetector;
        this.repository = repository;
    }

    @Override
    @Transactional
    public VerifyResponse verify(VerifyRequest request) {
        String url = request.getUrl().trim();
        String domain = extractDomain(url);

        List<String> flaggedSources = new ArrayList<>();
        int successfulSourceCalls = 0;

        // 1. Phishunt.io (Nguồn chính, không yêu cầu API key)
        try {
            boolean phishuntFlagged = phishuntClient.isFlagged(url);
            successfulSourceCalls++;
            if (phishuntFlagged) {
                flaggedSources.add("PHISHUNT");
            }
        } catch (Exception e) {
            log.warn("Lỗi không lường trước từ Phishunt: {}", e.getMessage());
        }

        // 2. Google Safe Browsing v4
        try {
            boolean gsbFlagged = googleSafeBrowsingClient.isFlagged(url);
            successfulSourceCalls++;
            if (gsbFlagged) {
                flaggedSources.add("GOOGLE_SAFE_BROWSING");
            }
        } catch (Exception e) {
            log.warn("Lỗi không lường trước từ Google Safe Browsing: {}", e.getMessage());
        }

        // 3. PhishTank
        try {
            boolean phishTankFlagged = phishTankClient.isFlagged(url);
            successfulSourceCalls++;
            if (phishTankFlagged) {
                flaggedSources.add("PHISHTANK");
            }
        } catch (Exception e) {
            log.warn("Lỗi không lường trước từ PhishTank: {}", e.getMessage());
        }

        // 4. Kiểm tra Mock Mode dự phòng cho môi trường demo / chấm điểm
        if (mockPhishingClient.isMockMode() && mockPhishingClient.isFlagged(url)) {
            flaggedSources.add("MOCK_SIMULATOR");
            successfulSourceCalls++;
        }

        // Tính toán phán quyết
        boolean isPhishing = !flaggedSources.isEmpty();
        double riskScore = 0.0;
        if (successfulSourceCalls > 0) {
            riskScore = (double) flaggedSources.size() / successfulSourceCalls;
            // Làm tròn 2 chữ số thập phân
            riskScore = Math.round(riskScore * 100.0) / 100.0;
        }

        // Sinh reason codes giải thích kết quả (dùng cho narration-service)
        boolean blacklisted = !flaggedSources.isEmpty();
        List<String> reasonCodes = reasonCodeDetector.detect(url, domain, blacklisted, null);

        Instant checkedAt = Instant.now();
        String sourcesString = String.join(",", flaggedSources);
        String reasonCodesString = String.join(",", reasonCodes);

        // Lưu bản ghi vào PostgreSQL (ràng buộc không join chéo)
        VerificationResult entity = VerificationResult.builder()
                .url(url)
                .domain(domain)
                .isPhishing(isPhishing)
                .riskScore(riskScore)
                .sources(sourcesString)
                .reasonCodes(reasonCodesString)
                .checkedAt(checkedAt)
                .build();

        repository.save(entity);

        log.info("Xác thực URL: {} | Domain: {} | Phishing: {} | RiskScore: {} | Sources: [{}] | ReasonCodes: [{}]",
                url, domain, isPhishing, riskScore, sourcesString, reasonCodesString);

        return VerifyResponse.builder()
                .url(url)
                .domain(domain)
                .isPhishing(isPhishing)
                .riskScore(riskScore)
                .sources(flaggedSources)
                .reasonCodes(reasonCodes)
                .checkedAt(checkedAt)
                .build();
    }

    private String extractDomain(String url) {
        try {
            URI uri = new URI(url);
            String host = uri.getHost();
            if (host != null) {
                return host.startsWith("www.") ? host.substring(4) : host;
            }
        } catch (Exception ignored) {
        }
        // Fallback đơn giản nếu URL dị biệt
        String clean = url.replaceFirst("^(http[s]?://)?(www\\.)?", "");
        int slashIndex = clean.indexOf('/');
        return slashIndex != -1 ? clean.substring(0, slashIndex) : clean;
    }
}
