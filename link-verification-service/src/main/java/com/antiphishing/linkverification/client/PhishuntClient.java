package com.antiphishing.linkverification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
public class PhishuntClient {

    private final RestTemplate restTemplate;

    @Value("${phishunt.base-url:https://phishunt.io/api/v1}")
    private String baseUrl;

    public PhishuntClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isFlagged(String url) {
        try {
            String endpoint = baseUrl + "/analyze?url=" + URLEncoder.encode(url, StandardCharsets.UTF_8);
            log.debug("Calling Phishunt API: {}", endpoint);
            
            Map<?, ?> body = restTemplate.getForObject(endpoint, Map.class);
            if (body == null) {
                return false;
            }

            // Phishunt API có thể trả về các trường 'suspicious', 'is_suspicious', 'bad', hoặc 'phishing'
            if (Boolean.TRUE.equals(body.get("suspicious")) ||
                Boolean.TRUE.equals(body.get("is_suspicious")) ||
                Boolean.TRUE.equals(body.get("phishing")) ||
                Boolean.TRUE.equals(body.get("bad"))) {
                return true;
            }

            Object verdict = body.get("verdict");
            if (verdict != null && ("phishing".equalsIgnoreCase(verdict.toString()) || "malicious".equalsIgnoreCase(verdict.toString()))) {
                return true;
            }

            return false;
        } catch (RestClientException e) {
            log.warn("Phishunt API lỗi hoặc timeout: {}. Tiếp tục các nguồn khác.", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Lỗi không xác định khi gọi Phishunt: {}", e.getMessage());
            return false;
        }
    }
}
