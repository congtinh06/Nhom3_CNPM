package com.saigonvoice.location.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GoogleSafeBrowsingClient {

    private final RestTemplate restTemplate;

    @Value("${google.safebrowsing.api-key:}")
    private String apiKey;

    @Value("${google.safebrowsing.endpoint:https://safebrowsing.googleapis.com/v4/threatMatches:find}")
    private String endpoint;

    public GoogleSafeBrowsingClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isFlagged(String url) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.debug("Google Safe Browsing API Key chưa được cấu hình, bỏ qua nguồn này.");
            return false;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "client", Map.of(
                            "clientId", "anti-phishing-system",
                            "clientVersion", "1.0"
                    ),
                    "threatInfo", Map.of(
                            "threatTypes", List.of("MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"),
                            "platformTypes", List.of("ANY_PLATFORM"),
                            "threatEntryTypes", List.of("URL"),
                            "threatEntries", List.of(Map.of("url", url))
                    )
            );

            String requestUrl = endpoint + "?key=" + apiKey;
            Map<?, ?> response = restTemplate.postForObject(requestUrl, requestBody, Map.class);

            if (response != null && response.containsKey("matches")) {
                Object matches = response.get("matches");
                if (matches instanceof List<?> list && !list.isEmpty()) {
                    log.info("Google Safe Browsing phát hiện nguy cơ cho URL: {}", url);
                    return true;
                }
            }

            return false;
        } catch (RestClientException e) {
            log.warn("Google Safe Browsing API lỗi hoặc timeout: {}. Bỏ qua.", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Lỗi bất ngờ khi gọi Google Safe Browsing: {}", e.getMessage());
            return false;
        }
    }
}
