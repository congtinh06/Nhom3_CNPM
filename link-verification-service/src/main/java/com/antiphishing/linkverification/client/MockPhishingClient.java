package com.antiphishing.linkverification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Slf4j
@Component
public class MockPhishingClient {

    @Value("${verification.mock-mode:false}")
    private boolean mockMode;

    private static final List<String> KNOWN_MOCK_PHISHING_KEYWORDS = List.of(
            "example-bank-fake",
            "fake-bank",
            "phishing",
            "vietcombank-login",
            "techcom-otp",
            "mbbank-online-secure",
            "bidv-ebanking-verify",
            "tpbank-xac-thuc"
    );

    public boolean isMockMode() {
        return mockMode;
    }

    public boolean isFlagged(String url) {
        if (!mockMode) {
            return false;
        }

        String lowerUrl = url.toLowerCase(Locale.ROOT);
        boolean matched = KNOWN_MOCK_PHISHING_KEYWORDS.stream().anyMatch(lowerUrl::contains);
        if (matched) {
            log.info("[MOCK_MODE] URL khớp danh sách từ khóa giả mạo demo: {}", url);
            return true;
        }

        return false;
    }
}
